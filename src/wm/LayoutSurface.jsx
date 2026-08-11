import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { WindowFrame } from './WindowFrame'
import { WORLD_CAMERA_MODES, DIRECT_GEOMETRY_MODES, RESIZABLE_MODES } from './layouts'
import { WINDOW_KINDS } from './model'
import { Minimap } from './Minimap'

const MORPH_MS = 520
const MORPH_EASE = 'cubic-bezier(0.16, 0.8, 0.24, 1)'
const GHOST_MS = 300
const DOT = 24

/**
 * Renders windows at computed rects. Morphs via FLIP on mode change.
 * Canvas (freeform): Figma-style pan/zoom — trackpad swipe pan, pinch zoom.
 */
export function LayoutSurface({
  windows,
  groups,
  layout,
  mode,
  focusId,
  camera,
  viewport,
  morphGen,
  isWorld,
  prevMode,
  onViewport,
  onFocus,
  onClose,
  onMinimize,
  onBringFront,
  onPatchWindow,
  onCamera,
  onZoom,
}) {
  const hostRef = useRef(null)
  const nodeMap = useRef(new Map())
  const prevRects = useRef({})
  const prevMinIds = useRef(new Set())
  const dragRef = useRef(null)
  const spaceRef = useRef(false)
  const panRef = useRef(null)
  const cameraRef = useRef(camera)
  const [ghosts, setGhosts] = useState([])
  const [restoringIds, setRestoringIds] = useState(() => new Set())
  const [isResizing, setIsResizing] = useState(false)
  cameraRef.current = camera

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect
      onViewport({ w, h })
    })
    ro.observe(el)
    onViewport({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [onViewport])

  const rects = layout.rects ?? {}
  const tabs = layout.tabs?.map((t) => {
    const win = windows.find((w) => w.id === t.id)
    const meta = WINDOW_KINDS[win?.kind] ?? WINDOW_KINDS.blank
    return {
      ...t,
      title: win?.title ?? t.id,
      icon: meta.icon,
      kind: win?.kind,
    }
  })

  // FLIP on layout mode morph + minimize/restore transitions
  useLayoutEffect(() => {
    const next = rects
    const prev = prevRects.current
    const timers = []

    // Detect newly minimized → spawn shrink-away ghost; newly restored → grow-in
    const minNow = new Set(windows.filter((w) => w.minimized).map((w) => w.id))
    const minPrev = prevMinIds.current
    for (const id of minNow) {
      if (!minPrev.has(id) && prev[id]) {
        spawnGhost(id, prev[id])
      }
    }
    for (const id of minPrev) {
      if (!minNow.has(id)) {
        setRestoringIds((s) => new Set(s).add(id))
        timers.push(
          window.setTimeout(() => {
            setRestoringIds((s) => {
              const n = new Set(s)
              n.delete(id)
              return n
            })
          }, GHOST_MS + 60),
        )
      }
    }
    prevMinIds.current = minNow

    for (const [id, node] of nodeMap.current) {
      const a = prev[id]
      const b = next[id]
      if (!node || !a || !b) continue
      if (b.visible === false && (b.opacity ?? 0) === 0) continue

      const dx = a.x - b.x
      const dy = a.y - b.y
      const sx = b.w ? a.w / b.w : 1
      const sy = b.h ? a.h / b.h : 1

      if (
        Math.abs(dx) < 0.5 &&
        Math.abs(dy) < 0.5 &&
        Math.abs(sx - 1) < 0.008 &&
        Math.abs(sy - 1) < 0.008
      ) {
        continue
      }

      const baseScale = b.scale ?? 1
      node.style.transition = 'none'
      node.style.transformOrigin = 'top left'
      node.style.transform = `translate(${dx}px, ${dy}px) scale(${sx * baseScale}, ${sy * baseScale})`
      void node.offsetWidth
      node.style.transition = `transform ${MORPH_MS}ms ${MORPH_EASE}, opacity ${MORPH_MS}ms ${MORPH_EASE}`
      node.style.transform =
        baseScale !== 1
          ? `translate(0px, 0px) scale(${baseScale})`
          : 'translate(0px, 0px) scale(1)'

      timers.push(
        window.setTimeout(() => {
          if (!node.isConnected) return
          node.style.transition = ''
          if (baseScale === 1) node.style.transform = ''
        }, MORPH_MS + 30),
      )
    }

    prevRects.current = snapshotRects(next)
    return () => timers.forEach((t) => clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morphGen])

  const spawnGhost = (id, a) => {
    const host = hostRef.current
    const gw = 96
    const gh = 22
    const dockX = 10
    const dockY = (host?.clientHeight ?? 600) - gh - 6
    const ghost = {
      id: `${id}-${Date.now()}`,
      from: a,
      to: { x: dockX, y: dockY, w: gw, h: gh },
    }
    setGhosts((gs) => [...gs, ghost])
    window.setTimeout(() => {
      setGhosts((gs) => gs.filter((g) => g.id !== ghost.id))
    }, GHOST_MS + 60)
  }

  useEffect(() => {
    prevRects.current = snapshotRects(layout.rects ?? {})
  }, [layout])

  // Figma-style wheel: pinch/ctrl = zoom toward cursor; otherwise pan
  useEffect(() => {
    const el = hostRef.current
    if (!el || !WORLD_CAMERA_MODES.has(mode)) return

    const onWheel = (e) => {
      e.preventDefault()
      const cam = cameraRef.current
      const bounds = el.getBoundingClientRect()
      const mx = e.clientX - bounds.left
      const my = e.clientY - bounds.top

      // Pinch-to-zoom (trackpad) reports ctrlKey; cmd+scroll also zooms
      const isZoom = e.ctrlKey || e.metaKey

      if (isZoom) {
        // deltaY is typically small for pinch; normalize
        const intensity = Math.exp(-e.deltaY * 0.01)
        const nextZoom = clamp(cam.zoom * intensity, 0.15, 4)
        const worldX = (mx - cam.x) / cam.zoom
        const worldY = (my - cam.y) / cam.zoom
        onCamera({
          zoom: nextZoom,
          x: mx - worldX * nextZoom,
          y: my - worldY * nextZoom,
        })
        return
      }

      // Two-finger swipe / mouse wheel → pan (Figma default)
      onCamera({
        x: cam.x - e.deltaX,
        y: cam.y - e.deltaY,
      })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [mode, onCamera])

  // space / middle-button / empty-canvas drag pan + touch pinch
  useEffect(() => {
    const el = hostRef.current
    if (!el || !WORLD_CAMERA_MODES.has(mode)) return

    const pointers = new Map()
    let pinch = null

    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        spaceRef.current = true
        el.classList.add('can-pan')
        e.preventDefault()
      }
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        spaceRef.current = false
        panRef.current = null
        el.classList.remove('can-pan', 'is-panning')
      }
    }

    const startPan = (e) => {
      const cam = cameraRef.current
      panRef.current = {
        px: e.clientX,
        py: e.clientY,
        cx: cam.x,
        cy: cam.y,
      }
      el.classList.add('is-panning')
      el.setPointerCapture?.(e.pointerId)
    }

    const onDown = (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

      // two-finger touch pinch setup
      if (pointers.size === 2) {
        const pts = [...pointers.values()]
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        const midX = (pts[0].x + pts[1].x) / 2
        const midY = (pts[0].y + pts[1].y) / 2
        const cam = cameraRef.current
        const bounds = el.getBoundingClientRect()
        pinch = {
          dist,
          zoom: cam.zoom,
          x: cam.x,
          y: cam.y,
          mx: midX - bounds.left,
          my: midY - bounds.top,
        }
        panRef.current = null
        return
      }

      const onEmpty = e.target === el || e.target.classList?.contains('layout-layer')
      const space = spaceRef.current
      if (e.button === 1 || (e.button === 0 && space) || (e.button === 0 && onEmpty && e.pointerType !== 'touch')) {
        e.preventDefault()
        startPan(e)
      }
    }

    const onMove = (e) => {
      if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }

      if (pinch && pointers.size >= 2) {
        const pts = [...pointers.values()]
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        if (pinch.dist > 0) {
          const nextZoom = clamp(pinch.zoom * (dist / pinch.dist), 0.15, 4)
          const worldX = (pinch.mx - pinch.x) / pinch.zoom
          const worldY = (pinch.my - pinch.y) / pinch.zoom
          onCamera({
            zoom: nextZoom,
            x: pinch.mx - worldX * nextZoom,
            y: pinch.my - worldY * nextZoom,
          })
        }
        return
      }

      const p = panRef.current
      if (!p) return
      onCamera({
        x: p.cx + (e.clientX - p.px),
        y: p.cy + (e.clientY - p.py),
      })
    }

    const onUp = (e) => {
      pointers.delete(e.pointerId)
      if (pointers.size < 2) pinch = null
      if (pointers.size === 0) {
        panRef.current = null
        el.classList.remove('is-panning')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [mode, onCamera])

  const onDragStart = (e, win) => {
    if (!DIRECT_GEOMETRY_MODES.has(mode)) return
    if (spaceRef.current) return
    e.preventDefault()
    e.stopPropagation()
    onBringFront(win.id)
    const zoom = isWorld ? camera.zoom : 1
    dragRef.current = {
      id: win.id,
      ox: e.clientX,
      oy: e.clientY,
      x: win.x,
      y: win.y,
      zoom,
    }

    const onMove = (ev) => {
      const d = dragRef.current
      if (!d || d.kind === 'resize') return
      const dx = d.x + (ev.clientX - d.ox) / d.zoom
      const dy = d.y + (ev.clientY - d.oy) / d.zoom
      onPatchWindow(d.id, { x: dx, y: dy })
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onResizeStart = (e, win) => {
    if (!RESIZABLE_MODES.has(mode)) return
    e.preventDefault()
    e.stopPropagation()
    onBringFront(win.id)
    setIsResizing(true)

    dragRef.current = {
      kind: 'resize',
      id: win.id,
      ox: e.clientX,
      oy: e.clientY,
      w: win.w,
      h: win.h,
    }

    const onMove = (ev) => {
      const d = dragRef.current
      if (!d || d.kind !== 'resize') return
      const nw = Math.max(200, d.w + (ev.clientX - d.ox))
      const nh = Math.max(140, d.h + (ev.clientY - d.oy))
      onPatchWindow(d.id, { w: nw, h: nh })
    }
    const onUp = () => {
      dragRef.current = null
      setIsResizing(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const canResize = RESIZABLE_MODES.has(mode)

  const cam = layout.camera ?? camera
  const layerStyle = isWorld
    ? {
      transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`,
      transformOrigin: '0 0',
    }
    : undefined

  // Dot matrix that tracks camera (Figma-like)
  const worldBgStyle = isWorld
    ? {
      backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px),
          radial-gradient(1200px 600px at 50% -10%, rgba(34, 197, 94, 0.04), transparent 55%),
          linear-gradient(180deg, #0c0c0e 0%, #0a0a0b 40%)
        `,
      backgroundSize: `${DOT * cam.zoom}px ${DOT * cam.zoom}px, auto, auto`,
      backgroundPosition: `${cam.x}px ${cam.y}px, 0 0, 0 0`,
    }
    : undefined

  return (
    <div
      ref={hostRef}
      className={`layout-host mode-${mode}${isWorld ? ' is-world' : ''}${isResizing ? ' is-resizing' : ''}`}
      style={worldBgStyle}
    >
      <div className="layout-layer" style={layerStyle}>
        {windows.map((win) => {
          const r = rects[win.id]
          if (!r) return null
          const visible = r.visible !== false
          const opacity = r.opacity ?? (visible ? 1 : 0)
          const scale = r.scale ?? 1
          const z = r.z ?? win.z ?? 1
          const show = visible && opacity > 0.02
          const restoring = restoringIds.has(win.id)
          const restoreStyle = restoring
            ? (() => {
              const host = hostRef.current
              const dockX = 10
              const dockY = (host?.clientHeight ?? 600) - 28
              return {
                '--restore-dx': `${dockX - r.x}px`,
                '--restore-dy': `${dockY - (r.y + r.h)}px`,
              }
            })()
            : undefined

          return (
            <div
              key={win.id}
              ref={(node) => {
                if (node) nodeMap.current.set(win.id, node)
                else nodeMap.current.delete(win.id)
              }}
              className={`win-slot${focusId === win.id ? ' is-focused' : ''}${show ? '' : ' is-hidden'}${restoring ? ' is-restoring' : ''}`}
              style={{
                left: r.x,
                top: r.y,
                width: Math.max(0, r.w),
                height: Math.max(0, r.h),
                zIndex: focusId === win.id ? 1000 + z : z,
                opacity: show ? opacity : 0,
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: restoring ? 'bottom left' : 'top left',
                pointerEvents: show ? 'auto' : 'none',
                ...restoreStyle,
              }}
            >
              <WindowFrame
                win={win}
                groups={groups}
                focused={focusId === win.id}
                expanded={mode === 'niri' && focusId === win.id && Boolean(prevMode)}
                tabs={mode === 'niri' && focusId === win.id ? tabs : undefined}
                onTabClick={onFocus}
                onFocus={(id) => {
                  onFocus(id)
                  onBringFront(id)
                }}
                onClose={onClose}
                onMinimize={onMinimize}
                onDragStart={onDragStart}
                onZoom={onZoom}
                onPatchWindow={onPatchWindow}
                draggable={DIRECT_GEOMETRY_MODES.has(mode)}
                index={windows.indexOf(win)}
                dims={r}
              />
              {canResize && show && (
                <div
                  className="win-resize"
                  onPointerDown={(e) => onResizeStart(e, win)}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
        {ghosts.map((g) => (
          <div
            key={g.id}
            className="win-ghost"
            style={{
              left: g.from.x,
              top: g.from.y,
              width: g.from.w,
              height: g.from.h,
              '--ghost-dx': `${g.to.x - g.from.x}px`,
              '--ghost-dy': `${g.to.y - g.from.y}px`,
              '--ghost-sx': g.to.w / g.from.w,
              '--ghost-sy': g.to.h / g.from.h,
            }}
          />
        ))}
      </div>

      {isWorld && (
        <>
          <Minimap
            windows={windows}
            camera={camera}
            viewport={viewport}
            onCamera={onCamera}
          />
          <div className="canvas-hint" aria-hidden="true">
            swipe pan · pinch zoom · space-drag · 0 reset
          </div>
        </>
      )}
    </div>
  )
}

function snapshotRects(rects) {
  return Object.fromEntries(Object.entries(rects).map(([id, r]) => [id, { ...r }]))
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v))
}
