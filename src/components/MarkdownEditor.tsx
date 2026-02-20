import { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import styles from '../styles/editor.module.css'

const editorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#0B0D17',
      color: '#E8E8F0',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#6C5CE7',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '15px',
      lineHeight: '1.6',
      padding: '24px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(108, 92, 231, 0.05)',
    },
    '.cm-gutters': {
      backgroundColor: '#0B0D17',
      color: '#6B7394',
      border: 'none',
      paddingLeft: '8px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(108, 92, 231, 0.1)',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(108, 92, 231, 0.3)',
    },
    '.cm-cursor': {
      borderLeftColor: '#6C5CE7',
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
      <CodeMirror
        value={value}
        height="100%"
        extensions={[markdown(), editorTheme]}
        onChange={handleChange}
        theme="none"
      />
    </div>
  )
}
