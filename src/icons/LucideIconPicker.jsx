import { useEffect, useMemo, useRef, useState } from 'react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { Search, X } from 'lucide-react'
import {
  estimateCategorySectionHeight,
  searchLucideIconsByCategory,
} from './lucide-icon-categories'
import { LUCIDE_ICON_NAMES, normalizeLucideIconName } from './lucide-icons'

function IconGrid({ icons, selected, onSelect }) {
  return (
    <div className="icon-grid">
      {icons.map((name) => {
        const isSelected = selected === name
        return (
          <button
            key={name}
            type="button"
            role="option"
            aria-selected={isSelected}
            title={name}
            className={`icon-cell${isSelected ? ' is-selected' : ''}`}
            onClick={() => onSelect(name)}
          >
            <DynamicIcon name={name} size={15} strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}

function LazyCategorySection({ group, selected, onSelect, scrollRoot }) {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const placeholderHeight = estimateCategorySectionHeight(group.icons.length)

  useEffect(() => {
    const node = sectionRef.current
    if (!node || !scrollRoot) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true)
      },
      { root: scrollRoot, rootMargin: '240px 0px', threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [scrollRoot, group.category])

  return (
    <section
      ref={sectionRef}
      aria-label={group.category}
      style={{ minHeight: visible ? undefined : placeholderHeight }}
    >
      <h3 className="icon-cat-head">
        {group.category}
        <span>({group.icons.length})</span>
      </h3>
      {visible ? (
        <IconGrid icons={group.icons} selected={selected} onSelect={onSelect} />
      ) : (
        <div aria-hidden style={{ height: placeholderHeight - 26 }} />
      )}
    </section>
  )
}

/**
 * Modal Lucide icon picker (ported from fractal-playground pattern).
 * value/onSelect use kebab-case Lucide ids.
 */
export function LucideIconPicker({ open, onOpenChange, value, onSelect, title = 'Choose icon' }) {
  const [query, setQuery] = useState('')
  const [scrollRoot, setScrollRoot] = useState(null)
  const selected = normalizeLucideIconName(value)

  const filteredGroups = useMemo(() => searchLucideIconsByCategory(query), [query])
  const total = useMemo(
    () => filteredGroups.reduce((s, g) => s + g.icons.length, 0),
    [filteredGroups],
  )

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
    >
      <div className="modal-panel icon-picker-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{title}</h2>
            <p className="modal-desc">
              {LUCIDE_ICON_NAMES.length} Lucide icons · stored as kebab-case ids
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="icon-search">
          <Search size={13} className="icon-search-glyph" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons…"
            autoFocus
          />
        </div>

        <div
          ref={setScrollRoot}
          className="icon-scroll"
          role="listbox"
          aria-label="Lucide icons"
        >
          {filteredGroups.length === 0 ? (
            <p className="icon-empty">No icons match</p>
          ) : (
            filteredGroups.map((group) => (
              <LazyCategorySection
                key={group.category}
                group={group}
                selected={selected}
                scrollRoot={scrollRoot}
                onSelect={(name) => {
                  onSelect(name)
                  onOpenChange(false)
                }}
              />
            ))
          )}
        </div>

        <p className="icon-footer">
          {query.trim()
            ? `${total} match${total === 1 ? '' : 'es'}`
            : `${LUCIDE_ICON_NAMES.length} icons`}
        </p>
      </div>
    </div>
  )
}
