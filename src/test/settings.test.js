import { describe, it, expect } from 'vitest'
import { buildChordLookup, DEFAULT_KEYBINDINGS, eventToChord } from '../settings'

function key(chord) {
  const [mods, code] = (() => {
    const parts = chord.split('+')
    return [parts.slice(0, -1), parts[parts.length - 1]]
  })()
  return {
    code,
    metaKey: mods.includes('mod'),
    altKey: mods.includes('alt'),
    shiftKey: mods.includes('shift'),
  }
}

describe('eventToChord', () => {
  it('canonicalizes modifiers in mod, alt, shift order', () => {
    expect(eventToChord(key('mod+alt+ArrowRight'))).toBe('mod+alt+ArrowRight')
    expect(eventToChord(key('alt+mod+ArrowRight'))).toBe('mod+alt+ArrowRight')
    expect(eventToChord(key('mod+shift+KeyF'))).toBe('mod+shift+KeyF')
    expect(eventToChord(key('shift+mod+KeyF'))).toBe('mod+shift+KeyF')
  })

  it('every default binding matches its own chord via the lookup', () => {
    const lookup = buildChordLookup(DEFAULT_KEYBINDINGS)
    for (const b of DEFAULT_KEYBINDINGS) {
      expect(lookup.get(eventToChord(key(b.chord)))?.id, b.id).toBe(b.id)
    }
  })

  it('space switching binds to mod+alt+arrows', () => {
    const lookup = buildChordLookup(DEFAULT_KEYBINDINGS)
    expect(lookup.get('mod+alt+ArrowLeft')?.id).toBe('space-prev')
    expect(lookup.get('mod+alt+ArrowRight')?.id).toBe('space-next')
  })
})
