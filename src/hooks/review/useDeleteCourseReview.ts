import { useCallback, useEffect, useRef, useState } from 'react';
import { logError } from '../../helpers/logger';
import { apiDeleteCourseReview } from '../../services/review/review';

type UseDeleteCourseReviewResult = {
  loading: boolean;
  error: unknown;
  data: { status?: string; message?: string } | null;
  remove: (
    courseId: string,
  ) => Promise<{ status?: string; message?: string } | null>;
  reset: () => void;
};

export const useDeleteCourseReview = (): UseDeleteCourseReviewResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<{
    status?: string;
    message?: string;
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  const remove = useCallback(
    async (
      courseId: string,
    ): Promise<{ status?: string; message?: string } | null> => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        const res = await apiDeleteCourseReview({
          courseId,
          signal: controller.signal,
        });

        if (mountedRef.current) {
          setData(res);
        }
        return res;
      } catch (e) {
        const name = (e as any)?.name;
        if (name === 'CanceledError' || name === 'AbortError') {
          return null;
        }

        logError('Review', 'Delete Review API Error:', e);
        if (mountedRef.current) {
          setError(e);
        }
        return null;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    loading,
    error,
    data,
    remove,
    reset,
  };
};
