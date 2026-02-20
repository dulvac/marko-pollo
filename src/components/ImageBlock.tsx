import type { ImgHTMLAttributes } from 'react'
import styles from '../styles/slides.module.css'

export function ImageBlock(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <img className={styles.image} {...props} />
}
