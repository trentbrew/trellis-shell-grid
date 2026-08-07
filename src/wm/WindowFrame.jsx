import { Maximize2, Minus, Minimize2, X } from 'lucide-react'
import { EntityIcon } from '../icons/EntityIcon'
import { ContentPane } from './content/ContentPane'
import { STATUSES, WINDOW_KINDS, groupById } from './model'

export function WindowFrame({
  win,
  groups,
  focused,
  expanded,
  onFocus,
  onClose,
  onMinimize,
  onDragStart,
  onZoom,
  onPatchWindow,
  draggable,
  tabs,
  onTabClick,
  index,
  dims,
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
      {hasGroup && (
        <div
          className="win-group-bar"
          title={group.label}
          aria-label={`Group ${group.label}`}
        />
      )}
      <div
        className={`win-chrome${draggable ? ' is-draggable' : ''}`}
        onDoubleClick={(e) => {
          if (e.target.closest('button')) return
          onZoom?.(win.id)
        }}
      >
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
        {tabs?.length ? (
          <div className="tabbed-titlebar" role="tablist" aria-label="Window tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={tab.active}
                className={`tabbed-titlebar-item${tab.active ? ' is-active' : ''}`}
                onClick={() => onTabClick?.(tab.id)}
              >
                <EntityIcon
                  name={tab.icon ?? 'square'}
                  size={12}
                  style={{ opacity: 0.84 }}
                />
                <span>{tab.title}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="win-actions">
          <button
            type="button"
            className="win-btn win-minimize"
            onClick={(e) => {
              e.stopPropagation()
              onMinimize?.(win.id)
            }}
            aria-label={`Minimize ${win.title}`}
          >
            <Minus size={12} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`win-btn win-expand${expanded ? ' is-expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onZoom?.(win.id)
            }}
            aria-label={expanded ? `Restore ${win.title}` : `Expand ${win.title}`}
            title={expanded ? 'Restore' : 'Expand'}
          >
            {expanded ? (
              <Minimize2 size={12} strokeWidth={2} />
            ) : (
              <Maximize2 size={12} strokeWidth={2} />
            )}
          </button>
          <button
            type="button"
            className="win-btn win-close"
            onClick={(e) => {
              e.stopPropagation()
              onClose?.(win.id)
            }}
            aria-label={`Close ${win.title}`}
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="win-body">
        <div className="win-content">
          <ContentPane win={win} windowId={win.id} onPatchWindow={onPatchWindow} />
        </div>
        {index != null && dims && (
          <div className="win-debug" aria-hidden="true">
            <span className="win-debug-idx">{index}</span>
            <span className="win-debug-dims">{Math.round(dims.w)}×{Math.round(dims.h)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
