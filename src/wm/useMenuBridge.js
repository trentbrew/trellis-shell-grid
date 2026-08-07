import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { tauri } from '../tauri'

/**
 * Native menu bridge — routes `menu://command` events from the Rust menu
 * through the same wm actions as the palette and keydown (one registry,
 * three input surfaces — turtlecode pattern).
 */
export function useMenuBridge(wm, onOpenPalette) {
  useEffect(() => {
    if (!tauri.isTauri) return
    let unlisten = null
    let cancelled = false

    const mapCommand = (id) => {
      switch (id) {
        case 'new-terminal':
          wm.addWindow({ kind: 'terminal' })
          break
        case 'close-window':
          if (wm.focusId) wm.removeWindow(wm.focusId)
          break
        case 'clear-all':
          wm.clearWindows()
          break
        case 'palette':
          onOpenPalette()
          break
        case 'toggle-zen':
          wm.toggleZen()
          break
        default: {
          const layout = id.startsWith('layout-') ? id.slice('layout-'.length) : null
          if (layout) wm.setMode(layout)
        }
      }
    }

    listen('menu://command', (e) => {
      if (!cancelled) mapCommand(String(e.payload))
    }).then((fn) => {
      unlisten = fn
    })

    return () => {
      cancelled = true
      unlisten?.()
    }
    // wm actions are stable useCallbacks; palette toggle is stable setter wrapper
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
