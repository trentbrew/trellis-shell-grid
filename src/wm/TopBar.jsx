import {
  AppWindow,
  Box,
  Columns2,
  Grip,
  LayoutGrid,
  Layers,
  PanelTop,
  Plus,
  Square,
  Terminal,
  Trash2,
  Waypoints,
} from 'lucide-react'
import { LAYOUT_MODES, WINDOW_KINDS } from './model'

const MODE_ICONS = {
  grid: LayoutGrid,
  freeform: Grip,
  niri: Columns2,
  floating: AppWindow,
  fibonacci: Waypoints,
  tabs: PanelTop,
  stack: Layers,
}

const KIND_ICONS = {
  blank: Square,
  service: Box,
  terminal: Terminal,
}

export function TopBar({ mode, windows, onMode, onAdd, onClear }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand" aria-hidden="true">
          <span className="brand-mark" />
        </div>
        <span className="brand-name">grid</span>
        <span className="topbar-meta">{windows.length} tiles</span>
        <span className="topbar-meta mode-pill">{mode}</span>
      </div>

      <div className="topbar-modes" role="toolbar" aria-label="Layout modes">
        {LAYOUT_MODES.map((m) => {
          const Icon = MODE_ICONS[m.id] ?? LayoutGrid
          const active = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              className={`mode-btn${active ? ' is-active' : ''}`}
              onClick={() => onMode(m.id)}
              title={`${m.label} (${m.key}) — ${m.hint}`}
              aria-pressed={active}
              aria-label={`${m.label} layout`}
            >
              <Icon size={13} strokeWidth={1.75} />
              <span className="mode-label">{m.label}</span>
              <kbd>{m.key}</kbd>
            </button>
          )
        })}
      </div>

      <div className="topbar-actions" role="toolbar" aria-label="Windows">
        {Object.entries(WINDOW_KINDS).map(([key, meta]) => {
          const Icon = KIND_ICONS[key] ?? Square
          return (
            <button
              key={key}
              type="button"
              className="bar-btn"
              onClick={() => onAdd({ kind: key })}
              aria-label={`Append ${meta.label}`}
              title={`New ${meta.label}`}
            >
              <Plus size={13} strokeWidth={2} />
              <Icon size={13} strokeWidth={1.75} />
              <span>{meta.label}</span>
            </button>
          )
        })}
        <div className="bar-sep" />
        <button
          type="button"
          className="bar-btn bar-btn-ghost"
          onClick={onClear}
          disabled={windows.length === 0}
          aria-label="Clear all"
        >
          <Trash2 size={13} strokeWidth={1.75} />
          <span>Clear</span>
        </button>
      </div>
    </header>
  )
}
