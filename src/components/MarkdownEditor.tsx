import { useCallback, lazy, Suspense } from 'react'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import styles from '../styles/editor.module.css'

const CodeMirror = lazy(() => import('@uiw/react-codemirror'))

const editorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#322D2B',
      color: '#F0E8D8',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#E4C56C',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '15px',
      lineHeight: '1.6',
      padding: '24px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(228, 197, 108, 0.05)',
    },
    '.cm-gutters': {
      backgroundColor: '#322D2B',
      color: '#8A7D5A',
      border: 'none',
      paddingLeft: '8px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(228, 197, 108, 0.1)',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(228, 197, 108, 0.3)',
    },
    '.cm-cursor': {
      borderLeftColor: '#E4C56C',
      borderLeftWidth: '2px',
    },
  },
  { dark: true }
)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val)
    },
    [onChange]
  )

  return (
    <div className={styles.editor}>
      <Suspense fallback={<div style={{ background: 'var(--mp-bg)', width: '100%', height: '100%' }} />}>
        <CodeMirror
          value={value}
          height="100%"
          extensions={[markdown(), editorTheme]}
          onChange={handleChange}
          theme="none"
        />
      </Suspense>
    </div>
  )
}
