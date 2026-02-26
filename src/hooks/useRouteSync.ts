import { useEffect, useRef } from 'react'
import type { Route } from '../core/route'

/**
 * Syncs the route's slideIndex to match state.currentIndex.
 *
 * This is the fix for the route/state desync bug (H3). Instead of the keyboard
 * handler both dispatching a state action AND manually computing the new route
 * (using a potentially stale closure value of state.currentIndex), the keyboard
 * handler now only dispatches state actions. This effect then derives the route
 * from the authoritative state.currentIndex after React processes the state update.
 *
 * The route is the follower; state is the leader.
 */
export function useRouteSync(
  route: Route,
  currentIndex: number,
  setRoute: (route: Route) => void
): void {
  // Skip the first render to avoid an unnecessary route write on mount
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Only sync when we are in presentation view and the index has drifted
    if (route.view === 'presentation' && route.slideIndex !== currentIndex) {
      setRoute({ view: 'presentation', deckId: route.deckId, slideIndex: currentIndex })
    }
  }, [currentIndex, route, setRoute])
}
