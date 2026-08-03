import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import {
  SEED_WINDOWS,
  createWindow,
  LAYOUT_MODES,
} from './model'
import {
  computeLayout,
  DIRECT_GEOMETRY_MODES,
  WORLD_CAMERA_MODES,
} from './layouts'

const INITIAL = {
  windows: SEED_WINDOWS,
  mode: 'grid',
  focusId: SEED_WINDOWS[0]?.id ?? null,
  camera: { x: 0, y: 0, zoom: 1 },
  viewport: { w: 0, h: 0 },
  morphGen: 0,
}

function reducer(state, action) {
  switch (action.type) {
    case 'viewport':
      return { ...state, viewport: action.viewport }
    case 'mode': {
      if (state.mode === action.mode) return state
      return {
        ...state,
        mode: action.mode,
        morphGen: state.morphGen + 1,
      }
    }
    case 'cycle-mode': {
      const idx = LAYOUT_MODES.findIndex((m) => m.id === state.mode)
      const next = LAYOUT_MODES[(idx + (action.dir ?? 1) + LAYOUT_MODES.length) % LAYOUT_MODES.length]
      return { ...state, mode: next.id, morphGen: state.morphGen + 1 }
    }
    case 'focus':
      return { ...state, focusId: action.id }
    case 'focus-delta': {
      const list = state.windows.filter((w) => !w.minimized)
      if (!list.length) return state
      const i = Math.max(0, list.findIndex((w) => w.id === state.focusId))
      const next = list[(i + action.delta + list.length) % list.length]
      return { ...state, focusId: next.id, morphGen: state.morphGen + 1 }
    }
    case 'add': {
      const win = createWindow(action.partial)
      return {
        ...state,
        windows: [...state.windows, win],
        focusId: win.id,
        morphGen: state.morphGen + 1,
      }
    }
    case 'remove': {
      const windows = state.windows.filter((w) => w.id !== action.id)
      const focusId =
        state.focusId === action.id
          ? windows[windows.length - 1]?.id ?? null
          : state.focusId
      return { ...state, windows, focusId, morphGen: state.morphGen + 1 }
    }
    case 'clear':
      return { ...state, windows: [], focusId: null, morphGen: state.morphGen + 1 }
    case 'patch-window': {
      const windows = state.windows.map((w) =>
        w.id === action.id ? { ...w, ...action.patch } : w,
      )
      return { ...state, windows }
    }
    case 'bring-front': {
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.z), 0)
      return {
        ...state,
        focusId: action.id,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, z: maxZ + 1 } : w,
        ),
      }
    }
    case 'camera':
      return { ...state, camera: { ...state.camera, ...action.camera } }
    case 'camera-reset':
      return { ...state, camera: { x: 0, y: 0, zoom: 1 }, morphGen: state.morphGen + 1 }
    default:
      return state
  }
}

export function useWM() {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const stateRef = useRef(state)
  stateRef.current = state

  const layout = useMemo(() => {
    return computeLayout(state.mode, {
      windows: state.windows,
      viewport: state.viewport,
      focusId: state.focusId,
      camera: state.camera,
    })
  }, [state.mode, state.windows, state.viewport, state.focusId, state.camera])

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

  const removeWindow = useCallback((id) => {
    dispatch({ type: 'remove', id })
  }, [])

  const clearWindows = useCallback(() => {
    dispatch({ type: 'clear' })
  }, [])

  const patchWindow = useCallback((id, patch) => {
    dispatch({ type: 'patch-window', id, patch })
  }, [])

  const bringFront = useCallback((id) => {
    dispatch({ type: 'bring-front', id })
  }, [])

  const setCamera = useCallback((camera) => {
    dispatch({ type: 'camera', camera })
  }, [])

  const resetCamera = useCallback(() => {
    dispatch({ type: 'camera-reset' })
  }, [])

  const moveFocused = useCallback(
    (dx, dy) => {
      const s = stateRef.current
      if (!s.focusId || !DIRECT_GEOMETRY_MODES.has(s.mode)) return
      const win = s.windows.find((w) => w.id === s.focusId)
      if (!win) return
      const step = s.mode === 'freeform' ? 24 / (s.camera.zoom || 1) : 24
      patchWindow(s.focusId, {
        x: win.x + dx * step,
        y: win.y + dy * step,
      })
    },
    [patchWindow],
  )

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      ) {
        return
      }

      const meta = e.metaKey || e.ctrlKey
      const key = e.key

      // mode keys 1-7
      const modeHit = LAYOUT_MODES.find((m) => m.key === key)
      if (modeHit && !meta && !e.altKey) {
        e.preventDefault()
        setMode(modeHit.id)
        return
      }

      if (key === 'Tab' && !meta) {
        e.preventDefault()
        focusDelta(e.shiftKey ? -1 : 1)
        return
      }

      if (key === '[' && !meta) {
        e.preventDefault()
        cycleMode(-1)
        return
      }
      if (key === ']' && !meta) {
        e.preventDefault()
        cycleMode(1)
        return
      }

      if ((key === 'n' || key === 'N') && meta) {
        e.preventDefault()
        addWindow({ kind: 'terminal' })
        return
      }

      if ((key === 'w' || key === 'W') && meta) {
        e.preventDefault()
        const id = stateRef.current.focusId
        if (id) removeWindow(id)
        return
      }

      if (key === 'Escape') {
        // no-op reserved
        return
      }

      if (key === '0' && !meta) {
        e.preventDefault()
        resetCamera()
        return
      }

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
        if (meta || e.altKey) {
          e.preventDefault()
          const dx = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0
          const dy = key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0
          moveFocused(dx, dy)
          return
        }
        // plain arrows: focus neighbors in strip/stack modes
        if (key === 'ArrowLeft' || key === 'ArrowUp') {
          e.preventDefault()
          focusDelta(-1)
        } else {
          e.preventDefault()
          focusDelta(1)
        }
      }

      if (key === 'j' && !meta) {
        e.preventDefault()
        focusDelta(1)
      }
      if (key === 'k' && !meta) {
        e.preventDefault()
        focusDelta(-1)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    setMode,
    cycleMode,
    focusDelta,
    addWindow,
    removeWindow,
    resetCamera,
    moveFocused,
  ])

  return {
    ...state,
    layout,
    isWorld: WORLD_CAMERA_MODES.has(state.mode),
    isDirectGeo: DIRECT_GEOMETRY_MODES.has(state.mode),
    setViewport,
    setMode,
    cycleMode,
    focus,
    focusDelta,
    addWindow,
    removeWindow,
    clearWindows,
    patchWindow,
    bringFront,
    setCamera,
    resetCamera,
  }
}
