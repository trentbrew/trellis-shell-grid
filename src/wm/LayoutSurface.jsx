import { useEffect, useLayoutEffect, useRef } from 'react'
import { WindowFrame } from './WindowFrame'
import { WORLD_CAMERA_MODES, DIRECT_GEOMETRY_MODES } from './layouts'

const MORPH_MS = 400
const MORPH_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * Renders windows at computed rects. Morphs via FLIP on mode change.
 * Freeform: pan/zoom camera. Floating/freeform: drag chrome to move.
 */
export function LayoutSurface({
  windows,
  layout,
  mode,
  focusId,
  camera,
  morphGen,
  isWorld,
  onViewport,
  onFocus,
  onClose,
  onBringFront,
  onPatchWindow,
  onCamera,
}) {
  const hostRef = useRef(null)
  const nodeMap = useRef(new Map())
  const prevRects = useRef({})
  const dragRef = useRef(null)
  const spaceRef = useRef(false)
  const panRef = useRef(null)

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
  const tabs = layout.tabs

  // FLIP on layout mode morph
  useLayoutEffect(() => {
    const next = rects
    const prev = prevRects.current
    const timers = []

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
        baseScale !== 1 ? `translate(0px, 0px) scale(${baseScale})` : 'translate(0px, 0px) scale(1)'

      timers.push(
        window.setTimeout(() => {
          // hand control back to React style props
          if (!node.isConnected) return
          node.style.transition = ''
          // keep scale if layout wants it; otherwise clear
          if (baseScale === 1) node.style.transform = ''
        }, MORPH_MS + 30),
      )
    }

    prevRects.current = snapshotRects(next)
    return () => timers.forEach((t) => clearTimeout(t))
    // only intentional morph triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morphGen])

  // track latest rects after paint (drag / focus without full morph)
  useEffect(() => {
    prevRects.current = snapshotRects(layout.rects ?? {})
  }, [layout])

  // wheel zoom
  useEffect(() => {
    const el = hostRef.current
    if (!el || !WORLD_CAMERA_MODES.has(mode)) return

    const onWheel = (e) => {
      e.preventDefault()
      const bounds = el.getBoundingClientRect()
      const mx = e.clientX - bounds.left
      const my = e.clientY - bounds.top
      const factor = e.deltaY > 0 ? 0.92 : 1.08
      const nextZoom = clamp(camera.zoom * factor, 0.2, 3.5)
      const worldX = (mx - camera.x) / camera.zoom
      const worldY = (my - camera.y) / camera.zoom
      onCamera({
        zoom: nextZoom,
        x: mx - worldX * nextZoom,
        y: my - worldY * nextZoom,
      })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [mode, camera, onCamera])

  // space / middle-button pan
  useEffect(() => {
    const el = hostRef.current
    if (!el || !WORLD_CAMERA_MODES.has(mode)) return

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
    const onDown = (e) => {
      const space = spaceRef.current
      if (e.button === 1 || (e.button === 0 && space)) {
        e.preventDefault()
        panRef.current = {
          px: e.clientX,
          py: e.clientY,
          cx: camera.x,
          cy: camera.y,
        }
        el.classList.add('is-panning')
      }
    }
    const onMove = (e) => {
      const p = panRef.current
      if (!p) return
      onCamera({
        x: p.cx + (e.clientX - p.px),
        y: p.cy + (e.clientY - p.py),
      })
    }
    const onUp = () => {
      panRef.current = null
      el.classList.remove('is-panning')
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [mode, camera, onCamera])

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
      if (!d) return
      onPatchWindow(d.id, {
        x: d.x + (ev.clientX - d.ox) / d.zoom,
        y: d.y + (ev.clientY - d.oy) / d.zoom,
      })
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const cam = layout.camera ?? camera
  const layerStyle = isWorld
    ? {
        transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`,
        transformOrigin: '0 0',
      }
    : undefined

  const worldGridStyle = isWorld
    ? {
        backgroundPosition: `${cam.x}px ${cam.y}px, ${cam.x}px ${cam.y}px, 0 0, 0 0`,
        backgroundSize: `${64 * cam.zoom}px ${64 * cam.zoom}px, ${64 * cam.zoom}px ${64 * cam.zoom}px, auto, auto`,
      }
    : undefined

  return (
    <div
      ref={hostRef}
      className={`layout-host mode-${mode}${isWorld ? ' is-world' : ''}`}
      style={worldGridStyle}
    >
      {tabs && (
        <div className="tab-strip" role="tablist">
          {tabs.map((t) => {
            const win = windows.find((w) => w.id === t.id)
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.active}
                className={`tab-chip${t.active ? ' is-active' : ''}`}
                style={{
                  left: t.x,
                  top: t.y,
                  width: t.w,
                  height: t.h,
                }}
                onClick={() => onFocus(t.id)}
              >
                {win?.title ?? t.id}
              </button>
            )
          })}
        </div>
      )}

      <div className="layout-layer" style={layerStyle}>
        {windows.map((win) => {
          const r = rects[win.id]
          if (!r) return null
          const visible = r.visible !== false
          const opacity = r.opacity ?? (visible ? 1 : 0)
          const scale = r.scale ?? 1
          const z = r.z ?? win.z ?? 1
          const show = visible && opacity > 0.02

          return (
            <div
              key={win.id}
              ref={(node) => {
                if (node) nodeMap.current.set(win.id, node)
                else nodeMap.current.delete(win.id)
              }}
              className={`win-slot${focusId === win.id ? ' is-focused' : ''}${show ? '' : ' is-hidden'}`}
              style={{
                left: r.x,
                top: r.y,
                width: Math.max(0, r.w),
                height: Math.max(0, r.h),
                zIndex: focusId === win.id ? 1000 + z : z,
                opacity: show ? opacity : 0,
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top left',
                pointerEvents: show ? 'auto' : 'none',
              }}
            >
              <WindowFrame
                win={win}
                focused={focusId === win.id}
                onFocus={(id) => {
                  onFocus(id)
                  onBringFront(id)
                }}
                onClose={onClose}
                onDragStart={onDragStart}
                draggable={DIRECT_GEOMETRY_MODES.has(mode)}
              />
            </div>
          )
        })}
      </div>

      {isWorld && (
        <div className="canvas-hint" aria-hidden="true">
          scroll zoom · space/middle pan · 0 reset
        </div>
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
