import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { tauri } from '../tauri'
import {
  registerTerminalView,
  resizeTerminalSession,
  setTerminalViewActiveSession,
  spawnTerminalSession,
  unregisterTerminalView,
  writeTerminalSession,
} from './registry'

/**
 * Real PTY terminal pane backed by portable-pty in the Tauri backend.
 * Uses a stable view id per window so the session survives window re-layouts
 * and mode morphs (view unmount does NOT kill the PTY).
 */
export function TerminalPane({ windowId, win }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const fitRef = useRef(null)
  const sessionIdRef = useRef(null)
  const [state, setState] = useState('idle') // idle | booting | ready | closed

  useEffect(() => {
    if (!tauri.isTauri) {
      setState('closed')
      return
    }

    const el = containerRef.current
    if (!el) return

    const term = new XTerm({
      allowProposedApi: true,
      cursorBlink: win?.cursorBlink ?? true,
      scrollback: win?.scrollback ?? 1000,
      fontFamily:
        'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      fontSize: 12,
      lineHeight: 1.25,
      theme: {
        background: '#141416',
        foreground: '#d4d4d8',
        cursor: '#22c55e',
        selectionBackground: 'rgba(34, 197, 94, 0.25)',
        black: '#1e1e20',
        red: '#f87171',
        green: '#22c55e',
        yellow: '#fbbf24',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#e4e4e7',
        brightBlack: '#52525b',
        brightRed: '#ef4444',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#93c5fd',
        brightMagenta: '#d8b4fe',
        brightCyan: '#67e8f9',
        brightWhite: '#fafafa',
      },
    })
    termRef.current = term

    const fit = new FitAddon()
    fitRef.current = fit
    term.loadAddon(fit)
    term.loadAddon(new WebLinksAddon())
    const searchAddon = new SearchAddon()
    term.loadAddon(searchAddon)
    const unicode = new Unicode11Addon()
    term.loadAddon(unicode)
    term.unicode.activeVersion = '11'

    term.attachCustomKeyEventHandler(async (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        try {
          const text = await navigator.clipboard.readText()
          const sid = sessionIdRef.current
          if (sid && text) writeTerminalSession(sid, text)
        } catch {
          /* clipboard denied */
        }
        return false
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        const needle = prompt('Find:')
        if (needle) searchAddon.findNext(needle)
        return false
      }
      return true
    })

    const viewId = `win:${windowId}`
    registerTerminalView(viewId, {
      write: (data) => term.write(data),
      onClosed: () => {
        setState('closed')
      },
    })

    term.onData((data) => {
      const sid = sessionIdRef.current
      if (sid) writeTerminalSession(sid, data)
    })

    const init = async () => {
      try {
        setState('booting')
        fit.fit()
        const { cols, rows } = fit.proposeDimensions() ?? { cols: 80, rows: 24 }
        const sessionId = await spawnTerminalSession({
          windowId,
          cwd: win?.cwd,
          cols: Math.max(10, Math.floor(cols)),
          rows: Math.max(3, Math.floor(rows)),
        })
        sessionIdRef.current = sessionId
        setTerminalViewActiveSession(viewId, sessionId)
        setState('ready')
      } catch (err) {
        console.error('terminal spawn failed', err)
        setState('closed')
      }
    }
    init()

    const ro = new ResizeObserver(() => {
      if (!termRef.current) return
      try {
        fit.fit()
        const sid = sessionIdRef.current
        if (sid) {
          const { cols, rows } = fit.proposeDimensions() ?? { cols: 80, rows: 24 }
          resizeTerminalSession(sid, Math.max(10, Math.floor(cols)), Math.max(3, Math.floor(rows)))
        }
      } catch {
        /* ignore */
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      unregisterTerminalView(viewId)
      term.dispose()
      termRef.current = null
    }
  }, [windowId, win?.cwd])

  useEffect(() => {
    if (state === 'ready' && termRef.current) {
      termRef.current.focus()
    }
  }, [state])

  return (
    <div
      ref={containerRef}
      className="term-pane"
      onMouseDown={() => termRef.current?.focus()}
    >
      {state === 'booting' && (
        <div className="term-booting">
          <span className="term-prompt">$</span> spawning shell…
        </div>
      )}
      {state === 'closed' && !tauri.isTauri && (
        <div className="term-booting">
          <span className="term-dim">terminals require the desktop app</span>
        </div>
      )}
    </div>
  )
}
