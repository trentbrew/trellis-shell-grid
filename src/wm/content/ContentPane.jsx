import { EntityIcon } from '../../icons/EntityIcon'
import { WINDOW_KINDS } from '../model'

/** Placeholder content per kind — real terminals/etc. come later. */
export function ContentPane({ win }) {
  const meta = WINDOW_KINDS[win.kind] ?? WINDOW_KINDS.blank

  if (win.kind === 'terminal') {
    return (
      <pre className="content-term">
        <span className="term-prompt">$</span> trellis whereami
        {'\n'}
        <span className="term-dim">lane · space · focus ready</span>
        {'\n'}
        <span className="term-prompt">$</span> <span className="term-cursor">▍</span>
      </pre>
    )
  }

  if (win.kind === 'service') {
    return (
      <div className="content-svc">
        <div className="content-svc-row">
          <span className="content-label">endpoint</span>
          <span className="content-mono">:8080/health</span>
        </div>
        <div className="content-svc-row">
          <span className="content-label">uptime</span>
          <span className="content-mono">4h 12m</span>
        </div>
        <div className="content-svc-row">
          <span className="content-label">status</span>
          <span className="content-mono" style={{ color: meta.accent }}>
            {win.status}
          </span>
        </div>
      </div>
    )
  }

  if (win.kind === 'note') {
    return (
      <div className="content-note">
        <p>Scratch notes for this space.</p>
        <p className="content-dim">Markdown + Trellis links later.</p>
      </div>
    )
  }

  if (win.kind === 'logs') {
    return (
      <pre className="content-term content-logs">
        <span className="term-dim">[12:04:01]</span> worker boot
        {'\n'}
        <span className="term-dim">[12:04:08]</span> <span className="term-err">retry queue full</span>
        {'\n'}
        <span className="term-dim">[12:04:11]</span> backoff 2s
      </pre>
    )
  }

  if (win.kind === 'browser') {
    return (
      <div className="content-browser">
        <div className="content-url">https://localhost</div>
        <p className="content-dim">Embedded browser pane</p>
      </div>
    )
  }

  return (
    <div className="content-blank">
      <EntityIcon name={meta.icon} size={18} style={{ color: meta.accent, opacity: 0.7 }} />
      <span>{meta.label}</span>
    </div>
  )
}
