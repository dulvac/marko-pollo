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

  // Load deck when route.deckId changes
  useEffect(() => {
    if (route.view === 'picker') {
      dispatch({ type: 'UNLOAD_DECK' })
      return
    }

    const deckId = route.deckId
    const markdown = loadDeck(deckId)

    if (markdown) {
      dispatch({ type: 'LOAD_DECK', deckId, markdown })
    } else {
      // Deck not found, redirect to picker
      setRoute({ view: 'picker' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.view === 'picker' ? null : route.deckId, route.view])
}
