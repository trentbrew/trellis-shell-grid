import { describe, it, expect } from 'vitest'
import { layoutStack } from '../wm/layouts/stack'
import { createWindow } from '../wm/model'

const viewport = { w: 1200, h: 800 }

function makeWindows(count = 5) {
  return Array.from({ length: count }, (_, i) =>
    createWindow({ id: `w-${i}`, title: `win-${i}` }),
  )
}

/** Returns window ids ordered from front (top) to back (bottom) */
function frontToBack(rects, windows) {
  return [...windows]
    .filter((w) => rects[w.id])
    .sort((a, b) => rects[b.id].z - rects[a.id].z)
    .map((w) => w.id)
}

describe('layoutStack', () => {
  it('returns empty rects for no windows', () => {
    const result = layoutStack({ windows: [], viewport, focusId: null })
    expect(result.rects).toEqual({})
  })

  it('places focused window on top (highest z)', () => {
    const windows = makeWindows(3)
    const result = layoutStack({ windows, viewport, focusId: windows[1].id })
    const rects = Object.values(result.rects)
    const focused = rects.find((r) => r.z === Math.max(...rects.map((r) => r.z)))
    expect(focused).toBeDefined()
  })

  it('produces valid rects for all non-minimized windows', () => {
    const windows = makeWindows(4)
    const result = layoutStack({ windows, viewport, focusId: windows[0].id })
    expect(Object.keys(result.rects).length).toBe(4)
    for (const [id, r] of Object.entries(result.rects)) {
      expect(r.w).toBeGreaterThan(0)
      expect(r.h).toBeGreaterThan(0)
      expect(r.visible).toBe(true)
    }
  })

  it('minimized windows are excluded from layout', () => {
    const windows = makeWindows(3)
    windows[1].minimized = true
    const result = layoutStack({ windows, viewport, focusId: windows[0].id })
    expect(Object.keys(result.rects).length).toBe(2)
    expect(result.rects[windows[1].id]).toBeUndefined()
  })

  it('focused window has opacity 1', () => {
    const windows = makeWindows(3)
    const result = layoutStack({ windows, viewport, focusId: windows[2].id })
    const focused = result.rects[windows[2].id]
    expect(focused.opacity).toBe(1)
  })

  it('back windows have lower opacity than front', () => {
    const windows = makeWindows(4)
    const result = layoutStack({ windows, viewport, focusId: windows[0].id })
    const rects = Object.values(result.rects)
    const opacities = rects.map((r) => r.opacity)
    const maxOpacity = Math.max(...opacities)
    const minOpacity = Math.min(...opacities)
    expect(maxOpacity).toBeGreaterThan(minOpacity)
  })

  it('changing focus changes the z-order', () => {
    const windows = makeWindows(3)
    const resultA = layoutStack({ windows, viewport, focusId: windows[0].id })
    const resultB = layoutStack({ windows, viewport, focusId: windows[2].id })
    expect(resultA.rects[windows[0].id].z).not.toBe(
      resultB.rects[windows[0].id].z,
    )
  })

  it('focused window is at the front of the stack', () => {
    const windows = makeWindows(5)
    const result = layoutStack({ windows, viewport, focusId: windows[2].id })
    const order = frontToBack(result.rects, windows)
    expect(order[0]).toBe('w-2')
  })

  it('wrap-around: forward cycle from last window brings first window to front smoothly', () => {
    const windows = makeWindows(5)
    const resultFromLast = layoutStack({
      windows,
      viewport,
      focusId: windows[4].id,
    })
    const resultToFirst = layoutStack({
      windows,
      viewport,
      focusId: windows[0].id,
    })
    const orderFromLast = frontToBack(resultFromLast.rects, windows)
    const orderToFirst = frontToBack(resultToFirst.rects, windows)
    expect(orderToFirst[0]).toBe('w-0')
    expect(orderFromLast[0]).toBe('w-4')
  })

  it('adjacent focus changes shift non-involved windows in lockstep', () => {
    const windows = makeWindows(5)
    const resultC = layoutStack({ windows, viewport, focusId: windows[2].id })
    const resultD = layoutStack({ windows, viewport, focusId: windows[3].id })
    for (const w of windows) {
      if (w.id === windows[2].id || w.id === windows[3].id) continue
      const zC = resultC.rects[w.id].z
      const zD = resultD.rects[w.id].z
      expect(zD - zC).toBe(-1)
    }
  })

  it('backward adjacent focus changes shift non-involved windows in lockstep', () => {
    const windows = makeWindows(5)
    const resultC = layoutStack({ windows, viewport, focusId: windows[2].id })
    const resultB = layoutStack({ windows, viewport, focusId: windows[1].id })
    for (const w of windows) {
      if (w.id === windows[1].id || w.id === windows[2].id) continue
      const zC = resultC.rects[w.id].z
      const zB = resultB.rects[w.id].z
      expect(zB - zC).toBe(1)
    }
  })
})