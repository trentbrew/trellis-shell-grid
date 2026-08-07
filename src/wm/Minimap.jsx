import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MINIMAP_SIZE = 160
const PADDING = 10

/**
 * Minimap for the freeform canvas.
 * Shows all windows in world space with a viewport indicator.
 * Click or drag to pan the camera.
 */
export function Minimap({ windows, camera, viewport, onCamera }) {
  const canvasRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  // Compute bounding box of all windows in world space
  const bounds = useMemo(() => {
    const visible = windows.filter((w) => !w.minimized)
    if (!visible.length) return null

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const w of visible) {
      minX = Math.min(minX, w.x)
      minY = Math.min(minY, w.y)
      maxX = Math.max(maxX, w.x + w.w)
      maxY = Math.max(maxY, w.y + w.h)
    }

    // Include viewport in bounds so indicator doesn't clip
    const vpWorld = screenToWorld({ x: 0, y: 0 }, camera, viewport)
    const vpWorldEnd = screenToWorld({ x: viewport.w, y: viewport.h }, camera, viewport)
    minX = Math.min(minX, vpWorld.x)
    minY = Math.min(minY, vpWorld.y)
    maxX = Math.max(maxX, vpWorldEnd.x)
    maxY = Math.max(maxY, vpWorldEnd.y)

    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
  }, [windows, camera, viewport])

  const scale = useMemo(() => {
    if (!bounds || bounds.w === 0 || bounds.h === 0) return 1
    const s = Math.min(
      (MINIMAP_SIZE - PADDING * 2) / bounds.w,
      (MINIMAP_SIZE - PADDING * 2) / bounds.h,
    )
    return Math.min(s, 1) // never upscale, only downscale
  }, [bounds])

  const toMinimap = useCallback(
    (worldX, worldY) => ({
      x: PADDING + (worldX - bounds.minX) * scale,
      y: PADDING + (worldY - bounds.minY) * scale,
    }),
    [bounds, scale],
  )

  const toWorld = useCallback(
    (mx, my) => ({
      x: bounds.minX + (mx - PADDING) / scale,
      y: bounds.minY + (my - PADDING) / scale,
    }),
    [bounds, scale],
  )

  // Viewport rect in minimap coords
  const vpRect = useMemo(() => {
    if (!bounds) return null
    const tl = toMinimap(
      -camera.x / camera.zoom,
      -camera.y / camera.zoom,
    )
    const br = toMinimap(
      (-camera.x + viewport.w) / camera.zoom,
      (-camera.y + viewport.h) / camera.zoom,
    )
    return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y }
  }, [bounds, camera, viewport, toMinimap])

  const handleNavigate = useCallback(
    (e) => {
      if (!bounds || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const world = toWorld(mx, my)
      onCamera({
        x: -(world.x - viewport.w / (2 * camera.zoom)) * camera.zoom,
        y: -(world.y - viewport.h / (2 * camera.zoom)) * camera.zoom,
      })
    },
    [bounds, viewport, camera, toWorld, onCamera],
  )

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => handleNavigate(e)
    const onUp = () => setDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, handleNavigate])

  if (!bounds) return null

  return (
    <div className="minimap" aria-label="Canvas minimap">
      <svg
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        className="minimap-canvas"
        onPointerDown={(e) => {
          e.preventDefault()
          setDragging(true)
          handleNavigate(e)
        }}
      >
        <rect
          x={0}
          y={0}
          width={MINIMAP_SIZE}
          height={MINIMAP_SIZE}
          className="minimap-bg"
        />
        {windows
          .filter((w) => !w.minimized)
          .map((w) => {
            const pos = toMinimap(w.x, w.y)
            return (
              <rect
                key={w.id}
                x={pos.x}
                y={pos.y}
                width={Math.max(2, w.w * scale)}
                height={Math.max(2, w.h * scale)}
                className="minimap-node"
              />
            )
          })}
        {vpRect && (
          <rect
            x={vpRect.x}
            y={vpRect.y}
            width={vpRect.w}
            height={vpRect.h}
            className="minimap-viewport"
          />
        )}
      </svg>
    </div>
  )
}

function screenToWorld(point, camera, viewport) {
  return {
    x: (point.x - camera.x) / camera.zoom,
    y: (point.y - camera.y) / camera.zoom,
  }
}
