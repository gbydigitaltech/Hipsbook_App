import { VIDEO_THUMBNAIL_BASE_URL } from '@env';

/** Build thumbnail URL from media id and image size */
export const getVideoThumbnailUrl = (
  mediaId?: string | null,
  size: number = 480,
) => {
  if (!mediaId) return undefined;
  return `${VIDEO_THUMBNAIL_BASE_URL}/${mediaId}-${size}.jpg`;
};
