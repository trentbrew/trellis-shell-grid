import { X } from 'lucide-react'
import { EntityIcon } from '../icons/EntityIcon'
import { ContentPane } from './content/ContentPane'
import { STATUSES, WINDOW_KINDS, groupById } from './model'

export function WindowFrame({
  win,
  groups,
  focused,
  onFocus,
  onClose,
  onDragStart,
  draggable,
}) {
  const meta = WINDOW_KINDS[win.kind] ?? WINDOW_KINDS.blank
  const group = groupById(groups, win.groupId)
  const status = STATUSES[win.status] ?? STATUSES.idle
  const hasGroup = Boolean(group)

  return (
    <div
      className={`win${focused ? ' is-focused' : ''}${hasGroup ? ' has-group' : ''}`}
      style={hasGroup ? { '--group-color': group.color } : undefined}
      onPointerDown={(e) => {
        onFocus?.(win.id)
        if (draggable && e.target.closest('.win-chrome') && !e.target.closest('button')) {
          onDragStart?.(e, win)
        }
      }}
    >
      <div className={`win-chrome${draggable ? ' is-draggable' : ''}`}>
        <div className="win-chrome-left">
          <span
            className={`win-status${status.pulse ? ' is-pulse' : ''}`}
            style={{ '--status-color': status.color }}
            title={status.label}
            aria-label={`Status ${status.label}`}
          />
          {hasGroup && (
            <span className="win-group-chip" title={group.label}>
              <EntityIcon name={group.icon} size={11} style={{ color: group.color }} />
            </span>
          )}
          <EntityIcon
            name={meta.icon}
            size={12}
            style={{ color: meta.accent, opacity: 0.9 }}
          />
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
        <div className="win-content">
          <ContentPane win={win} />
        </div>
      </div>

      {hasGroup && (
        <div
          className="win-group-bar"
          title={group.label}
          aria-label={`Group ${group.label}`}
        />
      )}
    </div>
  )
}
