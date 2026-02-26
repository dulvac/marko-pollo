import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSaveShortcut } from './useSaveShortcut'
import type { Route } from '../core/route'
import type { SlideState } from '../core/store'

vi.mock('../core/exporter', () => ({
  exportMarkdown: vi.fn(),
}))

function makeState(overrides: Partial<SlideState> = {}): SlideState {
  return {
    rawMarkdown: '# Test',
    slides: [{ metadata: {}, rawContent: '# Test' }],
    deckMetadata: { title: 'Test Deck' },
    currentIndex: 0,
    currentDeck: 'test',
    ...overrides,
  }
}

describe('useSaveShortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any lingering event listeners by unmounting hooks
  })

  it('calls exportMarkdown on Ctrl+S', async () => {
    const { exportMarkdown } = await import('../core/exporter')
    const state = makeState()
    const route: Route = { view: 'presentation', deckId: 'test', slideIndex: 0 }

    renderHook(() => useSaveShortcut(state, route))

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true })
    window.dispatchEvent(event)

    expect(exportMarkdown).toHaveBeenCalledWith('# Test', 'Test Deck', 'test')
  })

  it('calls exportMarkdown on Cmd+S (metaKey)', async () => {
    const { exportMarkdown } = await import('../core/exporter')
    const state = makeState()
    const route: Route = { view: 'presentation', deckId: 'test', slideIndex: 0 }

    renderHook(() => useSaveShortcut(state, route))

    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true, cancelable: true })
    window.dispatchEvent(event)

    expect(exportMarkdown).toHaveBeenCalledWith('# Test', 'Test Deck', 'test')
  })

  it('does not call exportMarkdown in picker view', async () => {
    const { exportMarkdown } = await import('../core/exporter')
    const state = makeState()
    const route: Route = { view: 'picker' }

    renderHook(() => useSaveShortcut(state, route))

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true })
    window.dispatchEvent(event)

    expect(exportMarkdown).not.toHaveBeenCalled()
  })

  it('does not call exportMarkdown when rawMarkdown is empty', async () => {
    const { exportMarkdown } = await import('../core/exporter')
    const state = makeState({ rawMarkdown: '' })
    const route: Route = { view: 'presentation', deckId: 'test', slideIndex: 0 }

    renderHook(() => useSaveShortcut(state, route))

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true })
    window.dispatchEvent(event)

    expect(exportMarkdown).not.toHaveBeenCalled()
  })
})
