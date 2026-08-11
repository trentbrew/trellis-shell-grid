import { describe, it, expect } from 'vitest'
import { ACTIVE_MODES } from '../wm/model'

describe('layout modes', () => {
  it('does not expose table and keeps grid as the fifth active mode', () => {
    expect(ACTIVE_MODES.some((m) => m.id === 'table')).toBe(false)
    expect(ACTIVE_MODES[4]?.id).toBe('grid')
  })
})
