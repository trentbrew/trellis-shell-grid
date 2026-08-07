import { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, ChevronRight, CornerDownLeft, Search } from 'lucide-react'
import { EntityIcon } from '../icons/EntityIcon'
import { ACTIVE_MODES, KIND_LIST, WINDOW_KINDS } from './model'

/**
 * Global command palette + search (⌥space / Ctrl+Space).
 * Registry-style: actions are declarative {id, category, title, keywords, run}
 * so the same list can later back the native macOS menu (turtlecode pattern).
 */
export function CommandPalette({
  open,
  onClose,
  windows,
  spaces,
  activeSpaceId,
  onMode,
  onAdd,
  onSetSpace,
  onFocus,
  onToggleZen,
  onClear,
}) {
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const listRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSel(0)
    }
  }, [open])

  const commands = useMemo(() => {
    const cmds = []
    ACTIVE_MODES.forEach((m, i) => {
      cmds.push({
        id: `mode:${m.id}`,
        category: 'Layout',
        title: `Layout: ${m.label}`,
        keywords: `${m.hint} ${i + 1}`,
        run: () => onMode(m.id),
        icon: <kbd className="pal-kbd">{i + 1}</kbd>,
      })
    })
    for (const k of KIND_LIST) {
      cmds.push({
        id: `new:${k.id}`,
        category: 'New window',
        title: `New ${k.label}`,
        keywords: `create append terminal ${k.label}`,
        run: () => onAdd({ kind: k.id }),
        icon: (
          <EntityIcon
            name={k.icon}
            size={14}
            style={{ color: k.accent }}
          />
        ),
      })
    }
    for (const s of spaces) {
      cmds.push({
        id: `space:${s.id}`,
        category: 'Space',
        title: `Space: ${s.name}`,
        keywords: `workspace switch ${s.name}`,
        run: () => onSetSpace(s.id),
        icon: s.id === activeSpaceId ? <Check size={13} /> : <ChevronRight size={13} />,
      })
    }
    for (const w of windows) {
      const meta = WINDOW_KINDS[w.kind] ?? WINDOW_KINDS.blank
      cmds.push({
        id: `focus:${w.id}`,
        category: 'Windows',
        title: w.title,
        keywords: `focus jump ${meta.label} ${w.id}`,
        run: () => onFocus(w.id),
        icon: <EntityIcon name={meta.icon} size={13} style={{ color: meta.accent }} />,
      })
    }
    cmds.push(
      {
        id: 'zen',
        category: 'View',
        title: 'Zen mode',
        keywords: 'immersive fullscreen focus esc',
        run: onToggleZen,
        icon: <kbd className="pal-kbd">⌥Z</kbd>,
      },
      {
        id: 'clear',
        category: 'Danger',
        title: 'Clear all windows',
        keywords: 'reset delete close all',
        run: onClear,
        icon: null,
      },
    )
    return cmds
  }, [windows, spaces, activeSpaceId, onMode, onAdd, onSetSpace, onFocus, onToggleZen, onClear])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.keywords.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    )
  }, [commands, query])

  useEffect(() => {
    setSel(0)
  }, [filtered.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.altKey && e.code === 'Space') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
        e.preventDefault()
        setSel((s) => Math.min(s + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault()
        setSel((s) => Math.max(s - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filtered[sel]
        if (cmd) {
          onClose()
          cmd.run()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, sel, onClose])

  // scroll selected into view
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector(`[data-idx="${sel}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [sel, open])

  if (!open) return null

  // group filtered by category, preserving command order
  const sections = []
  const seen = new Set()
  for (const c of filtered) {
    if (!seen.has(c.category)) {
      seen.add(c.category)
      sections.push({ category: c.category, items: [] })
    }
    sections[sections.length - 1].items.push(c)
  }

  let flatIdx = -1
  const rowFor = (c) => {
    flatIdx += 1
    return { c, idx: flatIdx }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop" />
        <Dialog.Content className="modal-panel pal-panel">
          <Dialog.Title className="visually-hidden">Commands</Dialog.Title>
          <div className="pal-input">
            <Search size={14} className="pal-glyph" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search windows, layouts, commands…"
              autoFocus
            />
            <kbd className="pal-kbd">esc</kbd>
          </div>

          <div ref={listRef} className="pal-list" role="listbox">
            {sections.length === 0 && (
              <p className="pal-empty">No matches</p>
            )}
            {sections.map((g) => (
              <div key={g.category} className="pal-group">
                <div className="pal-cat">{g.category}</div>
                {g.items.map((c) => {
                  const { c: item, idx } = rowFor(c)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-idx={idx}
                      role="option"
                      aria-selected={idx === sel}
                      className={`pal-row${idx === sel ? ' is-selected' : ''}`}
                      onMouseEnter={() => setSel(idx)}
                      onClick={() => {
                        onClose()
                        item.run()
                      }}
                    >
                      <span className="pal-icon">{item.icon ?? <ChevronRight size={13} />}</span>
                      <span className="pal-title">{item.title}</span>
                      <span className="pal-go">
                        <CornerDownLeft size={11} />
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <p className="pal-footer">
            <kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>↵</kbd> run · <kbd>esc</kbd> close
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

