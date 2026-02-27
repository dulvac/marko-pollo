import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement } from 'react'
import { OverviewGrid } from './OverviewGrid'
import {
  SlideContext,
  SlideDispatchContext,
  type SlideState,
} from '../core/store'

function renderWithContext(
  ui: ReactElement,
  state: SlideState
) {
  return render(
    <SlideContext.Provider value={state}>
      <SlideDispatchContext.Provider value={() => {}}>
        {ui}
      </SlideDispatchContext.Provider>
    </SlideContext.Provider>
  )
}

describe('OverviewGrid', () => {
  it('renders correct number of thumbnails', () => {
    const state: SlideState = {
      rawMarkdown: '# Slide 1\n---\n# Slide 2\n---\n# Slide 3',
      slides: [
        {
          metadata: {},
          rawContent: '# Slide 1',
        },
        {
          metadata: {},
          rawContent: '# Slide 2',
        },
        {
          metadata: {},
          rawContent: '# Slide 3',
        },
      ],
      deckMetadata: {},
      currentIndex: 0,
      currentDeck: null,
    }

    const onSelectSlide = vi.fn()
    const { container } = renderWithContext(
      <OverviewGrid onSelectSlide={onSelectSlide} />,
      state
    )

    // Should have 3 thumbnails (divs with onClick handlers)
    const thumbnails = container.querySelectorAll('[class*="thumbnail"]')
    expect(thumbnails.length).toBeGreaterThanOrEqual(3)
  })

  it('highlights active slide with thumbnailActive class', () => {
    const state: SlideState = {
      rawMarkdown: '# Slide 1\n---\n# Slide 2',
      slides: [
        {
          metadata: {},
          rawContent: '# Slide 1',
        },
        {
          metadata: {},
          rawContent: '# Slide 2',
        },
      ],
      deckMetadata: {},
      currentIndex: 1, // Second slide is active
      currentDeck: null,
    }

    const onSelectSlide = vi.fn()
    const { container } = renderWithContext(
      <OverviewGrid onSelectSlide={onSelectSlide} />,
      state
    )

    // Find the grid container and get direct children (the actual thumbnail divs)
    const grid = container.querySelector('[class*="grid"]')
    const thumbnails = Array.from(grid?.children || [])

    // The second thumbnail (index 1) should have the active class
    expect(thumbnails[1]?.className).toMatch(/thumbnailActive/)
  })

  it('calls onSelectSlide with correct index on click', () => {
    const state: SlideState = {
      rawMarkdown: '# Slide 1\n---\n# Slide 2\n---\n# Slide 3',
      slides: [
        {
          metadata: {},
          rawContent: '# Slide 1',
        },
        {
          metadata: {},
          rawContent: '# Slide 2',
        },
        {
          metadata: {},
          rawContent: '# Slide 3',
        },
      ],
      deckMetadata: {},
      currentIndex: 0,
      currentDeck: null,
    }

    const onSelectSlide = vi.fn()
    const { container } = renderWithContext(
      <OverviewGrid onSelectSlide={onSelectSlide} />,
      state
    )

    // Find the grid container and get direct children (the actual thumbnail divs)
    const grid = container.querySelector('[class*="grid"]')
    const thumbnails = Array.from(grid?.children || [])

    // Click the second thumbnail
    fireEvent.click(thumbnails[1] as Element)

    expect(onSelectSlide).toHaveBeenCalledWith(1)
  })

  it('shows slide numbers (1-based)', () => {
    const state: SlideState = {
      rawMarkdown: '# Slide 1\n---\n# Slide 2',
      slides: [
        {
          metadata: {},
          rawContent: '# Slide 1',
        },
        {
          metadata: {},
          rawContent: '# Slide 2',
        },
      ],
      deckMetadata: {},
      currentIndex: 0,
      currentDeck: null,
    }

    const onSelectSlide = vi.fn()
    renderWithContext(<OverviewGrid onSelectSlide={onSelectSlide} />, state)

    // Should show 1-based numbering
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onSelectSlide with correct index for each slide when clicked', () => {
    const state: SlideState = {
      rawMarkdown: '# Slide 1\n---\n# Slide 2\n---\n# Slide 3\n---\n# Slide 4',
      slides: [
        { metadata: {}, rawContent: '# Slide 1' },
        { metadata: {}, rawContent: '# Slide 2' },
        { metadata: {}, rawContent: '# Slide 3' },
        { metadata: {}, rawContent: '# Slide 4' },
      ],
      deckMetadata: {},
      currentIndex: 0,
      currentDeck: null,
    }

    const onSelectSlide = vi.fn()
    const { container } = renderWithContext(
      <OverviewGrid onSelectSlide={onSelectSlide} />,
      state
    )

    const grid = container.querySelector('[class*="grid"]')
    const thumbnails = Array.from(grid?.children || [])

    // Click each thumbnail and verify it passes the correct 0-based index
    thumbnails.forEach((thumb, i) => {
      fireEvent.click(thumb as Element)
      expect(onSelectSlide).toHaveBeenLastCalledWith(i)
    })

    expect(onSelectSlide).toHaveBeenCalledTimes(4)
  })

  it('calls onSelectSlide with correct index on Enter/Space key', () => {
    const state: SlideState = {
      rawMarkdown: '# Slide 1\n---\n# Slide 2\n---\n# Slide 3',
      slides: [
        { metadata: {}, rawContent: '# Slide 1' },
        { metadata: {}, rawContent: '# Slide 2' },
        { metadata: {}, rawContent: '# Slide 3' },
      ],
      deckMetadata: {},
      currentIndex: 0,
      currentDeck: null,
    }

    const onSelectSlide = vi.fn()
    const { container } = renderWithContext(
      <OverviewGrid onSelectSlide={onSelectSlide} />,
      state
    )

    const grid = container.querySelector('[class*="grid"]')
    const thumbnails = Array.from(grid?.children || [])

    // Press Enter on the third slide (index 2)
    fireEvent.keyDown(thumbnails[2] as Element, { key: 'Enter' })
    expect(onSelectSlide).toHaveBeenLastCalledWith(2)

    // Press Space on the second slide (index 1)
    fireEvent.keyDown(thumbnails[1] as Element, { key: ' ' })
    expect(onSelectSlide).toHaveBeenLastCalledWith(1)
  })

  it('renders empty grid when no slides', () => {
    const state: SlideState = {
      rawMarkdown: '',
      slides: [],
      deckMetadata: {},
      currentIndex: 0,
      currentDeck: null,
    }

    const onSelectSlide = vi.fn()
    const { container } = renderWithContext(
      <OverviewGrid onSelectSlide={onSelectSlide} />,
      state
    )

    // Should have the grid container but no thumbnails
    expect(container.querySelector('[class*="grid"]')).toBeInTheDocument()
    const thumbnails = container.querySelectorAll('[class*="thumbnail"]')
    expect(thumbnails.length).toBe(0)
  })
})
