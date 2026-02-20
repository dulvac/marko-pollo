import { useSlides } from '../core/store'
import { SlideFrame } from '../components/SlideFrame'
import { SlideRenderer } from '../components/SlideRenderer'
import { SlideNavigation } from '../components/SlideNavigation'
import styles from '../styles/slides.module.css'

export function PresentationView() {
  const { slides, currentIndex } = useSlides()

  if (slides.length === 0) {
    return (
      <div className={styles.presentationView}>
        <SlideFrame>
          <p>No slides loaded. Press E to open the editor.</p>
        </SlideFrame>
      </div>
    )
  }

  const currentSlide = slides[currentIndex]

  return (
    <div className={styles.presentationView}>
      <SlideFrame
        className={styles.slideTransition}
        style={{
          backgroundColor: currentSlide.metadata.bg || undefined,
        }}
      >
        <SlideRenderer slide={currentSlide} />
      </SlideFrame>
      <SlideNavigation
        currentIndex={currentIndex}
        totalSlides={slides.length}
      />
    </div>
  )
}
