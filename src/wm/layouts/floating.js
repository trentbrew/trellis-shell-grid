import { rect } from '../model'

/**
 * Traditional floating windows — world geometry clamped lightly into view,
 * z-order preserved. Drag/resize mutate window x/y/w/h.
 */
export function layoutFloating({ windows, viewport, pad = 8 }) {
  const rects = {}
  const vw = viewport.w
  const vh = viewport.h

  for (const win of windows) {
    if (win.minimized) {
      rects[win.id] = rect(0, 0, 0, 0, { visible: false })
      continue
    }
    const w = Math.min(win.w, vw - pad * 2)
    const h = Math.min(win.h, vh - pad * 2)
    const x = clamp(win.x, pad, Math.max(pad, vw - w - pad))
    const y = clamp(win.y, pad, Math.max(pad, vh - h - pad))
    rects[win.id] = rect(x, y, w, h, { visible: true, z: win.z })
  }

  return { rects, camera: { x: 0, y: 0, zoom: 1 } }
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}
