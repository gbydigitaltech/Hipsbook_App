import { useCallback, useEffect, useRef, useState } from 'react';
import { logError } from '../../helpers/logger';
import { apiGetTeacherCourseList } from '../../services/teachers/teachers';
import { Course } from '../../types/data/courses/course.type';
import { CourseTeacherRef } from '../../types/ui/cards/course-card.props';
import { SliderCourseItem } from '../../types/ui/slides/course/course-slider.props';

type UseTeacherCoursesOptions = {
  teacherId?: string;
  onCoursePress: (courseId: string) => void;
  limit?: number;
};

const mapCourseToSliderItem = (
  c: Course,
  onCoursePress: (courseId: string) => void,
): SliderCourseItem => {
  const cover =
    c.cover_image_list?.IMAGE_1_1 ??
    c.cover_image_list?.IMAGE_4_3 ??
    c.cover_image_list?.IMAGE_16_9 ??
    c.cover_image ??
    null;

  return {
    id: c.id,
    label: c.label,
    cover_image: cover,
    teacher: Array.isArray(c.teacher) ? (c.teacher as CourseTeacherRef[]) : [],
    is_free: c.is_free ?? false,
    price: typeof c.price === 'number' ? c.price : null,
    whitelist: !!c.whitelist,
    library_id: c.library_id ?? '',
    library: (c.library as boolean | null) ?? null,
    onPress: () => onCoursePress(c.id),
  };
};

const dedupeCoursesById = (courses: SliderCourseItem[]) => {
  const map = new Map<string, SliderCourseItem>();

  for (const course of courses) {
    map.set(String(course.id), course);
  }

  return Array.from(map.values());
};

export const useTeacherCourses = ({
  teacherId,
  onCoursePress,
  limit = 10,
}: UseTeacherCoursesOptions) => {
  const [teacherCourses, setTeacherCourses] = useState<SliderCourseItem[]>([]);
  const [loadingTeacherCourses, setLoadingTeacherCourses] = useState(false);
  const [loadingMoreTeacherCourses, setLoadingMoreTeacherCourses] =
    useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const onCoursePressRef = useRef(onCoursePress);
  const requestIdRef = useRef(0);

  useEffect(() => {
    onCoursePressRef.current = onCoursePress;
  }, [onCoursePress]);

  const resetState = useCallback(() => {
    setTeacherCourses([]);
    setPage(1);
    setHasMore(true);
  }, []);

  const fetchCourses = useCallback(
    async (targetPage: number, isLoadMore = false) => {
      if (!teacherId) return;
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      const requestId = ++requestIdRef.current;

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        if (isLoadMore) {
          setLoadingMoreTeacherCourses(true);
        } else {
          setLoadingTeacherCourses(true);
        }

        const res = await apiGetTeacherCourseList({
          teacherId,
          page: targetPage,
          limit,
          signal: ac.signal,
        });

        if (requestId !== requestIdRef.current) return;

        const rawList: Course[] = Array.isArray(res)
          ? res
          : Array.isArray(res.data)
          ? res.data
          : [];

        const mapped = rawList.map(course =>
          mapCourseToSliderItem(course, onCoursePressRef.current),
        );

        setTeacherCourses(prev => {
          const merged = targetPage === 1 ? mapped : [...prev, ...mapped];
          return dedupeCoursesById(merged);
        });

        setPage(targetPage);
        setHasMore(rawList.length === limit);
      } catch (e) {
        const name = (e as any)?.name;
        if (name === 'AbortError' || name === 'CanceledError') return;

        logError('Teacher', 'useTeacherCourses fetchCourses error:', e);
      } finally {
        if (abortRef.current === ac) {
          abortRef.current = null;
        }

        isFetchingRef.current = false;

        if (isLoadMore) {
          setLoadingMoreTeacherCourses(false);
        } else {
          setLoadingTeacherCourses(false);
        }
      }
    },
    [teacherId, limit],
  );

  const refreshTeacherCourses = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    isFetchingRef.current = false;

    resetState();
    fetchCourses(1, false);
  }, [fetchCourses, resetState]);

  const loadMoreTeacherCourses = useCallback(() => {
    if (!hasMore) return;
    if (loadingTeacherCourses || loadingMoreTeacherCourses) return;
    if (isFetchingRef.current) return;

    fetchCourses(page + 1, true);
  }, [
    fetchCourses,
    hasMore,
    loadingTeacherCourses,
    loadingMoreTeacherCourses,
    page,
  ]);

  useEffect(() => {
    if (!teacherId) {
      abortRef.current?.abort();
      abortRef.current = null;
      isFetchingRef.current = false;
      requestIdRef.current += 1;
      resetState();
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;
    isFetchingRef.current = false;
    requestIdRef.current += 1;

    resetState();
    fetchCourses(1, false);

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      isFetchingRef.current = false;
      requestIdRef.current += 1;
    };
  }, [teacherId, fetchCourses, resetState]);

  return {
    teacherCourses,
    loadingTeacherCourses,
    loadingMoreTeacherCourses,
    hasMore,
    refreshTeacherCourses,
    loadMoreTeacherCourses,
  };
};
