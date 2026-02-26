import { useEffect } from 'react'
import type { Route } from '../core/route'
import type { SlideState } from '../core/store'
import { exportMarkdown } from '../core/exporter'

/**
 * Global Ctrl+S / Cmd+S save shortcut.
 * Separated from the main keyboard handler so it works inside CodeMirror.
 */
export function useSaveShortcut(state: SlideState, route: Route): void {
  useEffect(() => {
    if (route.view === 'picker' || !state.rawMarkdown) return

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
