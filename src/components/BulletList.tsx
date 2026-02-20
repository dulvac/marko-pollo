import type { HTMLAttributes, OlHTMLAttributes } from 'react'
import styles from '../styles/slides.module.css'

export function UnorderedList({
  children,
  ...props
}: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={styles.bulletList} {...props}>
      {children}
    </ul>
  )
}

export function OrderedList({
  children,
  ...props
}: OlHTMLAttributes<HTMLOListElement>) {
  return (
    <ol className={styles.orderedList} {...props}>
      {children}
    </ol>
  )
}

export function ListItem({
  children,
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return (
    <li className={styles.bulletItem} {...props}>
      {children}
    </li>
  )
}
