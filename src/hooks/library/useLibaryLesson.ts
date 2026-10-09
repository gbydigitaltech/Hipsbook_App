import { useCallback, useEffect, useState } from 'react';

import { apiGetLibraryLesson } from '../../services/library/library';
import { CourseLessonItem } from '../../types/data/courses/course.lesson.types';
import { CourseLessonListResponse } from '../../types/data/courses/course.response.types';

export const useLibraryLesson = (libraryId?: string) => {
  // Data + UI state
  const [data, setData] = useState<CourseLessonListResponse | null>(null);
  const [currentLesson, setCurrentLesson] =
    useState<Partial<CourseLessonItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF state
  const [showPdf, setShowPdf] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  // Open/close PDF modal with url
  const handleChangePath = useCallback(
    ({ url, modal }: { url: string; modal: boolean }) => {
      setCurrentPath(url);
      setShowPdf(modal);
    },
    [],
  );

  // Change lesson (avoid same lesson/media re-render)
  const onChangeVideo = useCallback((item: Partial<CourseLessonItem>) => {
    setCurrentLesson(prev => {
      const sameMedia =
        prev?.media_id != null &&
        item?.media_id != null &&
        String(prev.media_id) === String(item.media_id);

      const sameId =
        prev?.id != null &&
        item?.id != null &&
        String(prev.id) === String(item.id);

      return sameMedia || sameId ? prev : item;
    });
  }, []);

  const fetchLessons = useCallback(
    async (signal?: AbortSignal) => {
      if (!libraryId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiGetLibraryLesson({ libraryId, signal });
        setData(res);
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
        setError(err?.message ?? 'Failed to load library lessons');
      } finally {
        setLoading(false);
      }
    },
    [libraryId],
  );

  // Fetch lessons when libraryId changes (with abort)
  useEffect(() => {
    const controller = new AbortController();
    fetchLessons(controller.signal);
    return () => controller.abort();
  }, [fetchLessons]);

  /** Reload lessons (e.g. after a free lesson was added to the library) */
  const refetch = useCallback(() => fetchLessons(), [fetchLessons]);

  // Set first lesson once (don't override)
  useEffect(() => {
    if (currentLesson) return;
    setCurrentLesson(data?.data?.[0]?.lesson?.[0] ?? null);
  }, [data, currentLesson]);

  return {
    data,
    loading,
    error,
    refetch,
    currentLesson,
    onChangeVideo,
    handleChangePath,
    showPdf,
    currentPath,
    setShowPdf,
  };
};
