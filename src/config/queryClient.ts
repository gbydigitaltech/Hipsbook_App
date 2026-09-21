import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide React Query client. Controls all cache and refetch behavior.
 *
 * Within `staleTime` the cached data is treated as fresh, so returning to a
 * screen does not trigger a refetch. Requests with the same query key are
 * de-duplicated automatically.
 */
export const HOME_COURSE_STALE_TIME = 3 * 60 * 1000; // 3 minutes

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 3 min; re-entering a screen within this window
      // reuses the cache instead of refetching.
      staleTime: HOME_COURSE_STALE_TIME,
      // Keep unused cache around for 10 min before it is garbage collected.
      gcTime: 10 * 60 * 1000,
      // Retry once so a flaky network doesn't hang the UI for long.
      retry: 1,
      // React Native has no window-focus event; disable it explicitly.
      refetchOnWindowFocus: false,
      // When the network comes back, refetch queries that have gone stale.
      refetchOnReconnect: true,
    },
  },
});
