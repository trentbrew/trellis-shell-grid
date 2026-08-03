import { useWM } from './wm/useWM'
import { TopBar } from './wm/TopBar'
import { LayoutSurface } from './wm/LayoutSurface'

export default function App() {
  const wm = useWM()

  return (
    <div className="app-shell">
      <TopBar
        mode={wm.mode}
        windows={wm.windows}
        spaces={wm.spaces}
        activeSpaceId={wm.activeSpaceId}
        groups={wm.groups}
        onMode={wm.setMode}
        onAdd={wm.addWindow}
        onSetSpace={wm.setSpace}
        onAddSpace={wm.addSpace}
        onRenameSpace={wm.renameSpace}
        onRemoveSpace={wm.removeSpace}
        onAddGroup={wm.addGroup}
        onPatchGroup={wm.patchGroup}
        onRemoveGroup={wm.removeGroup}
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
          onViewport={wm.setViewport}
          onFocus={wm.focus}
          onClose={wm.removeWindow}
          onBringFront={wm.bringFront}
          onPatchWindow={wm.patchWindow}
          onCamera={wm.setCamera}
        />

        {wm.windows.length === 0 && (
          <div className="empty-state">
            <p>No windows</p>
            <p className="empty-hint">+ or ⌘N · 1–7 switch layouts</p>
          </div>
        )}
      </main>

      <footer className="statusbar" aria-label="Shortcuts">
        <span>
          <kbd>1</kbd>–<kbd>7</kbd> layout
        </span>
        <span>
          <kbd>[</kbd> <kbd>]</kbd> cycle
        </span>
        <span>
          <kbd>Tab</kbd> focus
        </span>
        <span>
          <kbd>⌘N</kbd> new
        </span>
        <span>
          <kbd>⌘W</kbd> close
        </span>
        <span className="status-gap" />
        <span className="status-mode">{wm.space.name}</span>
        <span className="status-mode">{wm.mode}</span>
      </footer>
    </div>
  )
}
