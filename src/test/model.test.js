import { describe, it, expect } from 'vitest'
import { ACTIVE_MODES } from '../wm/model'

describe('layout modes', () => {
  it('does not expose table and keeps grid as the fourth active mode', () => {
    expect(ACTIVE_MODES.some((m) => m.id === 'table')).toBe(false)
    expect(ACTIVE_MODES[3]?.id).toBe('grid')
  })
})
