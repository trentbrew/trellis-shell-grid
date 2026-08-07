import { ContentPane } from './content/ContentPane'
import { STATUSES, WINDOW_KINDS, groupById } from './model'
import { EntityIcon } from '../icons/EntityIcon'
import { X } from 'lucide-react'

/**
 * Zen mode — immersive, full-bleed. All chrome (topbar, statusbar, window
 * chrome) disappears; the focused window's content fills the screen.
 * Esc / ⌥Z exits (handled in useWM); a hover chip shows the title.
 */
export function ZenView({ win, groups, onClose, onExit }) {
  if (!win) return null
  const meta = WINDOW_KINDS[win.kind] ?? WINDOW_KINDS.blank
  const group = groupById(groups, win.groupId)
  const status = STATUSES[win.status] ?? STATUSES.idle

  return (
    <div
      className="zen-view"
      onDoubleClick={(e) => {
        if (e.target.closest('button')) return
        onExit?.()
      }}
    >
      <div className="zen-content">
        <ContentPane win={win} windowId={win.id} />
      </div>

      <div className="zen-chip">
        <span
          className={`zen-status${status.pulse ? ' is-pulse' : ''}`}
          style={{ '--status-color': status.color }}
        />
        {group && (
          <EntityIcon name={group.icon} size={11} style={{ color: group.color }} />
        )}
        <EntityIcon name={meta.icon} size={12} style={{ color: meta.accent }} />
        <span className="zen-title">{win.title}</span>
        <span className="zen-divider" />
        <span className="zen-hint">esc exit</span>
        <button
          type="button"
          className="zen-close"
          onClick={onClose}
          aria-label={`Close ${win.title}`}
        >
          <X size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
