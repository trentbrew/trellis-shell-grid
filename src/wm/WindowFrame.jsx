import { Box, Grip, Square, Terminal, X } from 'lucide-react'
import { WINDOW_KINDS } from './model'

const ICONS = {
  blank: Square,
  service: Box,
  terminal: Terminal,
}

export function WindowFrame({
  win,
  focused,
  onFocus,
  onClose,
  onDragStart,
  draggable,
}) {
  const meta = WINDOW_KINDS[win.kind] ?? WINDOW_KINDS.blank
  const Icon = ICONS[win.kind] ?? Square

  return (
    <div
      className={`win${focused ? ' is-focused' : ''}`}
      onPointerDown={(e) => {
        onFocus?.(win.id)
        if (draggable && e.target.closest('.win-drag')) {
          onDragStart?.(e, win)
        }
      }}
    >
      <div className="win-chrome">
        <div className={`win-drag${draggable ? ' is-draggable' : ''}`}>
          <Grip size={12} strokeWidth={1.75} className="win-grip" />
          <Icon size={12} strokeWidth={1.75} style={{ color: meta.accent }} />
          <span className="win-title">{win.title}</span>
        </div>
        <button
          type="button"
          className="win-close"
          onClick={(e) => {
            e.stopPropagation()
            onClose?.(win.id)
          }}
          aria-label={`Close ${win.title}`}
        >
          <X size={12} strokeWidth={2} />
        </button>
      </div>
      <div className="win-body">
        <div className="win-placeholder">
          <span className="win-kind" style={{ color: meta.accent }}>
            {meta.label}
          </span>
          <span className="win-id">{win.id}</span>
        </div>
      </div>
    </div>
  )
}
