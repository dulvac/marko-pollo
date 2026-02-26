import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRouteSync } from './useRouteSync'
import type { Route } from '../core/route'

describe('useRouteSync', () => {
  let setRoute: (route: Route) => void

  beforeEach(() => {
    vi.clearAllMocks()
    setRoute = vi.fn()
  })

  it('does not sync route on first render', () => {
    const route: Route = { view: 'presentation', deckId: 'test', slideIndex: 0 }
    renderHook(() => useRouteSync(route, 0, setRoute))

    expect(setRoute).not.toHaveBeenCalled()
  })

  it('syncs route when currentIndex changes in presentation view', () => {
    const route: Route = { view: 'presentation', deckId: 'test', slideIndex: 0 }

    const { rerender } = renderHook(
      ({ route, currentIndex }) => useRouteSync(route, currentIndex, setRoute),
      { initialProps: { route, currentIndex: 0 } }
    )

    // Simulate state update: currentIndex changes to 2
    rerender({ route, currentIndex: 2 })

    expect(setRoute).toHaveBeenCalledWith({
      view: 'presentation',
      deckId: 'test',
      slideIndex: 2,
    })
  })

  it('does not sync when index matches route', () => {
    const route: Route = { view: 'presentation', deckId: 'test', slideIndex: 3 }

    const { rerender } = renderHook(
      ({ route, currentIndex }) => useRouteSync(route, currentIndex, setRoute),
      { initialProps: { route, currentIndex: 0 } }
    )

    // Rerender with matching index -- first rerender after mount will trigger
    // because currentIndex changed from 0 to 3
    rerender({ route, currentIndex: 3 })
    vi.clearAllMocks()

    // Now rerender again with same values -- should NOT sync
    rerender({ route, currentIndex: 3 })
    expect(setRoute).not.toHaveBeenCalled()
  })

  it('does not sync in non-presentation views', () => {
    const route: Route = { view: 'editor', deckId: 'test' }

    const { rerender } = renderHook(
      ({ route, currentIndex }) => useRouteSync(route, currentIndex, setRoute),
      { initialProps: { route, currentIndex: 0 } }
    )

    rerender({ route, currentIndex: 5 })

    expect(setRoute).not.toHaveBeenCalled()
  })

  it('does not sync in picker view', () => {
    const route: Route = { view: 'picker' }

    const { rerender } = renderHook(
      ({ route, currentIndex }) => useRouteSync(route, currentIndex, setRoute),
      { initialProps: { route, currentIndex: 0 } }
    )

    rerender({ route, currentIndex: 3 })

    expect(setRoute).not.toHaveBeenCalled()
  })
})
