import { VideoAccessRequest, VideoAccessResponse } from '../../types/data/videos/video-access.types';
import { privateApi, request } from '../http';

type GetVideoAccessUrlParams = VideoAccessRequest & {
  signal?: AbortSignal;
};

/**
 * Request a lesson's video playback URL (authorized with a Bearer token on the backend).
 * POST /hipsstream/videos/access/url
 */
export const apiGetVideoAccessUrl = async ({
  videoId,
  lessonId,
  signal,
}: GetVideoAccessUrlParams): Promise<VideoAccessResponse> => {
  return request(
    privateApi.post<VideoAccessResponse>(
      '/hipsstream/videos/access/url',
      { videoId, lessonId },
      { signal },
    ),
  );
};
