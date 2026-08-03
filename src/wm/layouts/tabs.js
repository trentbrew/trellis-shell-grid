import { rect } from '../model'

const TAB_H = 36

/**
 * Tabbed — only focused window fills content area; others hidden.
 * Tab strip geometry is reported separately for chrome.
 */
export function layoutTabs({ windows, viewport, focusId, pad = 10 }) {
  const list = windows.filter((w) => !w.minimized)
  const rects = {}
  const tabs = []

  if (!list.length) return { rects, tabs, camera: { x: 0, y: 0, zoom: 1 } }

  const focus = list.find((w) => w.id === focusId) ?? list[0]
  const contentY = pad + TAB_H + 8
  const contentH = Math.max(80, viewport.h - contentY - pad)
  const contentW = viewport.w - pad * 2

  const tabW = Math.min(160, Math.max(72, (contentW - (list.length - 1) * 6) / list.length))

  list.forEach((win, i) => {
    tabs.push({
      id: win.id,
      x: pad + i * (tabW + 6),
      y: pad,
      w: tabW,
      h: TAB_H,
      active: win.id === focus.id,
    })

    if (win.id === focus.id) {
      rects[win.id] = rect(pad, contentY, contentW, contentH, {
        visible: true,
        z: 10,
      })
    } else {
      rects[win.id] = rect(pad, contentY, contentW, contentH, {
        visible: false,
        opacity: 0,
        z: 0,
      })
    }
  })

  return { rects, tabs, camera: { x: 0, y: 0, zoom: 1 } }
}
