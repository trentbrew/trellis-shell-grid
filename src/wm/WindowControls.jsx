import { useEffect, useState } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { tauri } from '../tauri'
import { useTrafficLights } from '../platform'

/**
 * Platform-aware window controls rendered inline in the toolbar row.
 * - macOS: native-style traffic lights (close / minimize / fullscreen), left.
 * - Windows/Linux: CSD buttons (min / max / close), right.
 * No-ops in plain-browser dev (tauri.isTauri false).
 */
export function WindowControls() {
  const [maximized, setMaximized] = useState(false)
  const trafficLights = useTrafficLights()

  useEffect(() => {
    if (!tauri.isTauri) return
    let alive = true
    tauri.isMaximized().then((m) => alive && setMaximized(m))
    const onMax = () => alive && setMaximized(true)
    const onUnmax = () => alive && setMaximized(false)
    window.addEventListener('tauri:maximize', onMax)
    window.addEventListener('tauri:unmaximize', onUnmax)
    return () => {
      alive = false
      window.removeEventListener('tauri:maximize', onMax)
      window.removeEventListener('tauri:unmaximize', onUnmax)
    }
  }, [])

  if (!tauri.isTauri) return null

  if (trafficLights) {
    return (
      <div className="window-controls traffic-lights" data-tauri-drag-region>
        <button
          type="button"
          className="tl tl-close"
          onClick={() => tauri.close()}
          aria-label="Close"
        >
          <span aria-hidden="true">×</span>
        </button>
        <button
          type="button"
          className="tl tl-min"
          onClick={() => tauri.minimize()}
          aria-label="Minimize"
        >
          <span aria-hidden="true">−</span>
        </button>
        <button
          type="button"
          className="tl tl-full"
          onClick={() => tauri.toggleFullscreen()}
          aria-label="Fullscreen"
        >
          <span aria-hidden="true">⤢</span>
        </button>
      </div>
    )
  }

  return (
    <div className="window-controls csd-controls" data-tauri-drag-region>
      <button
        type="button"
        className="csd-btn"
        onClick={() => tauri.minimize()}
        aria-label="Minimize"
      >
        <Minus size={13} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className="csd-btn"
        onClick={() => tauri.toggleMaximize()}
        aria-label={maximized ? 'Restore' : 'Maximize'}
      >
        {maximized ? (
          <Square size={10} strokeWidth={1.75} />
        ) : (
          <Square size={11} strokeWidth={1.75} />
        )}
      </button>
      <button
        type="button"
        className="csd-btn csd-close"
        onClick={() => tauri.close()}
        aria-label="Close"
      >
        <X size={13} strokeWidth={1.75} />
      </button>
    </div>
  )
}
