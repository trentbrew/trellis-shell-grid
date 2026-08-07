import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import {
  createGroup,
  createSpace,
  createWindow,
  DEFAULT_GROUPS,
  ACTIVE_MODES,
  seedMainSpace,
} from './model'
import {
  computeLayout,
  DIRECT_GEOMETRY_MODES,
  RESIZABLE_MODES,
  WORLD_CAMERA_MODES,
} from './layouts'
import { loadPersistedState, savePersistedState } from '../persist/index.js'
import { isTerminalSessionRunning, onTerminalStatus } from '../terminal/registry.js'

function buildInitial() {
  const main = seedMainSpace()
  const scratch = createSpace({
    id: 'space-2',
    name: 'Scratch',
    mode: 'freeform',
    windows: [
      createWindow({
        kind: 'terminal',
        title: 'scratch',
        group: 'violet',
        x: 120,
        y: 100,
      }),
    ],
  })
  scratch.focusId = scratch.windows[0]?.id ?? null
  return {
    spaces: [main, scratch],
    activeSpaceId: main.id,
    groups: DEFAULT_GROUPS.map((g) => ({ ...g })),
    viewport: { w: 0, h: 0 },
    morphGen: 0,
    zen: false,
  }
}

function activeSpace(state) {
  return state.spaces.find((s) => s.id === state.activeSpaceId) ?? state.spaces[0]
}

function patchActive(state, patch, bumpMorph = false) {
  const id = state.activeSpaceId
  return {
    ...state,
    morphGen: bumpMorph ? state.morphGen + 1 : state.morphGen,
    spaces: state.spaces.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  }
}

function reducer(state, action) {
  const space = activeSpace(state)

  switch (action.type) {
    case 'viewport':
      return { ...state, viewport: action.viewport }

    case 'mode': {
      if (space.mode === action.mode) return state
      return patchActive(state, { mode: action.mode, prevMode: null }, true)
    }

    case 'cycle-mode': {
      const idx = ACTIVE_MODES.findIndex((m) => m.id === space.mode)
      if (idx < 0) {
        return patchActive(state, { mode: ACTIVE_MODES[0].id, prevMode: null }, true)
      }
      const next =
        ACTIVE_MODES[
          (idx + (action.dir ?? 1) + ACTIVE_MODES.length) % ACTIVE_MODES.length
        ]
      return patchActive(state, { mode: next.id, prevMode: null }, true)
    }

    case 'focus':
      return patchActive(state, { focusId: action.id }, true)

    case 'zoom-window': {
      // double-click titlebar / expand button → niri mode focused on that window.
      // Already zoomed on this window → restore the previous layout.
      if (state.zen) {
        return patchActive(state, { focusId: action.id })
      }
      if (space.mode === 'niri' && space.focusId === action.id) {
        if (space.prevMode) {
          return patchActive(
            state,
            { mode: space.prevMode, prevMode: null, focusId: action.id },
            true,
          )
        }
        return state
      }
      return patchActive(
        state,
        { mode: 'niri', focusId: action.id, prevMode: space.mode },
        true,
      )
    }

    case 'zen-set': {
      const zen = Boolean(action.zen)
      if (state.zen === zen) return state
      return { ...state, zen, morphGen: state.morphGen + 1 }
    }

    case 'zen-toggle':
      return { ...state, zen: !state.zen, morphGen: state.morphGen + 1 }

    case 'focus-delta': {
      const list = space.windows.filter((w) => !w.minimized)
      if (!list.length) return state
      const i = Math.max(0, list.findIndex((w) => w.id === space.focusId))
      const next = list[(i + action.delta + list.length) % list.length]
      return patchActive(state, { focusId: next.id }, true)
    }

    case 'add': {
      const win = createWindow(action.partial)
      return patchActive(
        state,
        {
          windows: [...space.windows, win],
          focusId: win.id,
        },
        true,
      )
    }

    case 'remove': {
      const windows = space.windows.filter((w) => w.id !== action.id)
      const focusId =
        space.focusId === action.id
          ? windows[windows.length - 1]?.id ?? null
          : space.focusId
      const patch =
        space.focusId === action.id ? { prevMode: null } : {}
      return patchActive(state, { windows, focusId, ...patch }, true)
    }

    case 'patch-window': {
      const windows = space.windows.map((w) =>
        w.id === action.id ? { ...w, ...action.patch } : w,
      )
      return patchActive(state, { windows })
    }

    case 'minimize': {
      const idx = space.windows.findIndex((w) => w.id === action.id)
      if (idx < 0) return state
      const windows = space.windows.map((w, i) =>
        i === idx ? { ...w, minimized: true } : w,
      )
      const next = space.windows
        .slice(idx + 1)
        .concat(space.windows.slice(0, idx))
        .find((w) => !w.minimized)
      const focusId =
        space.focusId === action.id
          ? next?.id ?? space.focusId
          : space.focusId
      return patchActive(state, { windows, focusId }, true)
    }

    case 'restore': {
      const windows = space.windows.map((w) =>
        w.id === action.id ? { ...w, minimized: false } : w,
      )
      return patchActive(
        state,
        { windows, focusId: action.id },
        true,
      )
    }

    case 'bring-front': {
      const maxZ = space.windows.reduce((m, w) => Math.max(m, w.z), 0)
      return patchActive(state, {
        focusId: action.id,
        windows: space.windows.map((w) =>
          w.id === action.id ? { ...w, z: maxZ + 1 } : w,
        ),
      })
    }

    case 'camera':
      return patchActive(state, {
        camera: { ...space.camera, ...action.camera },
      })

    case 'camera-reset':
      return patchActive(state, { camera: { x: 0, y: 0, zoom: 1 } }, true)

    case 'set-space': {
      if (action.id === state.activeSpaceId) return state
      if (!state.spaces.some((s) => s.id === action.id)) return state
      return {
        ...state,
        activeSpaceId: action.id,
        morphGen: state.morphGen + 1,
      }
    }

    case 'cycle-space': {
      const idx = state.spaces.findIndex((s) => s.id === state.activeSpaceId)
      const next =
        state.spaces[
          (idx + action.dir + state.spaces.length) % state.spaces.length
        ]
      if (next.id === state.activeSpaceId) return state
      return {
        ...state,
        activeSpaceId: next.id,
        morphGen: state.morphGen + 1,
      }
    }

    case 'add-space': {
      const sp = createSpace(action.partial)
      return {
        ...state,
        spaces: [...state.spaces, sp],
        activeSpaceId: sp.id,
        morphGen: state.morphGen + 1,
      }
    }

    case 'rename-space': {
      return {
        ...state,
        spaces: state.spaces.map((s) =>
          s.id === action.id ? { ...s, name: action.name } : s,
        ),
      }
    }

    case 'remove-space': {
      if (state.spaces.length <= 1) return state
      const spaces = state.spaces.filter((s) => s.id !== action.id)
      const activeSpaceId =
        state.activeSpaceId === action.id
          ? spaces[0].id
          : state.activeSpaceId
      return {
        ...state,
        spaces,
        activeSpaceId,
        morphGen: state.morphGen + 1,
      }
    }

    case 'add-group': {
      const g = createGroup(action.partial)
      return { ...state, groups: [...state.groups, g] }
    }

    case 'patch-group': {
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.id ? { ...g, ...action.patch } : g,
        ),
      }
    }

    case 'remove-group': {
      const groups = state.groups.filter((g) => g.id !== action.id)
      const spaces = state.spaces.map((s) => ({
        ...s,
        windows: s.windows.map((w) =>
          w.groupId === action.id ? { ...w, groupId: null } : w,
        ),
      }))
      return { ...state, groups, spaces }
    }

    case 'assign-group': {
      const windows = space.windows.map((w) =>
        w.id === action.windowId ? { ...w, groupId: action.groupId } : w,
      )
      return patchActive(state, { windows })
    }

    case 'grid-resize': {
      const { id, size } = action
      const gridSizes = { ...(space.gridSizes ?? {}) }
      if (size) {
        gridSizes[id] = size
      } else {
        delete gridSizes[id]
      }
      return patchActive(state, { gridSizes })
    }

    case 'hydrate': {
      const p = action.persisted
      if (!p || !Array.isArray(p.spaces) || !p.spaces.length) return state
      return {
        ...state,
        spaces: p.spaces,
        groups: p.groups ?? state.groups,
        activeSpaceId: p.activeSpaceId ?? p.spaces[0].id,
        morphGen: state.morphGen + 1,
      }
    }

    default:
      return state
  }
}

export function useWM() {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitial)
  const stateRef = useRef(state)
  stateRef.current = state

  // hydrate from persistence once on mount
  useEffect(() => {
    let cancelled = false
    loadPersistedState()
      .then((persisted) => {
        if (!cancelled && persisted) {
          dispatch({ type: 'hydrate', persisted })
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // debounced persist on durable state changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      savePersistedState(stateRef.current).catch(() => {})
    }, 400)
    return () => window.clearTimeout(timer)
  }, [state.spaces, state.activeSpaceId, state.groups])

  // terminal lifecycle → window status dots
  useEffect(() => {
    return onTerminalStatus((windowId, status) => {
      dispatch({ type: 'patch-window', id: windowId, patch: { status } })
    })
  }, [])

  const space = activeSpace(state)

  const layout = useMemo(() => {
    return computeLayout(space.mode, {
      windows: space.windows,
      viewport: state.viewport,
      focusId: space.focusId,
      camera: space.camera,
      gridSizes: space.gridSizes,
    })
  }, [space.mode, space.windows, space.focusId, space.camera, space.gridSizes, state.viewport])

  const setViewport = useCallback((viewport) => {
    dispatch({ type: 'viewport', viewport })
  }, [])

  const setMode = useCallback((mode) => {
    dispatch({ type: 'mode', mode })
  }, [])

  const cycleMode = useCallback((dir = 1) => {
    dispatch({ type: 'cycle-mode', dir })
  }, [])

  const focus = useCallback((id) => {
    dispatch({ type: 'focus', id })
  }, [])

  const focusDelta = useCallback((delta) => {
    dispatch({ type: 'focus-delta', delta })
  }, [])

  const addWindow = useCallback((partial) => {
    dispatch({ type: 'add', partial })
  }, [])

  const removeWindow = useCallback((id, force = false) => {
    if (!force) {
      const state = stateRef.current
      const space = state.spaces[state.activeSpace]
      const win = space?.windows.find((w) => w.id === id)
      if (win?.kind === 'terminal' && isTerminalSessionRunning(id)) {
        if (!confirm('Close this terminal? Any running processes will be killed.')) return
      }
    }
    dispatch({ type: 'remove', id })
  }, [])

  const patchWindow = useCallback((id, patch) => {
    dispatch({ type: 'patch-window', id, patch })
  }, [])

  const bringFront = useCallback((id) => {
    dispatch({ type: 'bring-front', id })
  }, [])

  const zoomWindow = useCallback((id) => {
    dispatch({ type: 'zoom-window', id })
  }, [])

  const setZen = useCallback((zen) => {
    dispatch({ type: 'zen-set', zen })
  }, [])

  const toggleZen = useCallback(() => {
    dispatch({ type: 'zen-toggle' })
  }, [])

  const setCamera = useCallback((camera) => {
    dispatch({ type: 'camera', camera })
  }, [])

  const resetCamera = useCallback(() => {
    dispatch({ type: 'camera-reset' })
  }, [])

  const setSpace = useCallback((id) => {
    dispatch({ type: 'set-space', id })
  }, [])

  const cycleSpace = useCallback((dir = 1) => {
    dispatch({ type: 'cycle-space', dir })
  }, [])

  const addSpace = useCallback((partial) => {
    dispatch({ type: 'add-space', partial })
  }, [])

  const renameSpace = useCallback((id, name) => {
    dispatch({ type: 'rename-space', id, name })
  }, [])

  const removeSpace = useCallback((id) => {
    dispatch({ type: 'remove-space', id })
  }, [])

  const addGroup = useCallback((partial) => {
    dispatch({ type: 'add-group', partial })
  }, [])

  const patchGroup = useCallback((id, patch) => {
    dispatch({ type: 'patch-group', id, patch })
  }, [])

  const removeGroup = useCallback((id) => {
    dispatch({ type: 'remove-group', id })
  }, [])

  const assignGroup = useCallback((windowId, groupId) => {
    dispatch({ type: 'assign-group', windowId, groupId })
  }, [])

  const minimizeWindow = useCallback((id) => {
    dispatch({ type: 'minimize', id })
  }, [])

  const restoreWindow = useCallback((id) => {
    dispatch({ type: 'restore', id })
  }, [])

  const gridResize = useCallback((id, size) => {
    dispatch({ type: 'grid-resize', id, size })
  }, [])

  const moveFocused = useCallback(
    (dx, dy) => {
      const s = stateRef.current
      const sp = activeSpace(s)
      if (!sp.focusId || !DIRECT_GEOMETRY_MODES.has(sp.mode)) return
      const win = sp.windows.find((w) => w.id === sp.focusId)
      if (!win) return
      const step = sp.mode === 'freeform' ? 24 / (sp.camera.zoom || 1) : 24
      patchWindow(sp.focusId, {
        x: win.x + dx * step,
        y: win.y + dy * step,
      })
    },
    [patchWindow],
  )

  return {
    spaces: state.spaces,
    activeSpaceId: state.activeSpaceId,
    groups: state.groups,
    space,
    windows: space.windows,
    mode: space.mode,
    focusId: space.focusId,
    camera: space.camera,
    viewport: state.viewport,
    morphGen: state.morphGen,
    zen: state.zen,
    layout,
    isWorld: WORLD_CAMERA_MODES.has(space.mode),
    isDirectGeo: DIRECT_GEOMETRY_MODES.has(space.mode),
    isResizable: RESIZABLE_MODES.has(space.mode),
    gridSizes: space.gridSizes,
    prevMode: space.prevMode,
    setViewport,
    setMode,
    cycleMode,
    focus,
    focusDelta,
    addWindow,
    removeWindow,
    patchWindow,
    bringFront,
    zoomWindow,
    setCamera,
    resetCamera,
    setSpace,
    cycleSpace,
    addSpace,
    renameSpace,
    removeSpace,
    addGroup,
    patchGroup,
    removeGroup,
    assignGroup,
    minimizeWindow,
    restoreWindow,
    gridResize,
    moveFocused,
    setZen,
    toggleZen,
  }
}
