import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGetCourseReviewDetail } from '../../services/review/review';
import { GetCourseReviewDetailResponse } from '../../types/data/review/review-detail.types';

type Options = {
  enabled?: boolean;
};

type UseCourseReviewDetailResult = {
  data: GetCourseReviewDetailResponse | null;
  loading: boolean;
  error: unknown;
  refetch: () => Promise<GetCourseReviewDetailResponse | null>;
  reset: () => void;
};

export const useCourseReviewDetail = (
  reviewId?: string | null,
  options: Options = {},
): UseCourseReviewDetailResult => {
  const { enabled = true } = options;

  const [data, setData] = useState<GetCourseReviewDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  const fetchDetail =
    useCallback(async (): Promise<GetCourseReviewDetailResponse | null> => {
      const id = reviewId?.trim();
      if (!enabled || !id) return null;

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        const res = await apiGetCourseReviewDetail({
          reviewId: id,
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

        if (mountedRef.current) {
          setError(e);
        }

        return null;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }, [reviewId, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const id = reviewId?.trim();
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    fetchDetail();
  }, [reviewId, enabled, fetchDetail]);

  return {
    data,
    loading,
    error,
    refetch: fetchDetail,
    reset,
  };
};
