import { useCallback, useEffect, useRef, useState } from 'react';
import { logError } from '../../helpers/logger';
import { apiCreateCourseReview } from '../../services/review/review';
import { CreateCourseReviewResponse } from '../../types/data/review/review-api.types';

type UseCreateCourseReviewResult = {
  loading: boolean;
  error: unknown;
  data: CreateCourseReviewResponse | null;
  submit: (args: {
    courseId: string;
    rating?: number;
    content?: string;
  }) => Promise<CreateCourseReviewResponse | null>;
  reset: () => void;
};

export const useCreateCourseReview = (): UseCreateCourseReviewResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<CreateCourseReviewResponse | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  const submit = useCallback(
    async ({
      courseId,
      rating,
      content,
    }: {
      courseId: string;
      rating?: number;
      content?: string;
    }): Promise<CreateCourseReviewResponse | null> => {
      // Cancel any previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        const res = await apiCreateCourseReview({
          courseId,
          rating,
          content,
          signal: controller.signal,
        });

        if (mountedRef.current) setData(res);
        return res;
      } catch (e) {
        const name = (e as any)?.name;
        if (name === 'CanceledError' || name === 'AbortError') return null;
        logError('Review', 'Create Review API Error:', e);
        if (mountedRef.current) setError(e);
        return null;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  return { loading, error, data, submit, reset };
};
