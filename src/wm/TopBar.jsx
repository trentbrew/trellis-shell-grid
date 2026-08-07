import { useState } from 'react'
import * as Menu from '@radix-ui/react-menu'
import {
  AppWindow,
  Check,
  ChevronDown,
  Cog,
  Columns2,
  Focus,
  Grip,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Rows2,
  SquareStack,
  Table,
  Trash2,
  Waypoints,
} from 'lucide-react'
import turtleLogo from '../assets/turtle.svg'
import { EntityIcon } from '../icons/EntityIcon'
import { LucideIconPicker } from '../icons/LucideIconPicker'
import { WindowControls } from './WindowControls'
import { controlsSide } from '../platform'
import { GROUP_COLORS, KIND_LIST, ACTIVE_MODES } from './model'

const MODE_ICONS = {
  tabs: SquareStack,
  stack: Rows2,
  table: Table,
  grid: LayoutGrid,
  freeform: Grip,
  niri: Columns2,
  floating: AppWindow,
  fibonacci: Waypoints,
}

export function TopBar({
  mode,
  spaces,
  activeSpaceId,
  groups,
  zen,
  onMode,
  onAdd,
  onSetSpace,
  onAddSpace,
  onRenameSpace,
  onRemoveSpace,
  onAddGroup,
  onPatchGroup,
  onRemoveGroup,
  onToggleZen,
  onOpenPalette,
  onOpenSettings,
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [spaceOpen, setSpaceOpen] = useState(false)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [iconTarget, setIconTarget] = useState(null)

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0]

  const startRename = (sp) => {
    setRenamingId(sp.id)
    setRenameVal(sp.name)
  }

  const commitRename = () => {
    if (renamingId && renameVal.trim()) {
      onRenameSpace(renamingId, renameVal.trim())
    }
    setRenamingId(null)
  }

  const controlsSide_ = controlsSide()

  return (
    <header className="topbar" data-tauri-drag-region>
      <div className="topbar-left" data-tauri-drag-region>
        {controlsSide_ === 'left' && <WindowControls />}
        <div className="brand" aria-hidden="true">
          <img src={turtleLogo} alt="" className="brand-logo" />
        </div>

        <Menu.Root
          open={spaceOpen}
          onOpenChange={(open) => {
            setSpaceOpen(open)
            if (!open) setRenamingId(null)
          }}
          modal={false}
        >
          <Menu.Anchor asChild>
            <button
              type="button"
              className={`space-trigger${spaceOpen ? ' is-open' : ''}`}
              aria-label="Spaces"
              aria-expanded={spaceOpen}
              aria-haspopup="menu"
              onClick={() => setSpaceOpen((o) => !o)}
            >
              <span className="space-name">{activeSpace?.name ?? 'Space'}</span>
              <ChevronDown size={13} strokeWidth={2} className="space-chevron" />
            </button>
          </Menu.Anchor>
          <Menu.Portal>
            <Menu.Content className="menu space-menu" side="bottom" sideOffset={6} align="start">
              {spaces.map((sp) => {
                const active = sp.id === activeSpaceId
                if (renamingId === sp.id) {
                  return (
                    <div key={sp.id} className={`menu-row${active ? ' is-active' : ''}`}>
                      <input
                        className="space-rename"
                        value={renameVal}
                        autoFocus
                        onChange={(e) => setRenameVal(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename()
                          if (e.key === 'Escape') setRenamingId(null)
                          e.stopPropagation()
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )
                }
                return (
                  <Menu.Item
                    key={sp.id}
                    className={`menu-item space-item${active ? ' is-active' : ''}`}
                    onSelect={() => onSetSpace(sp.id)}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      startRename(sp)
                    }}
                  >
                    <span>{sp.name}</span>
                    <span className="menu-meta">{sp.windows.length}</span>
                    {active && <Check size={12} strokeWidth={2} />}
                  </Menu.Item>
                )
              })}
              <Menu.Separator className="menu-sep" />
              <Menu.Item className="menu-item" onSelect={() => onAddSpace({})}>
                <Plus size={13} strokeWidth={2} />
                <span>New space</span>
              </Menu.Item>
              {spaces.length > 1 && (
                <Menu.Item
                  className="menu-item menu-danger"
                  onSelect={() => onRemoveSpace(activeSpaceId)}
                >
                  <span>Delete “{activeSpace?.name}”</span>
                </Menu.Item>
              )}
              <p className="menu-hint">Double-click to rename</p>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>

        <div className="topbar-modes" role="toolbar" aria-label="Layout modes">
          {ACTIVE_MODES.map((m, i) => {
            const key = String(i + 1)
            const Icon = MODE_ICONS[m.id] ?? LayoutGrid
            const active = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                className={`mode-btn${active ? ' is-active' : ''}`}
                onClick={() => onMode(m.id)}
                title={`${m.label} (${key}) — ${m.hint}`}
                aria-pressed={active}
                aria-label={`${m.label} layout`}
              >
                <Icon size={15} strokeWidth={1.75} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="topbar-center">
        <button
          type="button"
          className="bar-btn search-btn"
          onClick={onOpenPalette}
          aria-label="Search and commands (⌥space)"
          title="Search & commands (⌥space)"
        >
          <Search size={14} strokeWidth={1.75} />
          <span className="search-hint">Search</span>
          <kbd className="search-kbd">⌥space</kbd>
        </button>
      </div>

      <div className="topbar-actions">
        <Menu.Root open={groupsOpen} onOpenChange={setGroupsOpen} modal={false}>
          <Menu.Anchor asChild>
            <button
              type="button"
              className={`bar-btn icon-btn${groupsOpen ? ' is-open' : ''}`}
              aria-label="Manage groups"
              title="Groups"
              aria-expanded={groupsOpen}
              aria-haspopup="menu"
              onClick={() => setGroupsOpen((o) => !o)}
            >
              <Layers size={14} strokeWidth={1.75} />
            </button>
          </Menu.Anchor>
          <Menu.Portal>
            <Menu.Content className="menu groups-menu" side="bottom" sideOffset={6} align="start">
              <div className="menu-section-label">Groups</div>
              {groups.map((g) => (
                <div key={g.id} className="group-edit-row">
                  <button
                    type="button"
                    className="group-icon-btn"
                    style={{ color: g.color, borderColor: `${g.color}55` }}
                    title="Change icon"
                    onClick={() => {
                      setGroupsOpen(false)
                      setIconTarget(g.id)
                    }}
                  >
                    <EntityIcon name={g.icon} size={14} />
                  </button>
                  <input
                    className="group-name-input"
                    value={g.label}
                    onChange={(e) => onPatchGroup(g.id, { label: e.target.value })}
                  />
                  <div className="group-swatches">
                    {GROUP_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`swatch${g.color === c ? ' is-active' : ''}`}
                        style={{ background: c }}
                        aria-label={`Color ${c}`}
                        onClick={() => onPatchGroup(g.id, { color: c })}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="group-del"
                    aria-label={`Delete ${g.label}`}
                    onClick={() => onRemoveGroup(g.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <Menu.Separator className="menu-sep" />
              <Menu.Item className="menu-item" onSelect={() => onAddGroup({})}>
                <Plus size={13} />
                <span>New group</span>
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>

        <button
          type="button"
          className="bar-btn icon-btn"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
        >
          <Cog size={14} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className={`bar-btn zen-btn${zen ? ' is-active' : ''}`}
          onClick={onToggleZen}
          aria-label="Toggle zen mode (⌥Z)"
          title="Zen mode (⌥Z)"
        >
          <Focus size={14} strokeWidth={1.75} />
        </button>

        <Menu.Root open={addOpen} onOpenChange={setAddOpen} modal={false}>
          <Menu.Anchor asChild>
            <button
              type="button"
              className={`bar-btn add-btn${addOpen ? ' is-open' : ''}`}
              aria-label="Add window"
              title="Add window (⌘/)"
              aria-expanded={addOpen}
              aria-haspopup="menu"
              onClick={() => setAddOpen((o) => !o)}
            >
              <Plus size={15} strokeWidth={2} />
            </button>
          </Menu.Anchor>
          <Menu.Portal>
            <Menu.Content className="menu add-menu" side="bottom" sideOffset={6} align="end">
              {KIND_LIST.map((meta) => (
                <Menu.Item
                  key={meta.id}
                  className="menu-item"
                  onSelect={() => onAdd({ kind: meta.id })}
                >
                  <EntityIcon
                    name={meta.icon}
                    size={14}
                    style={{ color: meta.accent }}
                  />
                  <span>{meta.label}</span>
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
        {controlsSide_ === 'right' && <WindowControls />}
      </div>

      <LucideIconPicker
        open={Boolean(iconTarget)}
        onOpenChange={(open) => {
          if (!open) setIconTarget(null)
        }}
        value={groups.find((g) => g.id === iconTarget)?.icon}
        onSelect={(icon) => {
          if (iconTarget) onPatchGroup(iconTarget, { icon })
        }}
        title="Group icon"
      />
    </header>
  )
}
