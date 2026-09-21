import { CourseListResponse } from '../../types/data/courses/course.list.types';
import { GetCourseListParams } from '../../types/data/courses/course.query.types';
import { asError } from '../asError';
import { privateApi } from '../http';

const buildWhiteListParams = ({
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
    const { data } = await privateApi.get<CourseListResponse>(
      '/whitelist/list',
      {
        params: buildWhiteListParams(params),
        signal,
      },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};
