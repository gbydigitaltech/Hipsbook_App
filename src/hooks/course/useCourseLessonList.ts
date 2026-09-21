import { useEffect, useState } from 'react';
import { apiGetCourseLessonList } from '../../services/course/course';
import { CourseLessonListResponse } from '../../types/data/courses/course.response.types';

/**
 * Get lesson list by course id.
 */
export const useCourseLessonList = (id: string) => {
  const [data, setData] = useState<CourseLessonListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    const { signal } = controller;

    const getLessonList = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiGetCourseLessonList({ id, signal });
        setData(res);
      } catch (err: any) {
        // Ignore request cancellation
        if (err?.name === 'AbortError') return;
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getLessonList();

    // Cancel request on unmount / id change
    return () => {
      controller.abort();
    };
  }, [id]);

  return {
    data,
    loading,
    error,
  };
};
