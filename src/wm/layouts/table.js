import { rect } from '../model'

const MIN_W = 240
const MIN_H = 120
const GAP = 8
const PAD = 12
const HEADER_H = 28
const ROW_H = 160

export function layoutTable({ windows, viewport, focusId }) {
  const list = windows.filter((w) => !w.minimized)
  const rects = {}

  if (!list.length || viewport.w <= 0 || viewport.h <= 0) {
    return { rects, camera: { x: 0, y: 0, zoom: 1 } }
  }

  const availW = viewport.w - PAD * 2
  const cols = Math.max(1, Math.ceil(availW / MIN_W))
  const cellW = Math.max(MIN_W, (availW - GAP * (cols - 1)) / cols)
  const cellH = Math.max(MIN_H, ROW_H)

  list.forEach((win, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = PAD + col * (cellW + GAP)
    const y = PAD + row * (cellH + GAP) + HEADER_H
    const isFocused = win.id === focusId

    rects[win.id] = rect(
      x,
      y,
      cellW,
      cellH,
      {
        visible: true,
        z: isFocused ? 10 : 1,
        scale: 1,
        opacity: isFocused ? 1 : 0.7,
        tablePosition: { row, col },
      },
    )
  })

  return { rects, camera: { x: 0, y: 0, zoom: 1 } }
}
