import { rect } from '../model'

/**
 * Niri-style horizontal scrolling columns.
 * Focused window is centered; neighbors sit in a strip.
 */
export function layoutNiri({
  windows,
  viewport,
  focusId,
  gap = 16,
  padY = 24,
  columnRatio = 0.72,
}) {
  const list = windows.filter((w) => !w.minimized)
  const rects = {}
  if (!list.length) return { rects, camera: { x: 0, y: 0, zoom: 1 } }

  const colW = Math.min(viewport.w * columnRatio, Math.max(320, viewport.w - 120))
  const colH = viewport.h - padY * 2
  const focusIdx = Math.max(
    0,
    list.findIndex((w) => w.id === focusId),
  )

  // center focused column in viewport
  const originX = viewport.w / 2 - colW / 2 - focusIdx * (colW + gap)

  list.forEach((win, i) => {
    const x = Math.round(originX + i * (colW + gap))
    const dist = Math.abs(i - focusIdx)
    rects[win.id] = rect(x, padY, colW, colH, {
      visible: true,
      opacity: dist === 0 ? 1 : 0.5,
      scale: 1,
      z: 100 - dist,
    })
  })

  return { rects, camera: { x: 0, y: 0, zoom: 1 } }
}
