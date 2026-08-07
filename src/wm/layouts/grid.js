import { rect } from '../model'

const GAP = 12
const PAD = 12

/**
 * Simple tiling grid: evenly divide viewport among all windows.
 * Each window gets one equal cell. No spans, no drag, no resize.
 */
export function layoutGrid({ windows, viewport }) {
  const list = windows.filter((w) => !w.minimized)
  const rects = {}
  const n = list.length
  if (!n || viewport.w <= 0 || viewport.h <= 0) return { rects }

  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)

  const availW = viewport.w - PAD * 2 - GAP * (cols - 1)
  const availH = viewport.h - PAD * 2 - GAP * (rows - 1)
  const cellW = availW / cols
  const cellH = availH / rows

  list.forEach((win, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    rects[win.id] = rect(
      PAD + col * (cellW + GAP),
      PAD + row * (cellH + GAP),
      cellW,
      cellH,
      { visible: true },
    )
  })

  return { rects, camera: { x: 0, y: 0, zoom: 1 } }
}
