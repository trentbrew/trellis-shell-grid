import { rect } from '../model'

/**
 * Freeform zoomable canvas (xyflow-style).
 * Uses each window's world x/y/w/h; camera pans/zooms the surface.
 */
export function layoutFreeform({ windows, camera }) {
  const rects = {}
  const cam = camera ?? { x: 0, y: 0, zoom: 1 }

  for (const win of windows) {
    if (win.minimized) {
      rects[win.id] = rect(0, 0, 0, 0, { visible: false })
      continue
    }
    rects[win.id] = rect(win.x, win.y, win.w, win.h, {
      visible: true,
      world: true,
      z: win.z,
    })
  }

  return { rects, camera: cam, world: true }
}
