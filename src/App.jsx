import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Responsive,
  useContainerWidth,
  verticalCompactor,
} from 'react-grid-layout'
import { boundedX, boundedY } from 'react-grid-layout/core'
import { Box, Grip, Plus, Square, Terminal, Trash2, X } from 'lucide-react'

const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const MARGIN = [10, 10]
const PADDING = [12, 12]
const BAR_H = 48

const ITEM_TYPES = {
  blank: { label: 'Blank', icon: Square, w: 3, h: 3, accent: '#3f3f46' },
  service: { label: 'Service', icon: Box, w: 4, h: 3, accent: '#22c55e' },
  terminal: { label: 'Terminal', icon: Terminal, w: 6, h: 4, accent: '#38bdf8' },
}

const INITIAL = [
  { i: 'svc-1', x: 0, y: 0, w: 4, h: 3, type: 'service', title: 'api' },
  { i: 'svc-2', x: 4, y: 0, w: 4, h: 3, type: 'service', title: 'worker' },
  { i: 'term-1', x: 8, y: 0, w: 4, h: 4, type: 'terminal', title: 'shell' },
  { i: 'blank-1', x: 0, y: 3, w: 4, h: 2, type: 'blank', title: 'notes' },
]

function nextId(type) {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`
}

function findOpenSlot(layout, w, h, cols) {
  const occupied = new Set()
  for (const item of layout) {
    for (let y = item.y; y < item.y + item.h; y++) {
      for (let x = item.x; x < item.x + item.w; x++) {
        occupied.add(`${x},${y}`)
      }
    }
  }
  for (let y = 0; y < 200; y++) {
    for (let x = 0; x <= cols - w; x++) {
      let fits = true
      for (let dy = 0; dy < h && fits; dy++) {
        for (let dx = 0; dx < w && fits; dx++) {
          if (occupied.has(`${x + dx},${y + dy}`)) fits = false
        }
      }
      if (fits) return { x, y }
    }
  }
  return { x: 0, y: 0 }
}

function Tile({ item, onRemove }) {
  const meta = ITEM_TYPES[item.type] ?? ITEM_TYPES.blank
  const Icon = meta.icon

  return (
    <div className="tile group">
      <div className="tile-chrome">
        <div className="tile-drag drag-handle">
          <Grip size={12} strokeWidth={1.75} />
          <Icon size={12} strokeWidth={1.75} style={{ color: meta.accent }} />
          <span className="tile-title">{item.title}</span>
        </div>
        <button
          type="button"
          className="tile-remove"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(item.i)
          }}
          aria-label={`Remove ${item.title}`}
        >
          <X size={12} strokeWidth={2} />
        </button>
      </div>
      <div className="tile-body">
        {item.type === 'terminal' ? (
          <pre className="tile-term">
            <span className="term-prompt">$</span> ready
            {'\n'}
            <span className="term-dim">// drag · resize · append</span>
          </pre>
        ) : item.type === 'service' ? (
          <div className="tile-svc">
            <span className="svc-dot" style={{ background: meta.accent }} />
            <span>running</span>
          </div>
        ) : (
          <span className="tile-empty">empty</span>
        )}
      </div>
    </div>
  )
}

function ResizeHandle(_axis, ref) {
  return (
    <div ref={ref} className="rgl-handle" aria-hidden="true">
      <Grip size={11} />
    </div>
  )
}

export default function App() {
  const [items, setItems] = useState(INITIAL)
  const [hostH, setHostH] = useState(0)

  const { width, mounted, containerRef } = useContainerWidth({
    measureBeforeMount: true,
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setHostH(entry.contentRect.height)
    })
    ro.observe(el)
    setHostH(el.clientHeight)
    return () => ro.disconnect()
  }, [containerRef, mounted])

  const layout = useMemo(
    () =>
      items.map(({ i, x, y, w, h }) => ({
        i,
        x,
        y,
        w,
        h,
        minW: 2,
        minH: 2,
      })),
    [items],
  )

  const rowHeight = useMemo(() => {
    if (hostH <= 0) return 48
    const rowsVisible = 12
    const [, my] = MARGIN
    const [, py] = PADDING
    return Math.max(
      28,
      Math.floor((hostH - py * 2 - my * (rowsVisible - 1)) / rowsVisible),
    )
  }, [hostH])

  const maxRows = useMemo(() => {
    if (hostH <= 0 || rowHeight <= 0) return 24
    const [, my] = MARGIN
    const [, py] = PADDING
    return Math.max(
      4,
      Math.floor((hostH - py * 2 + my) / (rowHeight + my)),
    )
  }, [hostH, rowHeight])

  const activeCols = useMemo(() => {
    if (width >= BREAKPOINTS.lg) return COLS.lg
    if (width >= BREAKPOINTS.md) return COLS.md
    if (width >= BREAKPOINTS.sm) return COLS.sm
    if (width >= BREAKPOINTS.xs) return COLS.xs
    return COLS.xxs
  }, [width])

  const onLayoutChange = useCallback((next) => {
    setItems((prev) => {
      const byId = new Map(next.map((n) => [n.i, n]))
      return prev.map((item) => {
        const n = byId.get(item.i)
        if (!n) return item
        return { ...item, x: n.x, y: n.y, w: n.w, h: n.h }
      })
    })
  }, [])

  const appendItem = useCallback(
    (type) => {
      const meta = ITEM_TYPES[type]
      const slot = findOpenSlot(layout, meta.w, meta.h, activeCols)
      const id = nextId(type)
      setItems((prev) => [
        ...prev,
        {
          i: id,
          x: slot.x,
          y: slot.y,
          w: meta.w,
          h: meta.h,
          type,
          title: `${meta.label.toLowerCase()}-${prev.filter((p) => p.type === type).length + 1}`,
        },
      ])
    },
    [layout, activeCols],
  )

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((p) => p.i !== id))
  }, [])

  const clearAll = useCallback(() => setItems([]), [])

  return (
    <div className="app-shell">
      <header className="topbar" style={{ height: BAR_H }}>
        <div className="topbar-left">
          <div className="brand" aria-hidden="true">
            <span className="brand-mark" />
          </div>
          <span className="brand-name">grid</span>
          <span className="topbar-meta">{items.length} tiles</span>
        </div>

        <div className="topbar-actions" role="toolbar" aria-label="Append tiles">
          {Object.entries(ITEM_TYPES).map(([key, meta]) => {
            const Icon = meta.icon
            return (
              <button
                key={key}
                type="button"
                className="bar-btn"
                onClick={() => appendItem(key)}
                aria-label={`Append ${meta.label}`}
              >
                <Plus size={13} strokeWidth={2} />
                <Icon size={13} strokeWidth={1.75} />
                <span>{meta.label}</span>
              </button>
            )
          })}
          <div className="bar-sep" />
          <button
            type="button"
            className="bar-btn bar-btn-ghost"
            onClick={clearAll}
            disabled={items.length === 0}
            aria-label="Clear all tiles"
          >
            <Trash2 size={13} strokeWidth={1.75} />
            <span>Clear</span>
          </button>
        </div>
      </header>

      <main className="grid-stage" aria-label="Dashboard grid">
        <div ref={containerRef} className="grid-host">
          {mounted && width > 0 && (
            <Responsive
              className="layout"
              width={width}
              layouts={{ lg: layout }}
              breakpoints={BREAKPOINTS}
              cols={COLS}
              rowHeight={rowHeight}
              maxRows={maxRows}
              margin={MARGIN}
              containerPadding={PADDING}
              onLayoutChange={onLayoutChange}
              compactor={verticalCompactor}
              constraints={[boundedX, boundedY]}
              dragConfig={{
                enabled: true,
                bounded: true,
                handle: '.drag-handle',
                threshold: 3,
              }}
              resizeConfig={{
                enabled: true,
                handles: ['se'],
                handleComponent: ResizeHandle,
              }}
              autoSize={false}
              style={{ minHeight: '100%' }}
            >
              {items.map((item) => (
                <div key={item.i}>
                  <Tile item={item} onRemove={removeItem} />
                </div>
              ))}
            </Responsive>
          )}

          {items.length === 0 && (
            <div className="empty-state">
              <p>No tiles</p>
              <p className="empty-hint">Use the bar above to append</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
