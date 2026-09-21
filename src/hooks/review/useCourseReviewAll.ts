import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGetCourseReviewAll } from '../../services/review/review';
import {
  CourseReviewAllItem,
  GetCourseReviewAllResponse,
} from '../../types/data/review/review-api.types';

type UseCourseReviewAllOptions = {
  enabled?: boolean;
  page?: number;
  limit?: number;
};

type MyReviewWithReview = GetCourseReviewAllResponse['my_review'] & {
  review?: CourseReviewAllItem | null;
};

type GetCourseReviewAllResponseWithMyReview = Omit<
  GetCourseReviewAllResponse,
  'my_review'
> & {
  my_review: MyReviewWithReview;
};

type UseCourseReviewAllResult = GetCourseReviewAllResponseWithMyReview & {
  loading: boolean;
  error: unknown;
  hasMore: boolean;
  myReview: CourseReviewAllItem | null;
  otherReviews: CourseReviewAllItem[];
  displayData: CourseReviewAllItem[];
  refetch: (args?: { page?: number; limit?: number }) => Promise<void>;
  refetchMyReview: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
};

const createEmptyResponse = (
  page: number,
  limit: number,
): GetCourseReviewAllResponseWithMyReview => ({
  course_id: '',
  my_review: {
    status: null,
    review_id: null,
    can_create: true,
    can_edit: false,
    message: null,
    review: null,
  },
  rating_summary: {
    rating_count: 0,
    rating_sum: 0,
    rating_avg: 0,
    max: 5,
  },
  data: [],
  total: 0,
  page,
  limit,
  totalPages: 1,
});

export const useCourseReviewAll = (
  courseId?: string,
  options?: UseCourseReviewAllOptions,
): UseCourseReviewAllResult => {
  const enabled = options?.enabled ?? true;
  const initialPage = options?.page ?? 1;
  const initialLimit = options?.limit ?? 10;

  const [response, setResponse] =
    useState<GetCourseReviewAllResponseWithMyReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const safeData = useMemo(
    () => response ?? createEmptyResponse(initialPage, initialLimit),
    [response, initialPage, initialLimit],
  );

  const myReview = useMemo(() => {
    return safeData.my_review?.review ?? null;
  }, [safeData.my_review]);

  const otherReviews = useMemo(() => {
    return safeData.data ?? [];
  }, [safeData.data]);

  const displayData = useMemo(() => {
    const map = new Map<string | number, CourseReviewAllItem>();

    if (myReview) {
      map.set(myReview.id, myReview);
    }

    for (const item of otherReviews) {
      map.set(item.id, item);
    }

    return Array.from(map.values());
  }, [myReview, otherReviews]);

  const hasMore = useMemo(() => {
    return safeData.page < safeData.totalPages;
  }, [safeData.page, safeData.totalPages]);

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setLoading(false);
  }, []);

  const fetchPage = useCallback(
    async (
      targetPage: number,
      targetLimit: number,
      mode: 'replace' | 'append',
    ) => {
      if (!enabled || !courseId) return;

      if (mode === 'replace') {
        abortRef.current?.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        const res = await apiGetCourseReviewAll({
          courseId,
          page: targetPage,
          limit: targetLimit,
          signal: controller.signal,
        });

        if (!mountedRef.current) return;

        const payload = res as GetCourseReviewAllResponseWithMyReview;
        const nextItems = payload.data ?? [];

        if (mode === 'append') {
          setResponse(prev => {
            const base = prev ?? createEmptyResponse(targetPage, targetLimit);
            const map = new Map<string | number, CourseReviewAllItem>();

            for (const item of base.data) {
              map.set(item.id, item);
            }

            for (const item of nextItems) {
              map.set(item.id, item);
            }

            return {
              ...payload,
              data: Array.from(map.values()),
            };
          });
        } else {
          setResponse(payload);
        }
      } catch (e) {
        const name = (e as { name?: string })?.name;
        if (name === 'CanceledError' || name === 'AbortError') return;

        if (mountedRef.current) {
          setError(e);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [courseId, enabled],
  );

  const refetch = useCallback(
    async (args?: { page?: number; limit?: number }) => {
      const nextPage = args?.page ?? 1;
      const nextLimit = args?.limit ?? safeData.limit ?? initialLimit;
      await fetchPage(nextPage, nextLimit, 'replace');
    },
    [fetchPage, safeData.limit, initialLimit],
  );

  const refetchMyReview = useCallback(async () => {
    await fetchPage(1, safeData.limit ?? initialLimit, 'replace');
  }, [fetchPage, safeData.limit, initialLimit]);

  const loadMore = useCallback(async () => {
    if (!enabled || !courseId) return;
    if (loadingMoreRef.current) return;
    if (!hasMore) return;

    loadingMoreRef.current = true;
    try {
      await fetchPage(safeData.page + 1, safeData.limit, 'append');
    } finally {
      loadingMoreRef.current = false;
    }
  }, [enabled, courseId, hasMore, safeData.page, safeData.limit, fetchPage]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled && courseId) {
      fetchPage(initialPage, initialLimit, 'replace');
    }

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [enabled, courseId, fetchPage, initialPage, initialLimit]);

  return {
    ...safeData,
    loading,
    error,
    hasMore,
    myReview,
    otherReviews,
    displayData,
    refetch,
    refetchMyReview,
    loadMore,
    reset,
  };
};
