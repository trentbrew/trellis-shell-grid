/** Pluggable content kinds (filegraph-style registry). */
export const WINDOW_KINDS = {
  terminal: {
    label: 'Terminal',
    accent: '#38bdf8',
    icon: 'terminal',
    defaultStatus: 'running',
  },
  service: {
    label: 'Service',
    accent: '#22c55e',
    icon: 'box',
    defaultStatus: 'running',
  },
  note: {
    label: 'Note',
    accent: '#a78bfa',
    icon: 'sticky-note',
    defaultStatus: 'idle',
  },
  browser: {
    label: 'Browser',
    accent: '#f59e0b',
    icon: 'globe',
    defaultStatus: 'idle',
  },
  logs: {
    label: 'Logs',
    accent: '#94a3b8',
    icon: 'scroll-text',
    defaultStatus: 'running',
  },
  blank: {
    label: 'Blank',
    accent: '#71717a',
    icon: 'square',
    defaultStatus: 'idle',
  },
}

export const KIND_LIST = Object.entries(WINDOW_KINDS).map(([id, meta]) => ({
  id,
  ...meta,
}))

/** Health / runtime status for windows. */
export const STATUSES = {
  running: { id: 'running', label: 'Running', color: '#22c55e', pulse: true },
  idle: { id: 'idle', label: 'Idle', color: '#71717a', pulse: false },
  warning: { id: 'warning', label: 'Warning', color: '#f59e0b', pulse: true },
  error: { id: 'error', label: 'Error', color: '#ef4444', pulse: true },
  stopped: { id: 'stopped', label: 'Stopped', color: '#52525b', pulse: false },
}

export const LAYOUT_MODES = [
  { id: 'tabs', label: 'Tabs', hint: 'One at a time' },
  { id: 'stack', label: 'Stack', hint: 'Offset deck' },
  { id: 'niri', label: 'Niri', hint: 'Horizontal strip' },
  { id: 'grid', label: 'Grid', hint: 'Uniform cells' },
  { id: 'fibonacci', label: 'Fibonacci', hint: 'Spiral tile' },
  { id: 'freeform', label: 'Canvas', hint: 'Zoomable freeform' },
]

export const ACTIVE_MODES = LAYOUT_MODES.filter((m) => !m.deprecated)

export const GROUP_COLORS = [
  '#22c55e',
  '#38bdf8',
  '#a78bfa',
  '#f59e0b',
  '#fb7185',
  '#14b8a6',
  '#e879f9',
  '#94a3b8',
]

export const DEFAULT_GROUPS = [
  { id: 'green', label: 'Infra', color: '#22c55e', icon: 'server' },
  { id: 'blue', label: 'Runtime', color: '#38bdf8', icon: 'terminal' },
  { id: 'violet', label: 'Data', color: '#a78bfa', icon: 'database' },
  { id: 'amber', label: 'Draft', color: '#f59e0b', icon: 'pencil' },
  { id: 'rose', label: 'Critical', color: '#fb7185', icon: 'shield-alert' },
]

let _seq = 0
let _spaceSeq = 1
let _groupSeq = 100

export function createGroup(partial = {}) {
  _groupSeq += 1
  return {
    id: partial.id ?? `g-${_groupSeq}`,
    label: partial.label ?? `Group ${_groupSeq}`,
    color: partial.color ?? GROUP_COLORS[_groupSeq % GROUP_COLORS.length],
    icon: partial.icon ?? 'folder',
  }
}

export function createWindow(partial = {}) {
  _seq += 1
  const kind = partial.kind ?? 'terminal'
  const meta = WINDOW_KINDS[kind] ?? WINDOW_KINDS.blank
  const n = _seq
  return {
    id: partial.id ?? `w-${n}-${Math.random().toString(36).slice(2, 6)}`,
    title: partial.title ?? `${meta.label.toLowerCase()}-${n}`,
    x: partial.x ?? 80 + ((n * 40) % 420),
    y: partial.y ?? 60 + ((n * 28) % 280),
    w: partial.w ?? 420,
    h: partial.h ?? 280,
    z: partial.z ?? n,
    status: partial.status ?? meta.defaultStatus ?? 'idle',
    minimized: false,
    content: '',
    ...partial,
    kind,
    groupId: partial.groupId ?? partial.group ?? null,
  }
}

export function createSpace(partial = {}) {
  _spaceSeq += 1
  const n = _spaceSeq
  return {
    id: partial.id ?? `space-${n}`,
    name: partial.name ?? `Space ${n}`,
    mode: partial.mode ?? 'grid',
    windows: partial.windows ?? [],
    focusId: partial.focusId ?? null,
    camera: partial.camera ?? { x: 0, y: 0, zoom: 1 },
    gridSizes: partial.gridSizes ?? {},
  }
}

export function seedMainSpace() {
  const windows = [
    createWindow({
      id: 'w-api',
      kind: 'service',
      title: 'api',
      x: 40,
      y: 40,
      w: 440,
      h: 280,
      groupId: 'green',
      status: 'running',
    }),
    createWindow({
      id: 'w-worker',
      kind: 'service',
      title: 'worker',
      x: 520,
      y: 40,
      w: 440,
      h: 280,
      groupId: 'green',
      status: 'warning',
    }),
    createWindow({
      id: 'w-shell',
      kind: 'terminal',
      title: 'shell',
      x: 1000,
      y: 40,
      w: 480,
      h: 360,
      groupId: 'blue',
      status: 'running',
    }),
    createWindow({
      id: 'w-notes',
      kind: 'note',
      title: 'notes',
      x: 40,
      y: 360,
      w: 440,
      h: 220,
      groupId: 'amber',
      status: 'idle',
    }),
    createWindow({
      id: 'w-logs',
      kind: 'logs',
      title: 'logs',
      x: 520,
      y: 360,
      w: 440,
      h: 240,
      groupId: 'violet',
      status: 'error',
    }),
  ]
  return createSpace({
    id: 'space-1',
    name: 'Main',
    mode: 'grid',
    windows,
    focusId: windows[0].id,
  })
}

export function rect(x, y, w, h, extra = {}) {
  return { x, y, w, h, ...extra }
}

export function groupById(groups, id) {
  if (!id) return null
  return groups.find((g) => g.id === id) ?? null
}
