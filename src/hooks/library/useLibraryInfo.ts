import { useEffect, useState } from 'react';
import { apiGetLibraryDetail } from '../../services/library/library';
import { CourseDetailResponse } from '../../types/data/courses/course.response.types';

export const useLibraryInfo = (libraryId?: string) => {
  const [data, setData] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!libraryId) return;

    const controller = new AbortController();

    const getDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiGetLibraryDetail({
          libraryId,
          signal: controller.signal,
        });

        setData(res);
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
        setError(err?.message ?? 'Failed to load library detail');
      } finally {
        setLoading(false);
      }
    };

    getDetail();
    return () => controller.abort();
  }, [libraryId]);

  const refetch = async () => {
    if (!libraryId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiGetLibraryDetail({ libraryId });
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load library detail');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};
