import { describe, it, expect, vi } from 'vitest'
import { createKeyboardHandler, type KeyboardActions } from './keyboard'

function makeActions(): KeyboardActions {
  return {
    nextSlide: vi.fn(),
    prevSlide: vi.fn(),
    firstSlide: vi.fn(),
    lastSlide: vi.fn(),
    toggleFullscreen: vi.fn(),
    toggleOverview: vi.fn(),
    toggleEditor: vi.fn(),
    escape: vi.fn(),
    goToSlide: vi.fn(),
  }
}

function fireKey(key: string) {
  return new KeyboardEvent('keydown', { key, bubbles: true })
}

describe('createKeyboardHandler', () => {
  it('calls nextSlide on ArrowRight', () => {
    const actions = makeActions()
    const handler = createKeyboardHandler(actions)
    handler(fireKey('ArrowRight'))
    expect(actions.nextSlide).toHaveBeenCalled()
  })

  it('calls prevSlide on ArrowLeft', () => {
    const actions = makeActions()
    const handler = createKeyboardHandler(actions)
    handler(fireKey('ArrowLeft'))
    expect(actions.prevSlide).toHaveBeenCalled()
  })

  it('calls toggleFullscreen on f', () => {
    const actions = makeActions()
    const handler = createKeyboardHandler(actions)
    handler(fireKey('f'))
    expect(actions.toggleFullscreen).toHaveBeenCalled()
  })

  it('calls goToSlide for number keys 1-9', () => {
    const actions = makeActions()
    const handler = createKeyboardHandler(actions)
    handler(fireKey('3'))
    expect(actions.goToSlide).toHaveBeenCalledWith(2)
  })
})
