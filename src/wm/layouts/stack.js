import { rect } from '../model'

/**
 * Stacked deck — focused on top, others fanned down-right behind.
 * Circular rotation order: the stack rotates as a unit so all
 * windows move in lockstep during focus transitions.
 */
export function layoutStack({
  windows,
  viewport,
  focusId,
  pad = 48,
  offsetY = 36,
}) {
  const list = windows.filter((w) => !w.minimized)
  const rects = {}
  if (!list.length) return { rects }

  const focusIdx = Math.max(
    0,
    list.findIndex((w) => w.id === focusId),
  )
  // reorder: focus last (painted on top)
  // circular rotation preserves relative order so all windows
  // move in lockstep during focus transitions.
  const ordered = [
    ...list.slice(focusIdx + 1),
    ...list.slice(0, focusIdx),
    list[focusIdx],
  ]

  const depth = Math.max(0, ordered.length - 1)
  const stackDown = 16
  const stackUp = 28
  const baseW = Math.min(
    viewport.w - pad * 2,
    viewport.w * 0.62,
  )
  const baseH = Math.min(
    viewport.h - pad * 2 - stackDown - stackUp * depth,
    viewport.h * 0.68,
  )
  const originX = (viewport.w - baseW) / 2
  const originY = (viewport.h - (baseH + stackDown + stackUp * depth)) / 2 + stackUp * depth

  ordered.forEach((win, i) => {
    const distFromTop = ordered.length - 1 - i
    const shrink = Math.max(0, distFromTop * 10)
    const scale = Math.max(0.78, 1 - distFromTop * 0.03)
    const winW = Math.max(160, baseW - shrink)
    const winH = Math.max(120, baseH - shrink)
    const visualW = Math.round(winW * scale)
    const x = Math.round(originX + (baseW - visualW) / 2 + i * 8)
    const y = Math.round(
      originY + (distFromTop === 0 ? stackDown : distFromTop * -stackUp),
    )
    const isTop = distFromTop === 0
    rects[win.id] = rect(
      x,
      y,
      winW,
      winH,
      {
        visible: true,
        z: i + 1,
        scale,
        opacity: isTop ? 1 : Math.max(0.45, 1 - distFromTop * 0.15),
      },
    )
  })

  return { rects, camera: { x: 0, y: 0, zoom: 1 } }
}
