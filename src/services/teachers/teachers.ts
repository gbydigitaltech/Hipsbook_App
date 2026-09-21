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

const buildPaginationParams = ({ page, limit }: PaginationParams = {}) => ({
  ...(page !== undefined ? { page } : {}),
  ...(limit !== undefined ? { limit } : {}),
});

// Get recommended teachers with optional pagination.
export const apiGetRecommendedTeachers = async (
  params: PaginationParams = {},
): Promise<TeacherRecommendResponse> => {
  const { signal } = params;

  try {
    const { data } = await publicApi.get<TeacherRecommendResponse>(
      '/recommend/teacher/list',
      {
        params: buildPaginationParams(params),
        signal,
      },
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
    const { data } = await publicApi.get<Teacher>(
      `/teacher/detail/${teacherId}`,
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
    const { data } = await privateApi.get<TeacherCourseListResponse>(
      `/teacher/detail/${teacherId}/course/list`,
      {
        params: {
          page,
          limit,
        },
        signal,
      },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};
