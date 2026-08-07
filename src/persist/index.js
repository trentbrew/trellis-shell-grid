import { localStorageAdapter } from './localStorage.js'
import { trellisAdapter } from './trellis.js'

/**
 * Persistence provider — pick the best available adapter.
 * Trellis wins when configured; otherwise localStorage.
 */
export async function resolveAdapter() {
  if (trellisAdapter.enabled) return trellisAdapter
  return localStorageAdapter
}

/**
 * Build a snapshot from WM state (view-state fields excluded).
 */
export const SNAPSHOT_VERSION = 2

export function toSnapshot(state) {
  return {
    version: SNAPSHOT_VERSION,
    spaces: state.spaces,
    activeSpaceId: state.activeSpaceId,
    groups: state.groups,
  }
}

/**
 * Load persisted state. Returns null when nothing is stored.
 */
export async function loadPersistedState() {
  const adapter = await resolveAdapter()
  const raw = await adapter.load()
  if (!raw) return null
  return raw
}

/**
 * Persist WM state via the active adapter. Fire-and-forget with debounce
 * handled by the caller.
 */
export async function savePersistedState(state) {
  const adapter = await resolveAdapter()
  await adapter.save(toSnapshot(state))
}
