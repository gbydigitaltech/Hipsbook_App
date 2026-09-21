import { useCallback, useEffect, useRef, useState } from 'react';
import { log } from '../../helpers/logger';
import { apiGetLibraryTeacherList } from '../../services/library/library';
import { CourseTeacherDetailItem } from '../../types/data/courses/course.teacher.types';

type Props = {
  libraryId?: string;
  enabled?: boolean;
};

export const useLibraryTeacherList = ({ libraryId, enabled = true }: Props) => {
  const [teachers, setTeachers] = useState<CourseTeacherDetailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!enabled) return;
    if (!libraryId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsLoading(true);

      const res = await apiGetLibraryTeacherList({
        libraryId: String(libraryId),
        signal: controller.signal,
      });

      setTeachers(Array.isArray(res) ? res : []);
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
      log('Library', 'loadTeachers error', err?.message ?? err);
    } finally {
      setIsLoading(false);
    }
  }, [libraryId, enabled]);

  useEffect(() => {
    fetchTeachers();
    return () => abortRef.current?.abort();
  }, [fetchTeachers]);

  const refetch = useCallback(async () => {
    await fetchTeachers();
  }, [fetchTeachers]);

  return { teachers, isLoading, refetch };
};
