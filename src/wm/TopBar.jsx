import { useEffect, useRef, useState } from 'react'
import {
  AppWindow,
  Check,
  ChevronDown,
  Columns2,
  Grip,
  LayoutGrid,
  Layers,
  PanelTop,
  Plus,
  Settings2,
  Trash2,
  Waypoints,
} from 'lucide-react'
import turtleLogo from '../assets/turtle.svg'
import { EntityIcon } from '../icons/EntityIcon'
import { LucideIconPicker } from '../icons/LucideIconPicker'
import { GROUP_COLORS, KIND_LIST, LAYOUT_MODES } from './model'

const MODE_ICONS = {
  grid: LayoutGrid,
  freeform: Grip,
  niri: Columns2,
  floating: AppWindow,
  fibonacci: Waypoints,
  tabs: PanelTop,
  stack: Layers,
}

export function TopBar({
  mode,
  windows,
  spaces,
  activeSpaceId,
  groups,
  onMode,
  onAdd,
  onSetSpace,
  onAddSpace,
  onRenameSpace,
  onRemoveSpace,
  onAddGroup,
  onPatchGroup,
  onRemoveGroup,
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [spaceOpen, setSpaceOpen] = useState(false)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [iconTarget, setIconTarget] = useState(null)
  const addRef = useRef(null)
  const spaceRef = useRef(null)
  const groupsRef = useRef(null)

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0]

  useEffect(() => {
    if (!addOpen && !spaceOpen && !groupsOpen) return
    const onDoc = (e) => {
      if (addOpen && addRef.current && !addRef.current.contains(e.target)) {
        setAddOpen(false)
      }
      if (spaceOpen && spaceRef.current && !spaceRef.current.contains(e.target)) {
        setSpaceOpen(false)
        setRenamingId(null)
      }
      if (groupsOpen && groupsRef.current && !groupsRef.current.contains(e.target)) {
        // don't close when icon picker modal is open
        if (e.target.closest?.('.modal-backdrop')) return
        setGroupsOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape' && !iconTarget) {
        setAddOpen(false)
        setSpaceOpen(false)
        setGroupsOpen(false)
        setRenamingId(null)
      }
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [addOpen, spaceOpen, groupsOpen, iconTarget])

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

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand" aria-hidden="true">
          <img src={turtleLogo} alt="" className="brand-logo" />
        </div>

        <div className="space-combo" ref={spaceRef}>
          <button
            type="button"
            className={`space-trigger${spaceOpen ? ' is-open' : ''}`}
            onClick={() => setSpaceOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={spaceOpen}
            aria-label="Spaces"
          >
            <span className="space-name">{activeSpace?.name ?? 'Space'}</span>
            <ChevronDown size={13} strokeWidth={2} className="space-chevron" />
          </button>

          {spaceOpen && (
            <div className="menu space-menu" role="listbox">
              {spaces.map((sp) => {
                const active = sp.id === activeSpaceId
                const renaming = renamingId === sp.id
                return (
                  <div
                    key={sp.id}
                    className={`menu-row${active ? ' is-active' : ''}`}
                    role="option"
                    aria-selected={active}
                  >
                    {renaming ? (
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
                    ) : (
                      <button
                        type="button"
                        className="menu-item space-item"
                        onClick={() => {
                          onSetSpace(sp.id)
                          setSpaceOpen(false)
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault()
                          startRename(sp)
                        }}
                      >
                        <span>{sp.name}</span>
                        <span className="menu-meta">{sp.windows.length}</span>
                        {active && <Check size={12} strokeWidth={2} />}
                      </button>
                    )}
                  </div>
                )
              })}
              <div className="menu-sep" />
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  onAddSpace({})
                  setSpaceOpen(false)
                }}
              >
                <Plus size={13} strokeWidth={2} />
                <span>New space</span>
              </button>
              {spaces.length > 1 && (
                <button
                  type="button"
                  className="menu-item menu-danger"
                  onClick={() => {
                    onRemoveSpace(activeSpaceId)
                    setSpaceOpen(false)
                  }}
                >
                  <span>Delete “{activeSpace?.name}”</span>
                </button>
              )}
              <p className="menu-hint">Double-click to rename</p>
            </div>
          )}
        </div>

        <span className="topbar-meta">{windows.length}</span>
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
              <Icon size={15} strokeWidth={1.75} />
            </button>
          )
        })}
      </div>

      <div className="topbar-actions">
        <div className="groups-combo" ref={groupsRef}>
          <button
            type="button"
            className={`bar-btn icon-btn${groupsOpen ? ' is-open' : ''}`}
            onClick={() => setGroupsOpen((v) => !v)}
            aria-label="Manage groups"
            title="Groups"
          >
            <Settings2 size={14} strokeWidth={1.75} />
          </button>

          {groupsOpen && (
            <div className="menu groups-menu">
              <div className="menu-section-label">Groups</div>
              {groups.map((g) => (
                <div key={g.id} className="group-edit-row">
                  <button
                    type="button"
                    className="group-icon-btn"
                    style={{ color: g.color, borderColor: `${g.color}55` }}
                    title="Change icon"
                    onClick={() => setIconTarget(g.id)}
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
              <div className="menu-sep" />
              <button
                type="button"
                className="menu-item"
                onClick={() => onAddGroup({})}
              >
                <Plus size={13} />
                <span>New group</span>
              </button>
            </div>
          )}
        </div>

        <div className="add-combo" ref={addRef}>
          <button
            type="button"
            className={`bar-btn add-btn${addOpen ? ' is-open' : ''}`}
            onClick={() => setAddOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={addOpen}
            aria-label="Add window"
            title="Add window (⌘N)"
          >
            <Plus size={15} strokeWidth={2} />
          </button>
          {addOpen && (
            <div className="menu add-menu" role="menu">
              {KIND_LIST.map((meta) => (
                <button
                  key={meta.id}
                  type="button"
                  className="menu-item"
                  role="menuitem"
                  onClick={() => {
                    onAdd({ kind: meta.id })
                    setAddOpen(false)
                  }}
                >
                  <EntityIcon
                    name={meta.icon}
                    size={14}
                    style={{ color: meta.accent }}
                  />
                  <span>{meta.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
