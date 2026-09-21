import { useEffect, useState } from 'react';
import { logError } from '../../helpers/logger';
import { TeacherAvatarItem } from '../../components/slides/teachers/AppTeacherAvatarSlider';
import { apiGetRecommendedTeachers } from '../../services/teachers/teachers';

type Params = {
  page?: number;
  limit?: number;
};

export const useRecommendedTeachers = (params: Params = {}) => {
  const { page, limit } = params;

  const [recommendedTeachers, setRecommendedTeachers] = useState<
    TeacherAvatarItem[]
  >([]);
  const [loadingRecommendedTeachers, setLoadingRecommendedTeachers] =
    useState(false);

  useEffect(() => {
    const ac = new AbortController();

    const load = async () => {
      try {
        setLoadingRecommendedTeachers(true);

        const res = await apiGetRecommendedTeachers({
          page,
          limit,
          signal: ac.signal,
        });

        const items: TeacherAvatarItem[] = res.data
          .filter((t: any) => !!t?.profile_image)
          .map((t: any, idx: number) => ({
            id: String(t.id ?? t.fk_teacher_id ?? `teacher-${idx}`),
            source: { uri: String(t.profile_image) },
          }));

        setRecommendedTeachers(items);
      } catch (e) {
        const name = (e as any)?.name;
        if (name === 'AbortError' || name === 'CanceledError') return;
        logError('Teacher', e);
      } finally {
        setLoadingRecommendedTeachers(false);
      }
    };

    load();
    return () => ac.abort();
  }, [page, limit]); // Important: refetch when page/limit changes.

  return { recommendedTeachers, loadingRecommendedTeachers };
};
