import { VIDEO_THUMBNAIL_BASE_URL } from '@env';

/** Where lesson video thumbnails live (same source as the website) */
const DEFAULT_THUMBNAIL_BASE_URL = 'https://hips-store.com/thumbnail';

/**
 * Base URL from .env, but never the retired JW Player CDN: an old .env or a
 * stale Metro cache would otherwise keep pointing there and show no images.
 */
export const THUMBNAIL_BASE_URL = (() => {
  const base = (VIDEO_THUMBNAIL_BASE_URL || '').trim().replace(/\/+$/, '');
  return !base || base.includes('jwplayer.com')
    ? DEFAULT_THUMBNAIL_BASE_URL
    : base;
})();

/**
 * Lesson video thumbnail: https://hips-store.com/thumbnail/<mediaId>.jpg
 * `size` is kept for existing callers; the server has one size only.
 */
export const getVideoThumbnailUrl = (
  mediaId?: string | null,
  _size: number = 480,
) => {
  if (!mediaId) return undefined;
  return `${THUMBNAIL_BASE_URL}/${mediaId}.jpg`;
};
