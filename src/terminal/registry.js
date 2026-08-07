import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

const sessions = new Map()
const viewSinks = new Map()
const sessionWindow = new Map()
const windowSession = new Map()
const statusHandlers = new Set()

/**
 * Register a handler for session lifecycle status changes.
 * handler(windowId, status) with status in: running | stopped | error
 */
export function onTerminalStatus(handler) {
  statusHandlers.add(handler)
  return () => statusHandlers.delete(handler)
}

function emitStatus(windowId, status) {
  for (const h of statusHandlers) {
    try {
      h(windowId, status)
    } catch {
      /* ignore */
    }
  }
}

/**
 * Spawn a real PTY terminal via the Tauri backend.
 * Returns a session id; data streams via `terminal-data` events routed to
 * registered view sinks (multiple windows can view one session).
 */
export async function spawnTerminalSession({ windowId, cwd, cols = 80, rows = 24, shell, args }) {
  const existingId = windowSession.get(windowId)
  if (existingId && sessions.has(existingId)) return existingId

  const result = await invoke('terminal_spawn', { cwd, shell, args, cols, rows })

  if (!result.success) throw new Error('terminal_spawn failed')
  if (sessions.has(result.id)) return result.id

  windowSession.set(windowId, result.id)
  sessionWindow.set(result.id, windowId)
  emitStatus(windowId, 'running')

  const unlisten = await listen('terminal-data', (event) => {
    if (event.payload.id !== result.id) return
    if (!event.payload.data) return
    for (const sink of viewSinks.values()) {
      if (sink.activeSessionId === result.id) {
        sink.write(event.payload.data)
      }
    }
  })

  const unlistenClosed = await listen('terminal-closed', (event) => {
    if (event.payload.id !== result.id) return
    const wid = sessionWindow.get(result.id)
    if (wid) emitStatus(wid, 'stopped')
    sessionWindow.delete(result.id)
    if (wid) windowSession.delete(wid)
    sessions.delete(result.id)
    for (const sink of viewSinks.values()) {
      if (sink.activeSessionId === result.id) sink.onClosed()
    }
  })

  sessions.set(result.id, { unlisten, unlistenClosed })
  return result.id
}

export async function closeTerminalSession(sessionId) {
  const session = sessions.get(sessionId)
  session?.unlisten?.()
  session?.unlistenClosed?.()
  sessions.delete(sessionId)
  const wid = sessionWindow.get(sessionId)
  if (wid) windowSession.delete(wid)
  sessionWindow.delete(sessionId)
  await invoke('terminal_close', { id: sessionId }).catch(console.error)
}

export async function writeTerminalSession(sessionId, data) {
  await invoke('terminal_write', { id: sessionId, data }).catch(console.error)
}

export async function resizeTerminalSession(sessionId, cols, rows) {
  await invoke('terminal_resize', { id: sessionId, cols, rows }).catch(console.error)
}

export function registerTerminalView(viewId, sink) {
  const existing = viewSinks.get(viewId)
  viewSinks.set(viewId, {
    activeSessionId: existing?.activeSessionId ?? null,
    write: sink.write,
    onClosed: sink.onClosed,
  })
}

export function unregisterTerminalView(viewId) {
  viewSinks.delete(viewId)
}

export function setTerminalViewActiveSession(viewId, sessionId) {
  const sink = viewSinks.get(viewId)
  if (!sink) return
  sink.activeSessionId = sessionId
}

export function isTerminalSessionRunning(windowId) {
  const sessionId = windowSession.get(windowId)
  return sessionId != null && sessions.has(sessionId)
}
