import { rect } from '../model'

/**
 * Fibonacci / dwindle spiral tiling.
 * Alternating split direction; first window is primary.
 */
export function layoutFibonacci({ windows, viewport, gap = 10, pad = 12 }) {
  const list = windows.filter((w) => !w.minimized)
  const rects = {}
  if (!list.length) return { rects }

  const area = {
    x: pad,
    y: pad,
    w: viewport.w - pad * 2,
    h: viewport.h - pad * 2,
  }

  if (list.length === 1) {
    rects[list[0].id] = rect(area.x, area.y, area.w, area.h, { visible: true })
    return { rects, camera: { x: 0, y: 0, zoom: 1 } }
  }

  fibSplit(list, area, 0, gap, rects)
  return { rects, camera: { x: 0, y: 0, zoom: 1 } }
}

function fibSplit(wins, area, depth, gap, rects) {
  if (wins.length === 1) {
    rects[wins[0].id] = rect(area.x, area.y, area.w, area.h, { visible: true })
    return
  }

  const [head, ...rest] = wins
  const vertical = depth % 2 === 0
  // golden-ish ratio for spiral feel
  const ratio = rest.length === 1 ? 0.5 : 0.618

  if (vertical) {
    const w1 = Math.max(40, area.w * ratio - gap / 2)
    const w2 = Math.max(40, area.w - w1 - gap)
    rects[head.id] = rect(area.x, area.y, w1, area.h, { visible: true })
    fibSplit(rest, { x: area.x + w1 + gap, y: area.y, w: w2, h: area.h }, depth + 1, gap, rects)
  } else {
    const h1 = Math.max(40, area.h * ratio - gap / 2)
    const h2 = Math.max(40, area.h - h1 - gap)
    rects[head.id] = rect(area.x, area.y, area.w, h1, { visible: true })
    fibSplit(rest, { x: area.x, y: area.y + h1 + gap, w: area.w, h: h2 }, depth + 1, gap, rects)
  }
}
