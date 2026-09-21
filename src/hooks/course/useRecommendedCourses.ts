import { useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGetRecommendCourseList } from '../../services/course/course';
import { Course } from '../../types/data/courses/course.type';
import { SliderCourseItem } from '../../types/ui/slides/course/course-slider.props';

type RecommendedCourseFilters = {
  category?: string;
  price?: string;
  price_min?: string;
  price_max?: string;
  review?: string;
  level?: string;
  sort_title?: 'date' | 'price';
  sort_by?: 'asc' | 'desc';
  search?: string;
  page?: number;
  limit?: number;
};

type UseRecommendedCoursesProps = {
  onCoursePress: (course: SliderCourseItem) => void;
  filters?: RecommendedCourseFilters;
  /**
   * @deprecated No longer needed — React Query handles cache/refetch.
   * Kept only for backward compatibility; it does not trigger a refetch.
   */
  refreshKey?: number;
};

const mapCourseToSliderItem =
  (onPress: (course: SliderCourseItem) => void) =>
  (c: Course): SliderCourseItem => {
    const cover = c.cover_image_list?.IMAGE_4_3 ?? c.cover_image ?? null;
    const item: SliderCourseItem = {
      id: c.id,
      label: c.label,
      cover_image: cover,
      teacher: Array.isArray(c.teacher) ? c.teacher : [],
      is_free: c.is_free ?? false,
      price: typeof c.price === 'number' ? c.price : null,
      whitelist: !!c.whitelist,
      library_id: c.library_id ?? '',
      library: (c.library as boolean | null) ?? null,
      onPress: () => onPress(item),
    };

    return item;
  };

/**
 * Get recommended courses and map them into slider items.
 *
 * Each `filters` set becomes its own React Query, so callers sharing the same
 * filters share one request (de-dup), and re-entering a screen within
 * staleTime reuses the cache instead of refetching.
 */
export const useRecommendedCourses = ({
  onCoursePress,
  filters,
}: UseRecommendedCoursesProps) => {
  const onCoursePressRef = useRef(onCoursePress);

  useEffect(() => {
    onCoursePressRef.current = onCoursePress;
  }, [onCoursePress]);

  const select = useCallback(
    (data: { data: Course[] }): SliderCourseItem[] =>
      data.data.map(mapCourseToSliderItem(c => onCoursePressRef.current(c))),
    [],
  );

  const { data, isPending, isFetching } = useQuery({
    // One query per filters set → per-category cache and de-dup.
    queryKey: ['recommendCourses', filters ?? {}],
    queryFn: ({ signal }) =>
      apiGetRecommendCourseList({
        signal,
        category: filters?.category,
        price: filters?.price,
        price_min: filters?.price_min,
        price_max: filters?.price_max,
        review: filters?.review,
        level: filters?.level,
        sort_title: filters?.sort_title,
        sort_by: filters?.sort_by,
        search: filters?.search,
        page: filters?.page,
        limit: filters?.limit ?? 10,
      }),
    select,
  });

  return {
    recommendedCourses: data ?? [],
    // Show the skeleton only on the first load (no cached data yet).
    // Background refetches keep the existing list visible instead.
    loadingRecommendedCourses: isPending,
    isRefetching: isFetching,
  };
};
