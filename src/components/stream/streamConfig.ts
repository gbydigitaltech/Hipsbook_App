import {
  STREAM_API_BASE_URL,
  STREAM_API_KEY,
  STREAM_HLS_SERVER,
  STREAM_RTMP_SERVER,
} from '@env';

export const STREAM_CONFIG = {
  apiBaseUrl: STREAM_API_BASE_URL,
  apiKey: STREAM_API_KEY,
  rtmpServer: STREAM_RTMP_SERVER,
  hlsServer: STREAM_HLS_SERVER,
};

export const getHlsUrl = (streamKey: string) =>
  `${STREAM_CONFIG.hlsServer}/live/${streamKey}/index.m3u8`;

export function normalizeHlsPlaybackUrl(
  url: string | null | undefined,
): string {
  const u = (url ?? '').trim();
  if (!u) return '';
  if (/\.m3u8(\?.*)?$/i.test(u)) return u;
  return `${u.replace(/\/$/, '')}/index.m3u8`;
}

export const getRtmpUrl = (streamKey: string) =>
  `${STREAM_CONFIG.rtmpServer}/${streamKey}`;

export function resolveRtmpIngestUrl(session: {
  streamKey: string;
  ingestUrl?: string;
}): string {
  const key = session.streamKey?.trim() ?? '';
  const apiUrl = session.ingestUrl?.trim() ?? '';

  if (apiUrl.startsWith('rtmp') && key && apiUrl.includes(key)) {
    return apiUrl;
  }

  if (key) {
    return getRtmpUrl(key);
  }

  return apiUrl;
}
