import { useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logWarn } from '../../helpers/logger';
import { apiGetRecommendCourseListByCategory } from '../../services/course/course';
import { Course } from '../../types/data/courses/course.type';
import { SliderCourseItem } from '../../types/ui/slides/course/course-slider.props';

/** One category block from POST /recommend/course/list-by-category */
type CategoryBlockResponse = {
  category: { id: string; label: string; icon: string | null };
  total: number;
  data: Course[] | null;
};

type ListByCategoryResponse = {
  data: CategoryBlockResponse[] | null;
  limit: number;
  total_category: number;
};

/** A home section built from the response (title/order come from the API) */
export type HomeCourseSectionData = {
  id: string;
  label: string;
  icon: string | null;
  total: number;
  courses: SliderCourseItem[];
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
 * Home screen: recommended courses for all categories in ONE request.
 * Section titles, icons and order come from the response — nothing per
 * category is hardcoded in the app except the list of ids to request.
 */
export const useRecommendedCoursesByCategory = ({
  categories,
  limit = 6,
  onCoursePress,
}: {
  categories: string[];
  limit?: number;
  onCoursePress: (course: SliderCourseItem) => void;
}) => {
  const onCoursePressRef = useRef(onCoursePress);
  useEffect(() => {
    onCoursePressRef.current = onCoursePress;
  }, [onCoursePress]);

  const select = useCallback(
    (res: ListByCategoryResponse): HomeCourseSectionData[] => {
      const map = mapCourseToSliderItem(c => onCoursePressRef.current(c));
      const blocks = Array.isArray(res?.data) ? res.data : [];
      if (blocks.length === 0) {
        logWarn('Home', 'list-by-category returned no categories', res);
      }
      return blocks
        .filter(b => b?.category?.id)
        .map(b => ({
          id: b.category.id,
          label: b.category.label ?? '',
          icon: b.category.icon ?? null,
          total: b.total ?? 0,
          courses: (b.data ?? []).map(map),
        }));
    },
    [],
  );

  const { data, isPending, isFetching } = useQuery({
    // Starts with 'recommendCourses' so the home focus-refetch still covers it
    queryKey: ['recommendCourses', 'by-category', categories, limit],
    queryFn: ({ signal }) =>
      apiGetRecommendCourseListByCategory({
        category: categories,
        limit,
        signal,
      }) as Promise<ListByCategoryResponse>,
    select,
  });

  return {
    sections: data ?? [],
    loading: isPending,
    isRefetching: isFetching,
  };
};
