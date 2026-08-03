import { LUCIDE_ICON_NAMES } from './lucide-icons'

export const CATEGORY_RULES = [
  {
    label: 'Arrows & navigation',
    tags: ['arrow', 'nav', 'direction', 'move'],
    prefixes: ['arrow', 'chevron', 'chevrons', 'move', 'corner', 'navigation', 'compass', 'route', 'undo', 'redo'],
  },
  {
    label: 'Shapes & layout',
    tags: ['shape', 'layout', 'grid', 'panel'],
    prefixes: ['square', 'circle', 'triangle', 'hexagon', 'star', 'align', 'grid', 'layout', 'panel', 'columns', 'rows', 'layers', 'box', 'boxes', 'frame'],
  },
  {
    label: 'Files & documents',
    tags: ['file', 'folder', 'document', 'book'],
    prefixes: ['file', 'folder', 'archive', 'notebook', 'clipboard', 'book', 'library', 'bookmark', 'package', 'inbox'],
  },
  {
    label: 'Development',
    tags: ['dev', 'code', 'git', 'terminal', 'server'],
    prefixes: ['git', 'github', 'terminal', 'code', 'bug', 'cpu', 'database', 'server', 'cloud', 'workflow', 'network', 'container', 'binary', 'braces'],
  },
  {
    label: 'Devices',
    tags: ['device', 'hardware', 'computer'],
    prefixes: ['laptop', 'monitor', 'smartphone', 'keyboard', 'mouse', 'hard-drive', 'wifi', 'battery', 'plug', 'bot'],
  },
  {
    label: 'Communication',
    tags: ['mail', 'message', 'chat', 'bell'],
    prefixes: ['mail', 'message', 'phone', 'send', 'bell', 'chat', 'share', 'megaphone'],
  },
  {
    label: 'Media',
    tags: ['image', 'video', 'music', 'camera'],
    prefixes: ['image', 'video', 'music', 'camera', 'mic', 'volume', 'play', 'pause', 'film', 'headphones'],
  },
  {
    label: 'Tools & settings',
    tags: ['settings', 'tool', 'edit'],
    prefixes: ['settings', 'wrench', 'cog', 'sliders', 'pen', 'pencil', 'brush', 'palette', 'link', 'zap', 'sparkles', 'wand'],
  },
  {
    label: 'Status & alerts',
    tags: ['status', 'alert', 'check', 'error'],
    prefixes: ['check', 'x', 'alert', 'info', 'help', 'ban', 'shield', 'lock', 'key', 'eye', 'activity', 'pulse', 'heart'],
  },
  {
    label: 'People',
    tags: ['user', 'people', 'person'],
    prefixes: ['user', 'users', 'person', 'hand', 'smile'],
  },
  {
    label: 'Time',
    tags: ['time', 'calendar', 'clock'],
    prefixes: ['clock', 'calendar', 'timer', 'hourglass', 'history'],
  },
]

const FALLBACK = 'Other'
const PREFIX_INDEX = new Map()
const CATEGORY_TAGS = new Map()

for (const { label, tags, prefixes } of CATEGORY_RULES) {
  CATEGORY_TAGS.set(label, tags)
  for (const prefix of prefixes) {
    if (!PREFIX_INDEX.has(prefix)) PREFIX_INDEX.set(prefix, label)
  }
}

const CATEGORY_ORDER = [...CATEGORY_RULES.map((r) => r.label), FALLBACK]

export function categorizeLucideIcon(name) {
  const segments = name.split('-')
  for (let len = Math.min(segments.length, 3); len >= 1; len--) {
    const prefix = segments.slice(0, len).join('-')
    const cat = PREFIX_INDEX.get(prefix)
    if (cat) return cat
  }
  return FALLBACK
}

export function groupLucideIconsByCategory(names) {
  const buckets = new Map()
  for (const name of names) {
    const cat = categorizeLucideIcon(name)
    const list = buckets.get(cat)
    if (list) list.push(name)
    else buckets.set(cat, [name])
  }
  return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((category) => ({
    category,
    icons: buckets.get(category),
  }))
}

export function searchLucideIconsByCategory(query) {
  const q = query.trim().toLowerCase()
  if (!q) return groupLucideIconsByCategory(LUCIDE_ICON_NAMES)

  const all = groupLucideIconsByCategory(LUCIDE_ICON_NAMES)
  const fullCats = new Set(
    all
      .filter((g) => {
        if (g.category.toLowerCase().includes(q)) return true
        return CATEGORY_TAGS.get(g.category)?.some((t) => t.includes(q))
      })
      .map((g) => g.category),
  )

  const include = new Set()
  for (const g of all) {
    if (fullCats.has(g.category)) {
      for (const icon of g.icons) include.add(icon)
      continue
    }
    for (const icon of g.icons) {
      if (icon.includes(q)) include.add(icon)
    }
  }
  return groupLucideIconsByCategory([...include])
}

export const ICON_GRID_COLUMNS = 8
export const ICON_GRID_ROW_HEIGHT = 36
export const ICON_CATEGORY_HEADER_HEIGHT = 26

export function estimateCategorySectionHeight(iconCount) {
  const rows = Math.ceil(iconCount / ICON_GRID_COLUMNS)
  return ICON_CATEGORY_HEADER_HEIGHT + rows * ICON_GRID_ROW_HEIGHT + 4
}
