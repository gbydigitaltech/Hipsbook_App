import { useState } from 'react';
import { logError } from '../../helpers/logger';
import {
  apiDeleteWhitelist,
  apiPatchWhitelist,
} from '../../services/course/course';
import { useWhitelistStore } from '../../stores/whitelist';
import { CourseDetailResponse } from '../../types/data/courses/course.response.types';
import { Course } from '../../types/data/courses/course.type';
import type { CourseCardProps } from '../../types/ui/cards/course-card.props';
import type { SliderCourseItem } from '../../types/ui/slides/course/course-slider.props';

type WhitelistCourse =
  | Course
  | CourseDetailResponse
  | CourseCardProps
  | SliderCourseItem;

/**
 * Manage whitelist updates with optimistic UI.
 */
export const useWhitelist = () => {
  const [loading, setLoading] = useState(false);

  const whitelistMap = useWhitelistStore(s => s.map);
  const setWhitelist = useWhitelistStore(s => s.setWhitelist);

  /**
   * Update whitelist status for a course.
   * - Apply optimistic update first
   * - Revert on API failure
   */
  const updateWhitelist = async (course: WhitelistCourse, next: boolean) => {
    try {
      setLoading(true);

      // Optimistic update in local store
      setWhitelist(course as Course, next);

      // Sync target state to server
      if (next) {
        await apiPatchWhitelist({ course_id: course.id });
      } else {
        await apiDeleteWhitelist({ course_id: course.id });
      }

      return true;
    } catch (error) {
      logError('Course', error);

      // Roll back local state when request fails
      setWhitelist(course as Course, !next);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateWhitelist,
    whitelistMap,
    loading,
  };
};
