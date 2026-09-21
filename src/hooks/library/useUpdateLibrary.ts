import { useCallback, useState } from 'react';
import { logError } from '../../helpers/logger';
import { apiUpdateLibrary } from '../../services/library/library';

/**
 * Update library status for a course.
 */
export const useUpdateLibrary = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Call update-library API and return operation result.
   */
  const updateLibrary = useCallback(
    async (courseId: string): Promise<{ success: boolean; id?: string }> => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiUpdateLibrary({ courseId });
        return { success: true, id: res.id };
      } catch (err: any) {
        logError('Library', 'updateLibrary error:', err);
        setError(err?.message || 'เกิดข้อผิดพลาด');
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    updateLibrary,
    loading,
    error,
  };
};
