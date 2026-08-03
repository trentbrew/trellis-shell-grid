import { rect } from '../model'

/** Uniform auto-grid — fills viewport, equal cells. */
export function layoutGrid({ windows, viewport, gap = 12, pad = 12 }) {
  const list = windows.filter((w) => !w.minimized)
  const rects = {}
  if (!list.length || viewport.w <= 0 || viewport.h <= 0) return { rects }

  const n = list.length
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  const cellW = (viewport.w - pad * 2 - gap * (cols - 1)) / cols
  const cellH = (viewport.h - pad * 2 - gap * (rows - 1)) / rows

  list.forEach((win, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    rects[win.id] = rect(
      pad + c * (cellW + gap),
      pad + r * (cellH + gap),
      Math.max(80, cellW),
      Math.max(60, cellH),
      { visible: true },
    )
  })

  return { rects, camera: { x: 0, y: 0, zoom: 1 } }
}
