import { useCallback, useEffect, useState } from 'react';
import { log } from '../../helpers/logger';
import { apiGetLibraryList } from '../../services/library/library';
import { Course } from '../../types/data/courses/course.type';

type UseCourseListProps = {
  searchValue: string;
  pageSize?: number;
};

/**
 * Get paginated library course list with search and load-more support.
 */
export const useLibraryList = ({
  searchValue,
  pageSize = 10,
}: UseCourseListProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = page < totalPages;

  /**
   * Load a page from API.
   * - reset=true replaces current list
   * - otherwise appends for infinite scroll
   */
  const getPages = useCallback(
    async (pageToLoad: number, reset = false) => {
      try {
        if (pageToLoad === 1) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const res = await apiGetLibraryList({
          search: searchValue || undefined,
          page: pageToLoad,
          limit: pageSize,
        });

        const nextData = Array.isArray(res?.data) ? res.data : [];

        setTotalPages(res?.total_pages ?? 1);

        if (reset || pageToLoad === 1) {
          setCourses(nextData);
        } else {
          setCourses(prev => [...prev, ...nextData]);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
        log('Library', 'loadCourses error', err?.message ?? err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchValue, pageSize],
  );

  /** Reload first page */
  const refetch = useCallback(async () => {
    setPage(1);
    await getPages(1, true);
  }, [getPages]);

  // Reset and fetch first page when search changes
  useEffect(() => {
    setPage(1);
    getPages(1, true);
  }, [searchValue, getPages]);

  // Fetch next pages
  useEffect(() => {
    if (page === 1) return;
    getPages(page);
  }, [page, getPages]);

  /** Load next page if available */
  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    setPage(prev => prev + 1);
  }, [hasMore, isLoading, isLoadingMore]);

  return {
    courses,
    totalPages,
    isLoading,
    isLoadingMore,
    hasMore,
    handleLoadMore,
    refetch,
  };
};
