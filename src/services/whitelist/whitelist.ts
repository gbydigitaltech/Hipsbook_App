import { CourseListResponse } from '../../types/data/courses/course.list.types';
import { GetCourseListParams } from '../../types/data/courses/course.query.types';
import { asError } from '../asError';
import { privateApi } from '../http';

const buildWhiteListBody = ({
  search,
  page,
  limit,
}: GetCourseListParams = {}) => ({
  ...(search ? { search } : {}),
  ...(page !== undefined ? { page } : {}),
  ...(limit !== undefined ? { limit } : {}),
});

// Get user's whitelist with optional search and pagination.
export const apiGetWhiteListList = async (
  params: GetCourseListParams = {},
): Promise<CourseListResponse> => {
  const { signal } = params;

  try {
    const { data } = await privateApi.post<CourseListResponse>(
      '/whitelist/list',
      buildWhiteListBody(params),
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};
