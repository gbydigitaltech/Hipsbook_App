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
    /** Handle app state changes */
    const handleChange = (state: AppStateStatus) => {
      // Run revalidation when app becomes active
      if (state === 'active') {
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
