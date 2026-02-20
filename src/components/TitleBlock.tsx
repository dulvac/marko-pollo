import type { HTMLAttributes } from 'react'
import styles from '../styles/slides.module.css'

export function TitleBlock({
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={styles.title} {...props}>
      {children}
    </h1>
  )
}

export function SubtitleBlock({
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={styles.subtitle} {...props}>
      {children}
    </h2>
  )
}
