import { useEffect, useState } from 'react';
import { apiGetCourseDetail } from '../../services/course/course';
import { CourseDetailResponse } from '../../types/data/courses/course.response.types';

/**
 * Get course detail by courseId.
 */
export const useCourseDetail = (courseId?: string) => {
  const [data, setData] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const controller = new AbortController();

    const getDetail = async () => {
      try {
        setLoading(true);
        setError(null); // reset error before new request

        const res = await apiGetCourseDetail({
          id: courseId,
          signal: controller.signal,
        });

        setData(res);
      } catch (err: any) {
        // Ignore abort errors, set message for other errors
        if (err?.name !== 'AbortError') {
          setError(err?.message ?? 'Failed to load course detail');
        }
      } finally {
        setLoading(false);
      }
    };

    getDetail();

    // Cancel request on unmount / id change
    return () => controller.abort();
  }, [courseId]);

  return { data, loading, error };
};
