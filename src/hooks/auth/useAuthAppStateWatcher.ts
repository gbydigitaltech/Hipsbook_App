import { useEffect } from 'react';
import { logError } from '../../helpers/logger';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../../stores/auth';

/**
 * Revalidate auth session when app returns to foreground.
 * If token is expired and refresh fails, logout should happen in auth flow.
 */
export const useAuthAppStateWatcher = () => {
  const revalidate = useAuth(s => s.revalidate);

  useEffect(() => {
    let prev: AppStateStatus = AppState.currentState;

    /** Handle app state changes */
    const handleChange = (state: AppStateStatus) => {
      const wasBackground = prev === 'background';
      prev = state;
      // Revalidate only when returning from background. iOS also goes
      // inactive -> active for system dialogs and the photo picker; that
      // shouldn't trigger a revalidate.
      if (state === 'active' && wasBackground) {
        revalidate().catch(err =>
          logError('Auth', 'revalidate on foreground failed', err),
        );
      }
    };

    // Subscribe to app state change events
    const subscription = AppState.addEventListener('change', handleChange);

    // Cleanup listener on unmount
    return () => {
      subscription.remove();
    };
  }, [revalidate]);
};
