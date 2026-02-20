import { useEffect, useRef, useState, useId } from 'react'
import mermaid from 'mermaid'
import styles from '../styles/slides.module.css'

let mermaidInitialized = false

function initMermaid() {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: {
      primaryColor: '#6C5CE7',
      primaryTextColor: '#E8E8F0',
      primaryBorderColor: '#6B7394',
      lineColor: '#6B7394',
      secondaryColor: '#00CEC9',
      tertiaryColor: '#1A1E2E',
      background: '#141829',
      mainBkg: '#1A1E2E',
      textColor: '#E8E8F0',
      fontSize: '16px',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
    sequence: { useMaxWidth: true },
  })
  mermaidInitialized = true
}

interface MermaidDiagramProps {
  chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  useEffect(() => {
    initMermaid()
    let cancelled = false

    async function renderDiagram() {
      try {
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
