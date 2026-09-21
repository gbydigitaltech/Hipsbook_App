import { create } from 'zustand';
import { log } from '../helpers/logger';
import { apiGetWhiteListList } from '../services/whitelist/whitelist';
import { Course } from '../types/data/courses/course.type';

type WhitelistState = {
  // Full whitelist course objects for rendering/UI use.
  list: Course[];

  // Fast lookup map: courseId -> isWhitelisted.
  map: Record<string, boolean>;

  // Prevent duplicate init requests.
  isLoading: boolean;

  // True after first successful initialization.
  initialized: boolean;

  // Toggle a single course in local whitelist state.
  setWhitelist: (course: Course, value: boolean) => void;

  // Load whitelist from API once and build list/map.
  initWhitelist: () => Promise<void>;
};

export const useWhitelistStore = create<WhitelistState>((set, get) => ({
  list: [],
  map: {},
  isLoading: false,
  initialized: false,

  // Update both map and list to keep state in sync.
  setWhitelist: (course, value) =>
    set(state => {
      const map = {
        ...state.map,
        [course.id]: value,
      };

      let list: Course[];
      if (value) {
        // Add to list only if course is not already present.
        const exists = state.list.some(c => c.id === course.id);
        list = exists ? state.list : [...state.list, course];
      } else {
        // Remove course from list when un-whitelisting.
        list = state.list.filter(c => c.id !== course.id);
      }

      return { map, list };
    }),

  // Initialize whitelist once; skip if already initialized or loading.
  initWhitelist: async () => {
    const { initialized, isLoading } = get();
    if (initialized || isLoading) return;

    set({ isLoading: true });

    try {
      // Fetch a large page to hydrate whitelist state in one request.
      const res = await apiGetWhiteListList({
        page: 1,
        limit: 9999,
      });

      const data = res.data as Course[];

      // Build O(1) lookup map from fetched list.
      const nextMap: Record<string, boolean> = {};
      data.forEach(course => {
        nextMap[course.id] = true;
      });

      set({
        list: data,
        map: nextMap,
        initialized: true,
      });
    } catch (e: any) {
      // Keep app usable even if init fails; allow retry later.
      log('Store', 'initWhitelist error', e?.message ?? e);
    } finally {
      // Always release loading state.
      set({ isLoading: false });
    }
  },
}));
