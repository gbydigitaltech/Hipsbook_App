import { Course } from '../../types/data/courses/course.type';
import {
  Teacher,
  TeacherRecommendResponse,
} from '../../types/data/teachers/teacher.type';
import { asError } from '../asError';
import { privateApi, publicApi } from '../http';

type RequestParams = {
  signal?: AbortSignal;
};

type TeacherIdParams = RequestParams & {
  teacherId: string;
};

type PaginationParams = RequestParams & {
  page?: number;
  limit?: number;
};

type TeacherCourseListParams = TeacherIdParams & {
  page: number;
  limit: number;
};

type TeacherCourseListResponse = { data?: Course[] } | Course[];

const buildPaginationBody = ({ page, limit }: PaginationParams = {}) => ({
  ...(page !== undefined ? { page } : {}),
  ...(limit !== undefined ? { limit } : {}),
});

// Get recommended teachers with optional pagination.
export const apiGetRecommendedTeachers = async (
  params: PaginationParams = {},
): Promise<TeacherRecommendResponse> => {
  const { signal } = params;

  try {
    const { data } = await publicApi.post<TeacherRecommendResponse>(
      '/recommend/teacher/list',
      buildPaginationBody(params),
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Get teacher detail by teacher ID.
export const apiGetTeacherDetail = async ({
  teacherId,
  signal,
}: TeacherIdParams): Promise<Teacher> => {
  try {
    const { data } = await publicApi.post<Teacher>(
      '/teacher/detail',
      { id: teacherId },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Get course list for a specific teacher.
export const apiGetTeacherCourseList = async ({
  teacherId,
  page,
  limit,
  signal,
}: TeacherCourseListParams): Promise<TeacherCourseListResponse> => {
  try {
    const { data } = await privateApi.post<TeacherCourseListResponse>(
      '/teacher/detail/course/list',
      { id: teacherId, page, limit },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};
