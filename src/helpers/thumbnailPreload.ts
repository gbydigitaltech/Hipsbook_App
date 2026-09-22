import { useRef } from 'react';
import type { ViewToken } from 'react-native';
import FastImage from '@d11/react-native-fast-image';

/** Session-wide dedupe so a thumbnail is never preloaded twice. */
const preloadedUris = new Set<string>();

/** Preload a batch of remote thumbnails into FastImage's cache (deduped). */
export const preloadThumbnails = (uris: (string | undefined | null)[]) => {
  const sources = uris
    .filter((u): u is string => !!u && !preloadedUris.has(u))
    .map(u => {
      preloadedUris.add(u);
      return { uri: u };
    });
  if (sources.length) FastImage.preload(sources);
};

/**
 * Windowed thumbnail preloader for a FlatList.
 *
 * Preloads the next `ahead` items' thumbnails as the user scrolls, so the
 * image for an upcoming card is already cached by the time it appears.
 * Returns { onViewableItemsChanged, viewabilityConfig } to spread onto the
 * FlatList — both are stable references, which FlatList requires (it throws
 * if either changes after mount). Latest data/getUri are read via refs.
 */
export function useListThumbnailPreload<T>(
  data: readonly T[],
  getUri: (item: T) => string | undefined | null,
  ahead: number = 5,
) {
  const dataRef = useRef(data);
  dataRef.current = data;
  const getUriRef = useRef(getUri);
  getUriRef.current = getUri;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems.length) return;

      let maxIndex = -1;
      for (const v of viewableItems) {
        if (v.index != null && v.index > maxIndex) maxIndex = v.index;
      }
      if (maxIndex < 0) return;

      const d = dataRef.current;
      const gu = getUriRef.current;
      const next: (string | undefined | null)[] = [];
      for (let i = maxIndex + 1; i <= maxIndex + ahead && i < d.length; i++) {
        next.push(gu(d[i]));
      }
      preloadThumbnails(next);
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return { onViewableItemsChanged, viewabilityConfig };
}
