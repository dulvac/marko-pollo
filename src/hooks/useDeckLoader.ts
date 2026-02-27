import { useEffect, type Dispatch } from 'react'
import type { Route } from '../core/route'
import type { SlideAction } from '../core/store'
import { loadDeck, migrateOldStorage } from '../core/loader'

/**
 * Loads/unloads the deck whenever the route changes.
 * Also runs the one-time migration of old localStorage format on mount.
 */
export function useDeckLoader(
  route: Route,
  setRoute: (route: Route) => void,
  dispatch: Dispatch<SlideAction>
): void {
  // Migrate old localStorage format on mount
  useEffect(() => {
    migrateOldStorage()
  }, [])

  // Load deck when deckId changes (or when navigating to/from picker).
  // We intentionally exclude route.view so that switching between
  // presentation / editor / overview for the *same* deck does NOT
  // re-dispatch LOAD_DECK (which resets currentIndex to 0).
  const deckId = route.view === 'picker' ? null : route.deckId

  useEffect(() => {
    if (deckId === null) {
      dispatch({ type: 'UNLOAD_DECK' })
      return
    }

    const markdown = loadDeck(deckId)

    if (markdown) {
      dispatch({ type: 'LOAD_DECK', deckId, markdown })
    } else {
      // Deck not found, redirect to picker
      setRoute({ view: 'picker' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])
}
