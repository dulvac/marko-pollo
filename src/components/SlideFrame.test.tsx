import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SlideFrame } from './SlideFrame'

describe('SlideFrame', () => {
  it('renders children inside a 16:9 viewport', () => {
    render(
      <SlideFrame>
        <p>Slide content</p>
      </SlideFrame>
    )
    expect(screen.getByText('Slide content')).toBeInTheDocument()
  })
})
