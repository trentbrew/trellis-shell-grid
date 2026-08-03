export const WINDOW_KINDS = {
  blank: { label: 'Blank', accent: '#71717a' },
  service: { label: 'Service', accent: '#22c55e' },
  terminal: { label: 'Terminal', accent: '#38bdf8' },
}

export const LAYOUT_MODES = [
  { id: 'grid', label: 'Grid', key: '1', hint: 'Uniform cells' },
  { id: 'freeform', label: 'Canvas', key: '2', hint: 'Zoomable freeform' },
  { id: 'niri', label: 'Niri', key: '3', hint: 'Horizontal strip' },
  { id: 'floating', label: 'Windows', key: '4', hint: 'Traditional float' },
  { id: 'fibonacci', label: 'Fibonacci', key: '5', hint: 'Spiral tile' },
  { id: 'tabs', label: 'Tabs', key: '6', hint: 'One at a time' },
  { id: 'stack', label: 'Stack', key: '7', hint: 'Offset deck' },
]

let _seq = 0

export function createWindow(partial = {}) {
  _seq += 1
  const kind = partial.kind ?? 'terminal'
  const n = _seq
  return {
    id: partial.id ?? `w-${n}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    title: partial.title ?? `${WINDOW_KINDS[kind]?.label ?? kind}-${n}`.toLowerCase(),
    // freeform / floating world geometry (px in world space)
    x: partial.x ?? 80 + ((n * 40) % 420),
    y: partial.y ?? 60 + ((n * 28) % 280),
    w: partial.w ?? 420,
    h: partial.h ?? 280,
    z: partial.z ?? n,
    minimized: false,
    ...partial,
  }
}

export const SEED_WINDOWS = [
  createWindow({ id: 'w-api', kind: 'service', title: 'api', x: 40, y: 40, w: 440, h: 280 }),
  createWindow({ id: 'w-worker', kind: 'service', title: 'worker', x: 520, y: 40, w: 440, h: 280 }),
  createWindow({ id: 'w-shell', kind: 'terminal', title: 'shell', x: 1000, y: 40, w: 480, h: 360 }),
  createWindow({ id: 'w-notes', kind: 'blank', title: 'notes', x: 40, y: 360, w: 440, h: 220 }),
]

export function rect(x, y, w, h, extra = {}) {
  return { x, y, w, h, ...extra }
}
