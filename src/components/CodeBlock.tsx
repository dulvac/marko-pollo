import { useEffect, useState, useRef, type HTMLAttributes } from 'react'
import { highlightCode } from '../core/highlighter'
import styles from '../styles/code.module.css'

interface CodeBlockProps extends HTMLAttributes<HTMLElement> {
  className?: string
  children?: React.ReactNode
}

export function CodeBlock({ className, children, ...props }: CodeBlockProps) {
  const langMatch = (className || '').match(/language-(\w+)/)
  const language = langMatch ? langMatch[1] : ''
  const code = String(children).replace(/\n$/, '')

  if (!langMatch) {
    return (
      <code className={styles.inlineCode} {...props}>
        {children}
      </code>
    )
  }

  return <HighlightedCodeBlock code={code} language={language} />
}

/**
 * Renders Shiki-highlighted code. Shiki generates trusted HTML from
 * programming language source code — it does not process user HTML input.
 * The output is safe pre/code elements with span-based syntax coloring.
 */
function HighlightedCodeBlock({
  code,
  language,
}: {
  code: string
  language: string
}) {
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    highlightCode(code, language).then((result) => {
      if (!cancelled) setHighlightedHtml(result)
    })
    return () => { cancelled = true }
  }, [code, language])

  // Shiki output is trusted: generated from code tokens, not user-supplied HTML.
  // Using ref-based DOM insertion as the standard pattern for Shiki in React.
  useEffect(() => {
    if (highlightedHtml && outputRef.current) {
      // Safe: Shiki generates sanitized syntax-highlighted HTML from code strings
      const range = document.createRange()
      const fragment = range.createContextualFragment(highlightedHtml)
      outputRef.current.replaceChildren(fragment)
    }
  }, [highlightedHtml])

  if (!highlightedHtml) {
    return (
      <div className={styles.codeBlockWrapper}>
        <span className={styles.languageLabel}>{language}</span>
        <pre className={styles.codeBlock}>
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className={styles.codeBlockWrapper}>
      <span className={styles.languageLabel}>{language}</span>
      <div ref={outputRef} />
    </div>
  )
}
