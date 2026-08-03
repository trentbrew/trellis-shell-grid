const KEY = 'grid.wm:v1'

/**
 * Minimal snapshot adapter — zero infra, works offline.
 * Serializes spaces, activeSpaceId, groups (view state excluded).
 */
export const localStorageAdapter = {
  name: 'localStorage',

  async load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || !Array.isArray(parsed.spaces)) return null
      return parsed
    } catch {
      return null
    }
  },

  async save(snapshot) {
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot))
    } catch (e) {
      console.warn('[grid] persist failed', e)
    }
  },

  async clear() {
    localStorage.removeItem(KEY)
  },
}
