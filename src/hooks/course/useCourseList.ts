import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGetCourseList } from '../../services/course/course';
import { GetCourseListParams } from '../../types/data/courses/course.query.types';
import { CourseListResponse } from '../../types/data/courses/course.list.types';

export type LocalCourseFilterState = Omit<
  GetCourseListParams,
  'search' | 'page' | 'limit' | 'signal'
>;

type UseCourseListProps = {
  selected: string;
  filters: LocalCourseFilterState;
  searchValue: string;
  pageSize?: number;
  /**
   * @deprecated No longer needed — React Query handles cache/refetch.
   * Kept only for backward compatibility.
   */
  refreshKey?: number;
};

/**
 * Get paginated course list with filters/search and load-more support.
 *
 * Backed by useInfiniteQuery: each filter/search combination is its own query,
 * so returning with the same filters within staleTime reuses the cache, and
 * in-flight requests are cancelled automatically when the key changes.
 */
export const useCourseList = ({
  selected,
  filters,
  searchValue,
  pageSize = 10,
}: UseCourseListProps) => {
  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['courseList', { selected, filters, searchValue, pageSize }],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiGetCourseList({
        ...filters,
        tag: selected !== 'ทั้งหมด' ? selected : undefined,
        search: searchValue || undefined,
        page: pageParam,
        limit: pageSize,
        signal,
      }),
    getNextPageParam: (lastPage: CourseListResponse) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });

  // Flatten all loaded pages into a single list.
  const courses = useMemo(
    () => data?.pages.flatMap(p => p.data) ?? [],
    [data],
  );

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isPending || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isPending, isFetchingNextPage, fetchNextPage]);

  return {
    courses,
    isLoading: isPending,
    isLoadingMore: isFetchingNextPage,
    hasMore: hasNextPage,
    handleLoadMore,
  };
};
