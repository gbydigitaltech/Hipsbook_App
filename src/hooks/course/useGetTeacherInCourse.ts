import { useEffect, useState } from 'react';
import { apiGetTeacherInCourse } from '../../services/course/course';
import { Teacher } from '../../types/data/teachers/teacher.type';

/**
 * Get teachers in a course by course id.
 */
export const useGetTeacherInCourse = (id: string) => {
  const [data, setData] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const getTeachers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiGetTeacherInCourse({
          id,
          signal: controller.signal,
        });

        setData(res);
      } catch (err: any) {
        // Ignore request cancellation
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    getTeachers();

    // Cancel request on unmount / id change
    return () => controller.abort();
  }, [id]);

  return { data, loading, error };
};
