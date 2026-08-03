import { iconNames } from 'lucide-react/dynamic'

function buildLucideIconNames() {
  try {
    if (!iconNames || typeof iconNames[Symbol.iterator] !== 'function') {
      return ['folder']
    }
    return [...iconNames].sort((a, b) => a.localeCompare(b))
  } catch {
    return ['folder']
  }
}

export const LUCIDE_ICON_NAMES = buildLucideIconNames()
const LUCIDE_ICON_SET = new Set(LUCIDE_ICON_NAMES)
export const DEFAULT_LUCIDE_ICON = 'folder'

export function normalizeLucideIconName(name) {
  if (!name) return DEFAULT_LUCIDE_ICON
  const normalized = String(name).toLowerCase()
  return LUCIDE_ICON_SET.has(normalized) ? normalized : DEFAULT_LUCIDE_ICON
}
