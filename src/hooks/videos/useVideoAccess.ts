import { useCallback, useEffect, useState } from 'react';
import { asError } from '../../services/asError';
import { apiGetVideoAccessUrl } from '../../services/videos/videos';

interface UseVideoAccessParams {
  videoId?: string;
  lessonId?: string;
}

interface UseVideoAccessResult {
  streamUrl?: string;
  provider?: string;
  loading: boolean;
  error?: string;
  reload: () => void;
}

/**
 * Fetch a lesson video's streamUrl through the access-check endpoint.
 * Only called when both videoId and lessonId are present.
 */
export const useVideoAccess = ({
  videoId,
  lessonId,
}: UseVideoAccessParams): UseVideoAccessResult => {
  const [streamUrl, setStreamUrl] = useState<string | undefined>(undefined);
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!videoId || !lessonId) {
      setStreamUrl(undefined);
      setProvider(undefined);
      setError(undefined);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(undefined);
    setStreamUrl(undefined);

    apiGetVideoAccessUrl({ videoId, lessonId, signal: controller.signal })
      .then(res => {
        if (!active) return;
        setStreamUrl(res.streamUrl);
        setProvider(res.provider);
      })
      .catch(err => {
        if (!active) return;
        const e = asError(err);
        if (e.isCanceled) return;
        setError(e.serverMessage || e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [videoId, lessonId, reloadKey]);

  return { streamUrl, provider, loading, error, reload };
};
