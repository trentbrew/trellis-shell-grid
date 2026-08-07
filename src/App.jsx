import { useEffect, useMemo, useRef, useState } from 'react'
import { useWM } from './wm/useWM'
import { TopBar } from './wm/TopBar'
import { LayoutSurface } from './wm/LayoutSurface'
import { ZenView } from './wm/ZenView'
import { CommandPalette } from './wm/CommandPalette'
import { SettingsDialog } from './wm/SettingsDialog'
import { useMenuBridge } from './wm/useMenuBridge'
import { CircleHelp } from 'lucide-react'
import { buildChordLookup, eventToChord, loadSettings, saveSettings } from './settings'
import { EntityIcon } from './icons/EntityIcon'
import { ACTIVE_MODES, STATUSES, WINDOW_KINDS } from './wm/model'

export default function App() {
  const wm = useWM()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(() => loadSettings())
  useMenuBridge(wm, () => setPaletteOpen(true))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  // Global keybindings driven by settings.keybindings
  const chordLookup = useMemo(
    () => buildChordLookup(settings.keybindings),
    [settings.keybindings],
  )
  const wmRef = useRef(wm)
  wmRef.current = wm
  const modalRef = useRef({ paletteOpen, settingsOpen })
  modalRef.current = { paletteOpen, settingsOpen }

  useEffect(() => {
    const onKey = (e) => {
      const binding = chordLookup.get(eventToChord(e))

      // Modal toggles work even while a modal is open / input focused
      if (binding?.id === 'palette' || binding?.id === 'search') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
        return
      }
      if (binding?.id === 'settings') {
        e.preventDefault()
        setSettingsOpen((v) => !v)
        return
      }

      const { paletteOpen, settingsOpen } = modalRef.current
      if (paletteOpen || settingsOpen) return
      const t = e.target
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable ||
          t.closest?.('.term-pane, .xterm'))
      ) {
        return
      }

      const w = wmRef.current

      // Esc always exits zen
      if (e.key === 'Escape' && w.zen) {
        e.preventDefault()
        w.setZen(false)
        return
      }

      if (!binding) return
      e.preventDefault()

      switch (binding.id) {
        case 'layout-1':
        case 'layout-2':
        case 'layout-3':
        case 'layout-4':
        case 'layout-5': {
          const idx = Number(binding.id.slice(-1)) - 1
          w.setMode(ACTIVE_MODES[idx]?.id ?? 'grid')
          break
        }
        case 'cycle-next':
          w.cycleMode(1)
          break
        case 'cycle-prev':
          w.cycleMode(-1)
          break
        case 'zen':
          w.toggleZen()
          break
        case 'space-prev':
          w.cycleSpace(-1)
          break
        case 'space-next':
          w.cycleSpace(1)
          break
        case 'reset-camera':
          w.resetCamera()
          break
        case 'focus-next':
        case 'focus-next-tab':
        case 'focus-next-j':
        case 'focus-right':
        case 'focus-down':
          w.focusDelta(1)
          break
        case 'focus-prev':
        case 'focus-prev-tab':
        case 'focus-prev-k':
        case 'focus-left':
        case 'focus-up':
          w.focusDelta(-1)
          break
        case 'move-left':
          w.moveFocused(-1, 0)
          break
        case 'move-right':
          w.moveFocused(1, 0)
          break
        case 'move-up':
          w.moveFocused(0, -1)
          break
        case 'move-down':
          w.moveFocused(0, 1)
          break
        case 'new-window':
          w.addWindow({ kind: 'terminal' })
          break
        case 'close-window':
          if (w.focusId) w.removeWindow(w.focusId)
          break
        case 'minimize':
          if (w.focusId) w.minimizeWindow(w.focusId)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chordLookup])

  const focused = wm.windows.find((w) => w.id === wm.focusId) ?? wm.windows[0] ?? null
  const minimized = wm.windows.filter((w) => w.minimized)

  // ── Zen mode: chrome gone, focused window full-bleed ──
  if (wm.zen) {
    return (
      <div className="app-shell zen-shell">
        <ZenView
          win={focused}
          groups={wm.groups}
          onClose={wm.removeWindow}
          onExit={() => wm.setZen(false)}
        />
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          windows={wm.windows}
          spaces={wm.spaces}
          activeSpaceId={wm.activeSpaceId}
          onMode={wm.setMode}
          onAdd={wm.addWindow}
          onSetSpace={wm.setSpace}
          onFocus={wm.focus}
          onToggleZen={wm.toggleZen}
          onClear={wm.clearWindows}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <TopBar
        mode={wm.mode}
        spaces={wm.spaces}
        activeSpaceId={wm.activeSpaceId}
        groups={wm.groups}
        zen={wm.zen}
        onMode={wm.setMode}
        onAdd={wm.addWindow}
        onSetSpace={wm.setSpace}
        onAddSpace={wm.addSpace}
        onRenameSpace={wm.renameSpace}
        onRemoveSpace={wm.removeSpace}
        onAddGroup={wm.addGroup}
        onPatchGroup={wm.patchGroup}
        onRemoveGroup={wm.removeGroup}
        onToggleZen={wm.toggleZen}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="grid-stage" aria-label="Window manager surface">
        <LayoutSurface
          windows={wm.windows}
          groups={wm.groups}
          layout={wm.layout}
          mode={wm.mode}
          focusId={wm.focusId}
          camera={wm.camera}
          morphGen={wm.morphGen}
          isWorld={wm.isWorld}
          prevMode={wm.prevMode}
          onViewport={wm.setViewport}
          onFocus={wm.focus}
          onClose={wm.removeWindow}
          onMinimize={wm.minimizeWindow}
          onBringFront={wm.bringFront}
          onPatchWindow={wm.patchWindow}
          onCamera={wm.setCamera}
          onZoom={wm.zoomWindow}
        />

        {wm.windows.length === 0 && (
          <div className="empty-state">
            <p>No windows</p>
            <p className="empty-hint">⌘/ new window · ⌥space palette · 1–7 layouts</p>
          </div>
        )}
      </main>

      <footer className="statusbar" aria-label="Status bar">
        <div className="statusbar-left">
          {minimized.length > 0 && (
            <span className="dock-label">docked</span>
          )}
          {minimized.map((w) => {
            const meta = WINDOW_KINDS[w.kind] ?? WINDOW_KINDS.blank
            const status = STATUSES[w.status] ?? STATUSES.idle
            return (
              <button
                key={w.id}
                type="button"
                className="dock-chip"
                title={`Restore ${w.title}`}
                onClick={() => wm.restoreWindow(w.id)}
              >
                <span
                  className={`dock-status${status.pulse ? ' is-pulse' : ''}`}
                  style={{ '--status-color': status.color }}
                />
                <EntityIcon name={meta.icon} size={10} style={{ color: meta.accent }} />
                <span className="dock-chip-title">{w.title}</span>
              </button>
            )
          })}
          {minimized.length > 0 && <span className="statusbar-divider" />}
          {settings.hints && (
            <>
              <span><kbd>1</kbd>–<kbd>7</kbd> layout</span>
              <span><kbd>⌘/</kbd> new</span>
              <span><kbd>⌥space</kbd> palette</span>
              <span><kbd>⌘⌥←</kbd>/<kbd>⌘⌥→</kbd> spaces</span>
              <span><kbd>⌘.</kbd> next · <kbd>⌘,</kbd> prev</span>
              <span><kbd>⌥Z</kbd> zen</span>
              <span><kbd>⌥X</kbd> close</span>
            </>
          )}
          <span className="status-gap" />
          <span className="status-mode">{wm.space.name}</span>
          <span className="status-mode">{wm.mode}</span>
        </div>
        <button
          type="button"
          className={`help-btn${settings.hints ? ' is-active' : ''}`}
          onClick={() =>
            setSettings((prev) => {
              const next = { ...prev, hints: !prev.hints }
              saveSettings(next)
              return next
            })
          }
          aria-label={settings.hints ? 'Hide keyboard shortcuts' : 'Show keyboard shortcuts'}
          aria-pressed={settings.hints}
          title="Keyboard shortcuts"
        >
          <CircleHelp size={13} strokeWidth={1.75} />
        </button>
      </footer>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        windows={wm.windows}
        spaces={wm.spaces}
        activeSpaceId={wm.activeSpaceId}
        onMode={wm.setMode}
        onAdd={wm.addWindow}
        onSetSpace={wm.setSpace}
        onFocus={wm.focus}
        onToggleZen={wm.toggleZen}
        onClear={wm.clearWindows}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={(updated) => {
          setSettings(updated)
          saveSettings(updated)
        }}
      />
    </div>
  )
}
