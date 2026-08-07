import { rect } from '../model'

/**
 * Tabbed — only focused window fills content area; others hidden.
 * Tabs are rendered inside the focused window chrome instead of a separate strip.
 */
export function layoutTabs({ windows, viewport, focusId, pad = 10 }) {
  const list = windows.filter((w) => !w.minimized)
  const rects = {}
  const tabs = []

  if (!list.length) return { rects, tabs, camera: { x: 0, y: 0, zoom: 1 } }

  const focus = list.find((w) => w.id === focusId) ?? list[0]
  const contentW = viewport.w - pad * 2
  const contentH = Math.max(80, viewport.h - pad * 2)

  list.forEach((win) => {
    tabs.push({
      id: win.id,
      active: win.id === focus.id,
    })

    if (win.id === focus.id) {
      rects[win.id] = rect(pad, pad, contentW, contentH, {
        visible: true,
        z: 10,
      })
    } else {
      rects[win.id] = rect(pad, pad, contentW, contentH, {
        visible: false,
        opacity: 0,
        z: 0,
      })
    }
  })

  return { rects, tabs, camera: { x: 0, y: 0, zoom: 1 } }
}
