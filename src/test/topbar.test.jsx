import { render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { TopBar } from '../wm/TopBar'

function renderTopBar() {
  return render(
    <TopBar
      mode="grid"
      spaces={[{ id: 's1', name: 'Home', windows: [] }]}
      activeSpaceId="s1"
      groups={[]}
      zen={false}
      onMode={() => {}}
      onAdd={() => {}}
      onSetSpace={() => {}}
      onAddSpace={() => {}}
      onRenameSpace={() => {}}
      onRemoveSpace={() => {}}
      onAddGroup={() => {}}
      onPatchGroup={() => {}}
      onRemoveGroup={() => {}}
      onToggleZen={() => {}}
      onOpenPalette={() => {}}
      onOpenSettings={() => {}}
    />,
  )
}

describe('TopBar responsive layout', () => {
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1280,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    })
  })

  it('shows a compact view dropdown on narrow screens and keeps the search button left-aligned', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 700,
    })

    renderTopBar()

    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search and commands/i })).toHaveClass(
      'search-btn--left',
    )
  })
})
