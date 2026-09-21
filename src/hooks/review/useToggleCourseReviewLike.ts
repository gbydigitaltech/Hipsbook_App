import { useCallback, useEffect, useRef, useState } from 'react';
import { apiToggleCourseReviewLike } from '../../services/review/review';
import { ToggleCourseReviewLikeResponse } from '../../types/data/review/review-api.types';

type UseToggleCourseReviewLikeResult = {
  loading: boolean;
  error: unknown;
  data: ToggleCourseReviewLikeResponse | null;
  toggle: (reviewId: string) => Promise<ToggleCourseReviewLikeResponse | null>;
  reset: () => void;
};

export const useToggleCourseReviewLike =
  (): UseToggleCourseReviewLikeResult => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [data, setData] = useState<ToggleCourseReviewLikeResponse | null>(
      null,
    );

    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    const reset = useCallback(() => {
      setLoading(false);
      setError(null);
      setData(null);
    }, []);

    const toggle = useCallback(async (reviewId: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        const res = await apiToggleCourseReviewLike({
          reviewId,
          signal: controller.signal,
        });

        if (mountedRef.current) setData(res);
        return res;
      } catch (e) {
        const name = (e as any)?.name;
        if (name === 'CanceledError' || name === 'AbortError') return null;
        if (mountedRef.current) setError(e);
        return null;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }, []);

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        abortRef.current?.abort();
      };
    }, []);

    return { loading, error, data, toggle, reset };
  };
