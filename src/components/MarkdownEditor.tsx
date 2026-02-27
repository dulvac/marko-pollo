import { useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView, keymap } from '@codemirror/view'
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { findSlideOffset, getSlideIndexAtPosition } from '../core/parser'
import { BRAND, primaryAlpha } from '../core/brand-colors'
import styles from '../styles/editor.module.css'

const CodeMirror = lazy(() => import('@uiw/react-codemirror'))

const editorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: BRAND.bg,
      color: BRAND.text,
      height: '100%',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
    '.cm-content': {
      caretColor: BRAND.primary,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '15px',
      lineHeight: '1.6',
      padding: '24px',
    },
    '.cm-activeLine': {
      backgroundColor: primaryAlpha(0.05),
    },
    '.cm-gutters': {
      backgroundColor: BRAND.bg,
      color: BRAND.muted,
      border: 'none',
      paddingLeft: '8px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: primaryAlpha(0.1),
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: primaryAlpha(0.3),
    },
    '.cm-cursor': {
      borderLeftColor: BRAND.primary,
      borderLeftWidth: '2px',
    },
  },
  { dark: true }
)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  initialSlideIndex?: number
  onCursorSlideChange?: (slideIndex: number) => void
  onEscape?: () => void
}

export function MarkdownEditor({
  value,
  onChange,
  initialSlideIndex,
  onCursorSlideChange,
  onEscape,
}: MarkdownEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null)
  const hasSetInitialCursor = useRef(false)
  const lastReportedSlide = useRef(-1)

  // Store callbacks in refs so extensions stay referentially stable
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  const onCursorSlideChangeRef = useRef(onCursorSlideChange)
  onCursorSlideChangeRef.current = onCursorSlideChange

  const handleChange = useCallback(
    (val: string) => {
      onChange(val)
    },
    [onChange]
  )

  // Stable extensions that use refs for callbacks — created once
  const extensions = useMemo(
    () => [
      markdown(),
      editorTheme,
      EditorView.lineWrapping,
      keymap.of([
        {
          key: 'Escape',
          run: () => {
            onEscapeRef.current?.()
            return true
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.selectionSet || update.docChanged) {
          const pos = update.state.selection.main.head
          const text = update.state.doc.toString()
          const slideIdx = getSlideIndexAtPosition(text, pos)
          if (slideIdx !== lastReportedSlide.current) {
            lastReportedSlide.current = slideIdx
            onCursorSlideChangeRef.current?.(slideIdx)
          }
        }
      }),
    ],
    [] // Stable: never recreated — callbacks accessed via refs
  )

  // Set initial cursor position when the editor is created and initialSlideIndex is provided
  useEffect(() => {
    if (
      hasSetInitialCursor.current ||
      initialSlideIndex === undefined ||
      initialSlideIndex <= 0
    ) {
      return
    }

    const view = editorRef.current?.view
    if (!view) return

    const offset = findSlideOffset(value, initialSlideIndex)
    const docLength = view.state.doc.length
    const clampedOffset = Math.min(offset, docLength)

    view.dispatch({
      selection: { anchor: clampedOffset },
      scrollIntoView: true,
    })
    view.focus()
    hasSetInitialCursor.current = true

    // Report the initial slide to sync the preview
    lastReportedSlide.current = initialSlideIndex
    onCursorSlideChangeRef.current?.(initialSlideIndex)
  }, [initialSlideIndex, value])

  return (
    <div className={styles.editor}>
      <Suspense
        fallback={
          <div
            style={{
              background: 'var(--mp-bg)',
              width: '100%',
              height: '100%',
            }}
          />
        }
      >
        <CodeMirror
          ref={editorRef}
          value={value}
          height="100%"
          extensions={extensions}
          onChange={handleChange}
          theme="none"
        />
      </Suspense>
    </div>
  )
}
