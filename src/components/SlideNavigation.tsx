import styles from '../styles/slides.module.css'

interface SlideNavigationProps {
  currentIndex: number
  totalSlides: number
}

export function SlideNavigation({
  currentIndex,
  totalSlides,
}: SlideNavigationProps) {
  const progress = totalSlides > 1 ? currentIndex / (totalSlides - 1) : 0

  return (
    <>
      <div className={styles.slideCounter}>
        {currentIndex + 1} / {totalSlides}
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </>
  )
}
