import { rect } from '../model'

/**
 * Stacked deck — focused on top, others offset downward behind.
 * Circular rotation order: the stack rotates as a unit so all
 * windows move in lockstep during focus transitions.
 */
export function layoutStack({
  windows,
  viewport,
  focusId,
  pad = 28,
  stackOffsetY = 32,
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
  const aspect = viewport.w / viewport.h
  const maxW = viewport.w - pad * 2
  const maxH = viewport.h - pad * 2 - stackOffsetY * depth

  let baseW = maxW
  let baseH = baseW / aspect
  if (baseH > maxH) {
    baseH = maxH
    baseW = baseH * aspect
  }

  const originX = (viewport.w - baseW) / 2
  const totalStackH = baseH + stackOffsetY * depth
  const originY = (viewport.h - totalStackH) / 2

  ordered.forEach((win, i) => {
    const distFromTop = ordered.length - 1 - i
    const scale = Math.max(0.82, 1 - distFromTop * 0.04)
    const x = Math.round(originX)
    const y = Math.round(originY + distFromTop * stackOffsetY)
    const isTop = distFromTop === 0
    rects[win.id] = rect(
      x,
      y,
      Math.round(baseW),
      Math.round(baseH),
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
