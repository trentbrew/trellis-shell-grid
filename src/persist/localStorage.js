const VERSION = 2
const GLOBAL_KEY = 'grid.wm:v2:global'
const SPACE_PREFIX = 'grid.wm:v2:space:'
const LEGACY_KEY = 'grid.wm:v1'

/**
 * Space-scoped snapshot adapter (zero infra).
 *
 * Layout mirrors turtlecode's persisted-store pattern: one global key for
 * { activeSpaceId, groups, spaceIds } + one key per space holding that
 * space's windows/mode/camera. Loads are assembled; saves prune deleted
 * spaces; a legacy v1 flat key migrates on first read.
 */
function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('[grid] persist failed', e)
  }
}

function spaceKey(id) {
  return `${SPACE_PREFIX}${id}`
}

function pruneMissingSpaces(spaceIds) {
  const keep = new Set(spaceIds)
  const doomed = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(SPACE_PREFIX) && !keep.has(key.slice(SPACE_PREFIX.length))) {
      doomed.push(key)
    }
  }
  for (const key of doomed) localStorage.removeItem(key)
}

/** Split a legacy v1 snapshot into v2 keys. */
function migrateLegacy(legacy) {
  writeJSON(GLOBAL_KEY, {
    version: VERSION,
    activeSpaceId: legacy.activeSpaceId,
    groups: legacy.groups ?? [],
    spaceIds: legacy.spaces.map((s) => s.id),
  })
  for (const sp of legacy.spaces) {
    writeJSON(spaceKey(sp.id), sp)
  }
  localStorage.removeItem(LEGACY_KEY)
}

function assemble() {
  const global = readJSON(GLOBAL_KEY)
  if (!global || global.version !== VERSION) return null
  const spaces = (global.spaceIds ?? [])
    .map((id) => readJSON(spaceKey(id)))
    .filter(Boolean)
  if (!spaces.length) return null
  return {
    version: VERSION,
    activeSpaceId: global.activeSpaceId ?? spaces[0].id,
    groups: global.groups ?? [],
    spaces,
  }
}

export const localStorageAdapter = {
  name: 'localStorage',

  async load() {
    const legacy = readJSON(LEGACY_KEY)
    if (legacy) migrateLegacy(legacy)
    return assemble()
  },

  async save(snapshot) {
    writeJSON(GLOBAL_KEY, {
      version: VERSION,
      activeSpaceId: snapshot.activeSpaceId,
      groups: snapshot.groups,
      spaceIds: snapshot.spaces.map((s) => s.id),
    })
    for (const sp of snapshot.spaces) {
      writeJSON(spaceKey(sp.id), sp)
    }
    pruneMissingSpaces(snapshot.spaces.map((s) => s.id))
  },

  async clear() {
    localStorage.removeItem(GLOBAL_KEY)
    const doomed = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(SPACE_PREFIX)) doomed.push(key)
    }
    for (const key of doomed) localStorage.removeItem(key)
  },
}
