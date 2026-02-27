import { useEffect, useCallback } from 'react'
import type { Route } from '../core/route'
import type { SlideState } from '../core/store'
import { exportMarkdown } from '../core/exporter'

/**
 * Global Ctrl+S / Cmd+S save shortcut.
 * Separated from the main keyboard handler so it works inside CodeMirror.
 *
 * In editor view, this hook is a no-op — EditorView registers its own
 * Ctrl+S handler via useEditorSaveShortcut that delegates to
 * environment-aware persistence (handleSave) instead of exportMarkdown.
 */
export function useSaveShortcut(state: SlideState, route: Route): void {
  useEffect(() => {
    if (route.view === 'picker' || route.view === 'editor' || !state.rawMarkdown) return

    const handleSave = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        exportMarkdown(state.rawMarkdown, state.deckMetadata?.title, state.currentDeck ?? undefined)
      }
    }
    window.addEventListener('keydown', handleSave)
    return () => window.removeEventListener('keydown', handleSave)
  }, [state.rawMarkdown, state.deckMetadata?.title, state.currentDeck, route.view])
}

/**
 * Editor-specific Ctrl+S / Cmd+S shortcut that delegates to the
 * environment-aware save handler (dev server write, GitHub API PR,
 * or file download fallback) instead of always exporting.
 */
export function useEditorSaveShortcut(onSave: () => void): void {
  const stableOnSave = useCallback(onSave, [onSave])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        stableOnSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stableOnSave])
}
