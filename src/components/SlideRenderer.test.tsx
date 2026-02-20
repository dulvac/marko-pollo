import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SlideRenderer } from './SlideRenderer'

describe('SlideRenderer', () => {
  it('renders a heading as a TitleBlock', () => {
    render(<SlideRenderer markdown="# Hello World" />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders a subtitle (h2)', () => {
    render(<SlideRenderer markdown="## Subtitle" />)
    expect(screen.getByText('Subtitle')).toBeInTheDocument()
  })

  it('renders bullet points', () => {
    render(<SlideRenderer markdown={'- First\n- Second\n- Third'} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('renders paragraphs', () => {
    render(<SlideRenderer markdown="Some body text here." />)
    expect(screen.getByText('Some body text here.')).toBeInTheDocument()
  })

  it('renders images', () => {
    render(
      <SlideRenderer markdown="![alt text](https://example.com/img.png)" />
    )
    const img = screen.getByAltText('alt text')
    expect(img).toBeInTheDocument()
  })
})
