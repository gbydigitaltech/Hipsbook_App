import { useEffect, useState } from 'react';
import { logError } from '../../helpers/logger';
import { apiGetTeacherDetail } from '../../services/teachers/teachers';
import { Teacher } from '../../types/data/teachers/teacher.type';

type UseTeacherDetailOptions = {
  teacherId?: string;
};

/**
 * Get teacher detail by teacher id.
 */
export const useTeacherDetail = ({ teacherId }: UseTeacherDetailOptions) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loadingTeacher, setLoadingTeacher] = useState(false);

  useEffect(() => {
    if (!teacherId) return;

    const controller = new AbortController();

    const loadTeacher = async () => {
      try {
        setLoadingTeacher(true);

        const data = await apiGetTeacherDetail({
          teacherId,
          signal: controller.signal,
        });

        setTeacher(data);
      } catch (e) {
        // Ignore request cancellation
        const name = (e as any)?.name;
        if (name === 'AbortError' || name === 'CanceledError') return;

        logError('Teacher', e);
      } finally {
        setLoadingTeacher(false);
      }
    };

    loadTeacher();

    // Cancel request on unmount / id change
    return () => controller.abort();
  }, [teacherId]);

  return {
    teacher,
    loadingTeacher,
  };
};
