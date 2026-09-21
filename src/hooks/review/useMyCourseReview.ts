import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGetMyCourseReview } from '../../services/review/review';
import { GetMyCourseReviewResponse } from '../../types/data/review/review-api.types';

type UseMyCourseReviewResult = {
  data: GetMyCourseReviewResponse | null;
  loading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
  reset: () => void;
};

export const useMyCourseReview = (
  courseId?: string,
  options?: { enabled?: boolean },
): UseMyCourseReviewResult => {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<GetMyCourseReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const fetcher = useCallback(async () => {
    if (!enabled || !courseId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const res = await apiGetMyCourseReview({
        courseId,
        signal: controller.signal,
      });

      if (mountedRef.current) setData(res);
    } catch (e) {
      const name = (e as any)?.name;
      if (name === 'CanceledError' || name === 'AbortError') return;
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [courseId, enabled]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled && courseId) fetcher();

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [fetcher, enabled, courseId]);

  return { data, loading, error, refetch: fetcher, reset };
};
