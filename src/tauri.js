/**
 * Tauri bridge — safe to import in plain-browser dev too.
 * `getCurrentWindow()` is only meaningful when running inside Tauri.
 */
import { getCurrentWindow } from '@tauri-apps/api/window'

const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

let _win = null
function win() {
  if (!isTauri) return null
  if (!_win) _win = getCurrentWindow()
  return _win
}

export const tauri = {
  get isTauri() {
    return isTauri
  },
  async minimize() {
    await win()?.minimize()
  },
  async toggleMaximize() {
    await win()?.toggleMaximize()
  },
  async close() {
    await win()?.close()
  },
  async isMaximized() {
    try {
      return (await win()?.isMaximized()) ?? false
    } catch {
      return false
    }
  },
  async toggleFullscreen() {
    const w = win()
    if (!w) return
    const fs = await w.isFullscreen()
    await w.setFullscreen(!fs)
  },
  async isFullscreen() {
    try {
      return (await win()?.isFullscreen()) ?? false
    } catch {
      return false
    }
  },
}
