import { memo } from 'react'
import { useSlides } from '../core/store'
import { SlideFrame } from '../components/SlideFrame'
import { SlideRenderer } from '../components/SlideRenderer'
import styles from '../styles/overview.module.css'

interface OverviewGridProps {
  onSelectSlide: (index: number) => void
}

const MemoizedSlideRenderer = memo(SlideRenderer)

export function OverviewGrid({ onSelectSlide }: OverviewGridProps) {
  const { slides, currentIndex } = useSlides()

  return (
    <div className={styles.grid}>
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`${styles.thumbnail} ${
            i === currentIndex ? styles.thumbnailActive : ''
          }`}
          onClick={() => onSelectSlide(i)}
        >
          <div className={styles.thumbnailInner}>
            <span className={styles.thumbnailNumber}>{i + 1}</span>
            <SlideFrame>
              <MemoizedSlideRenderer slide={slide} />
            </SlideFrame>
          </div>
        </div>
      ))}
    </div>
  )
}
