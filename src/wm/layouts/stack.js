import { rect } from '../model'

/**
 * Stacked deck — focused on top, others offset behind.
 */
export function layoutStack({
  windows,
  viewport,
  focusId,
  pad = 48,
  offset = 28,
}) {
  const list = windows.filter((w) => !w.minimized)
  const rects = {}
  if (!list.length) return { rects }

  const focusIdx = Math.max(
    0,
    list.findIndex((w) => w.id === focusId),
  )
  // reorder: focus last (top)
  const ordered = [
    ...list.slice(focusIdx + 1),
    ...list.slice(0, focusIdx),
    list[focusIdx],
  ]

  const baseW = Math.min(viewport.w - pad * 2 - offset * 2, viewport.w * 0.78)
  const baseH = Math.min(viewport.h - pad * 2 - offset * 2, viewport.h * 0.72)
  const baseX = (viewport.w - baseW) / 2
  const baseY = (viewport.h - baseH) / 2

  ordered.forEach((win, i) => {
    const fromTop = ordered.length - 1 - i
    const x = baseX + fromTop * offset * 0.35 - (ordered.length - 1) * offset * 0.15
    const y = baseY + fromTop * offset * 0.45
    const scale = 1 - fromTop * 0.03
    const isTop = i === ordered.length - 1
    rects[win.id] = rect(x, y, baseW, baseH, {
      visible: true,
      z: i + 1,
      scale,
      opacity: isTop ? 1 : Math.max(0.4, 1 - fromTop * 0.12),
    })
  })

  return { rects, camera: { x: 0, y: 0, zoom: 1 } }
}
