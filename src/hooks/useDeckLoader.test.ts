import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDeckLoader } from './useDeckLoader'
import type { Route } from '../core/route'
import type { SlideAction } from '../core/store'
import type { Dispatch } from 'react'

vi.mock('../core/loader', () => ({
  loadDeck: vi.fn(),
  migrateOldStorage: vi.fn(),
}))

describe('useDeckLoader', () => {
  let dispatch: Dispatch<SlideAction>
  let setRoute: (route: Route) => void

  beforeEach(() => {
    vi.clearAllMocks()
    dispatch = vi.fn()
    setRoute = vi.fn()
  })

  it('calls migrateOldStorage on mount', async () => {
    const { migrateOldStorage } = await import('../core/loader')

    const route: Route = { view: 'picker' }
    renderHook(() => useDeckLoader(route, setRoute, dispatch))

    expect(migrateOldStorage).toHaveBeenCalledOnce()
  })

  it('dispatches UNLOAD_DECK when route is picker', async () => {
    const route: Route = { view: 'picker' }
    renderHook(() => useDeckLoader(route, setRoute, dispatch))

    expect(dispatch).toHaveBeenCalledWith({ type: 'UNLOAD_DECK' })
  })

  it('dispatches LOAD_DECK when deck is found', async () => {
    const { loadDeck } = await import('../core/loader')
    vi.mocked(loadDeck).mockReturnValue('# Slide 1')

    const route: Route = { view: 'presentation', deckId: 'test', slideIndex: 0 }
    renderHook(() => useDeckLoader(route, setRoute, dispatch))

    expect(loadDeck).toHaveBeenCalledWith('test')
    expect(dispatch).toHaveBeenCalledWith({ type: 'LOAD_DECK', deckId: 'test', markdown: '# Slide 1' })
  })

  it('redirects to picker when deck is not found', async () => {
    const { loadDeck } = await import('../core/loader')
    vi.mocked(loadDeck).mockReturnValue(null)

    const route: Route = { view: 'presentation', deckId: 'nonexistent', slideIndex: 0 }
    renderHook(() => useDeckLoader(route, setRoute, dispatch))

    expect(setRoute).toHaveBeenCalledWith({ view: 'picker' })
  })

  it('loads deck for editor view', async () => {
    const { loadDeck } = await import('../core/loader')
    vi.mocked(loadDeck).mockReturnValue('# Editor Slide')

    const route: Route = { view: 'editor', deckId: 'test' }
    renderHook(() => useDeckLoader(route, setRoute, dispatch))

    expect(loadDeck).toHaveBeenCalledWith('test')
    expect(dispatch).toHaveBeenCalledWith({ type: 'LOAD_DECK', deckId: 'test', markdown: '# Editor Slide' })
  })

  it('loads deck for overview view', async () => {
    const { loadDeck } = await import('../core/loader')
    vi.mocked(loadDeck).mockReturnValue('# Overview Slide')

    const route: Route = { view: 'overview', deckId: 'test' }
    renderHook(() => useDeckLoader(route, setRoute, dispatch))

    expect(loadDeck).toHaveBeenCalledWith('test')
    expect(dispatch).toHaveBeenCalledWith({ type: 'LOAD_DECK', deckId: 'test', markdown: '# Overview Slide' })
  })
})
