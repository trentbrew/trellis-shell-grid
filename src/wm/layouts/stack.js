import { rect } from '../model'

/**
 * Stacked deck — focused on top, others fanned down-right behind.
 */
export function layoutStack({
  windows,
  viewport,
  focusId,
  pad = 48,
  offsetX = 42,
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
  const ordered = [
    ...list.slice(focusIdx + 1),
    ...list.slice(0, focusIdx),
    list[focusIdx],
  ]

  const depth = Math.max(0, ordered.length - 1)
  const baseW = Math.min(
    viewport.w - pad * 2 - offsetX * depth,
    viewport.w * 0.62,
  )
  const baseH = Math.min(
    viewport.h - pad * 2 - offsetY * depth,
    viewport.h * 0.58,
  )
  // anchor so the full fan stays in view
  const fanW = baseW + offsetX * depth
  const fanH = baseH + offsetY * depth
  const originX = (viewport.w - fanW) / 2
  const originY = (viewport.h - fanH) / 2

  ordered.forEach((win, i) => {
    const fromTop = ordered.length - 1 - i
    const x = originX + fromTop * offsetX
    const y = originY + fromTop * offsetY
    const isTop = i === ordered.length - 1
    // shrink behind cards via size, not CSS scale (keeps edges peeking)
    const shrink = fromTop * 10
    rects[win.id] = rect(
      x,
      y,
      Math.max(160, baseW - shrink),
      Math.max(120, baseH - shrink),
      {
        visible: true,
        z: i + 1,
        opacity: isTop ? 1 : Math.max(0.5, 1 - fromTop * 0.12),
      },
    )
  })

  return { rects, camera: { x: 0, y: 0, zoom: 1 } }
}
