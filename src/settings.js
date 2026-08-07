const SETTINGS_KEY = 'grid.settings'

/**
 * Default keybindings. `chord` is the canonical machine format:
 * modifier tokens (`mod`, `alt`, `shift`) + KeyboardEvent `code`,
 * joined by `+` and sorted (mod, alt, shift). e.g. `mod+Slash` = ⌘/.
 */
export const DEFAULT_KEYBINDINGS = [
  // Layout modes
  { id: 'layout-1', label: 'Grid layout', chord: 'Digit1' },
  { id: 'layout-2', label: 'Canvas layout', chord: 'Digit2' },
  { id: 'layout-3', label: 'Niri layout', chord: 'Digit3' },
  { id: 'layout-4', label: 'Floating layout', chord: 'Digit4' },
  { id: 'layout-5', label: 'Fibonacci layout', chord: 'Digit5' },
  { id: 'layout-6', label: 'Tabs layout', chord: 'Digit6' },
  { id: 'layout-7', label: 'Stack layout', chord: 'Digit7' },
  { id: 'cycle-next', label: 'Next view mode', chord: 'alt+Period' },
  { id: 'cycle-prev', label: 'Previous view mode', chord: 'alt+Comma' },
  { id: 'zen', label: 'Zen mode', chord: 'alt+KeyZ' },
  { id: 'reset-camera', label: 'Reset camera', chord: 'Digit0' },

  // Navigation
  { id: 'focus-next', label: 'Next window', chord: 'mod+Period' },
  { id: 'focus-prev', label: 'Previous window', chord: 'mod+Comma' },
  { id: 'focus-next-tab', label: 'Next window (Tab)', chord: 'Tab' },
  { id: 'focus-prev-tab', label: 'Previous window (Shift+Tab)', chord: 'shift+Tab' },
  { id: 'focus-next-j', label: 'Next window (vim)', chord: 'KeyJ' },
  { id: 'focus-prev-k', label: 'Previous window (vim)', chord: 'KeyK' },
  { id: 'focus-left', label: 'Focus left', chord: 'ArrowLeft' },
  { id: 'focus-up', label: 'Focus up', chord: 'ArrowUp' },
  { id: 'focus-right', label: 'Focus right', chord: 'ArrowRight' },
  { id: 'focus-down', label: 'Focus down', chord: 'ArrowDown' },
  { id: 'move-left', label: 'Move window left', chord: 'alt+ArrowLeft' },
  { id: 'move-up', label: 'Move window up', chord: 'alt+ArrowUp' },
  { id: 'move-right', label: 'Move window right', chord: 'alt+ArrowRight' },
  { id: 'move-down', label: 'Move window down', chord: 'alt+ArrowDown' },

  // Window actions
  { id: 'new-window', label: 'New window', chord: 'mod+Slash' },
  { id: 'close-window', label: 'Close window', chord: 'alt+KeyX' },
  { id: 'minimize', label: 'Minimize window', chord: 'mod+KeyM' },

  // Spaces
  { id: 'space-prev', label: 'Previous space', chord: 'mod+alt+ArrowLeft' },
  { id: 'space-next', label: 'Next space', chord: 'mod+alt+ArrowRight' },

  // App-level
  { id: 'palette', label: 'Command palette', chord: 'alt+Space' },
  { id: 'search', label: 'Global search', chord: 'mod+shift+KeyF' },
  { id: 'settings', label: 'Open settings', chord: 'mod+shift+Comma' },
]

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  hints: false,
  keybindings: DEFAULT_KEYBINDINGS.map((b) => ({ ...b })),
}

export function loadSettings() {
  const fallback = () => ({
    ...DEFAULT_SETTINGS,
    keybindings: DEFAULT_KEYBINDINGS.map((b) => ({ ...b })),
  })
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return fallback()
    const parsed = JSON.parse(raw)
    const byId = {}
    for (const b of parsed.keybindings ?? []) byId[b.id] = b
    return {
      theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
      hints: parsed.hints ?? DEFAULT_SETTINGS.hints,
      keybindings: DEFAULT_KEYBINDINGS.map((d) => ({
        ...d,
        chord: byId[d.id]?.chord ?? d.chord,
      })),
    }
  } catch {
    return fallback()
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {}
}

/**
 * Normalize a KeyboardEvent into a canonical chord string.
 * Uses `code` (physical key) so shift-punctuation and layouts stay stable.
 * Modifier tokens are pushed in canonical order (mod, alt, shift).
 */
export function eventToChord(e) {
  const mods = []
  if (e.metaKey || e.ctrlKey) mods.push('mod')
  if (e.altKey) mods.push('alt')
  if (e.shiftKey) mods.push('shift')
  return [...mods, e.code || e.key].join('+')
}

/** Build chord → binding lookup for O(1) dispatch. */
export function buildChordLookup(keybindings) {
  const map = new Map()
  for (const b of keybindings) map.set(b.chord, b)
  return map
}

const MOD_GLYPHS = { mod: '⌘', alt: '⌥', shift: '⇧' }

const KEY_GLYPHS = {
  Space: 'Space',
  Slash: '/',
  Period: '.',
  Comma: ',',
  Tab: 'Tab',
  ArrowLeft: '←',
  ArrowUp: '↑',
  ArrowRight: '→',
  ArrowDown: '↓',
  Enter: '⏎',
  Escape: 'Esc',
  Backspace: '⌫',
}

/** Render a chord for display, e.g. `mod+shift+Comma` → `⌘⇧,`. */
export function formatChord(chord) {
  if (!chord) return ''
  const parts = chord.split('+')
  const mods = parts.slice(0, -1).map((m) => MOD_GLYPHS[m] ?? m)
  const code = parts[parts.length - 1]
  const key =
    KEY_GLYPHS[code] ?? code.replace(/^Key/, '').replace(/^Digit/, '')
  return [...mods, key].join('')
}
