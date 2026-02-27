import { useEffect, useRef, useState, useId } from 'react'
import { BRAND, MERMAID_DERIVED } from '../core/brand-colors'
import styles from '../styles/slides.module.css'

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null

function initMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(m => {
      m.default.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: {
          primaryColor: MERMAID_DERIVED.primaryColor,
          primaryTextColor: BRAND.text,
          primaryBorderColor: BRAND.primary,
          lineColor: BRAND.muted,
          secondaryColor: MERMAID_DERIVED.secondaryColor,
          secondaryBorderColor: BRAND.secondary,
          tertiaryColor: MERMAID_DERIVED.tertiaryColor,
          background: BRAND.surface,
          mainBkg: MERMAID_DERIVED.mainBkg,
          nodeBorder: BRAND.primary,
          textColor: BRAND.text,
          fontSize: '16px',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        flowchart: { useMaxWidth: true, htmlLabels: false, curve: 'basis' },
        sequence: { useMaxWidth: true },
      })
      return m.default
    })
  }
  return mermaidPromise
}

interface MermaidDiagramProps {
  chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  useEffect(() => {
    let cancelled = false

    async function renderDiagram() {
      try {
        const mermaid = await initMermaid()
        const safeId = `mermaid-${id.replace(/:/g, '-')}`
        const { svg } = await mermaid.render(safeId, chart)
        if (!cancelled && containerRef.current) {
          const range = document.createRange()
          const fragment = range.createContextualFragment(svg)
          containerRef.current.replaceChildren(fragment)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Diagram render failed'
          )
        }
      }
    }

    renderDiagram()
    return () => {
      cancelled = true
    }
  }, [chart, id])

  if (error) {
    return <div className={styles.mermaidError}>Diagram error: {error}</div>
  }

  return <div ref={containerRef} className={styles.mermaidContainer} />
}
