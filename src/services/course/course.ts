import {
  CourseListResponse,
  RecommendCourseListResponse,
} from '../../types/data/courses/course.list.types';
import { GetCourseListParams } from '../../types/data/courses/course.query.types';
import {
  CourseDetailResponse,
  CourseLessonListResponse,
} from '../../types/data/courses/course.response.types';
import { Teacher } from '../../types/data/teachers/teacher.type';
import { asError } from '../asError';
import { privateApi } from '../http';

type GetRecommendCourseListParams = {
  category?: string;
  price?: string;
  price_min?: string;
  price_max?: string;
  review?: string;
  level?: string;
  sort_title?: 'date' | 'price';
  sort_by?: 'asc' | 'desc';
  search?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
};

type CourseIdParams = {
  id: string;
  signal?: AbortSignal;
};

type WhitelistParams = {
  course_id: string;
  signal?: AbortSignal;
};

type MessageResponse = {
  message: string;
};

const buildCourseListParams = ({
  category,
  price,
  review,
  level,
  sortTitle,
  sortBy,
  search,
  tag,
  page,
  limit,
}: GetCourseListParams = {}) => ({
  ...(category?.length ? { category: category.join(',') } : {}),
  ...(price ? { price } : {}),
  ...(review !== undefined ? { review: Math.round(review * 10) } : {}),
  ...(level?.length ? { level: level.join(',') } : {}),
  ...(sortTitle ? { sort_title: sortTitle } : {}),
  ...(sortBy ? { sort_by: sortBy } : {}),
  ...(tag ? { tag } : {}),
  ...(search ? { search } : {}),
  ...(page !== undefined ? { page } : {}),
  ...(limit !== undefined ? { limit } : {}),
});

const buildRecommendCourseListParams = ({
  category,
  price,
  price_min,
  price_max,
  review,
  level,
  sort_title,
  sort_by,
  search,
  page,
  limit,
}: GetRecommendCourseListParams = {}) => ({
  ...(category !== undefined ? { category } : {}),
  ...(price !== undefined ? { price } : {}),
  ...(price_min !== undefined ? { price_min } : {}),
  ...(price_max !== undefined ? { price_max } : {}),
  ...(review !== undefined ? { review } : {}),
  ...(level !== undefined ? { level } : {}),
  ...(sort_title !== undefined ? { sort_title } : {}),
  ...(sort_by !== undefined ? { sort_by } : {}),
  ...(search !== undefined ? { search } : {}),
  ...(page !== undefined ? { page } : {}),
  ...(limit !== undefined ? { limit } : {}),
});

// Get course list with optional filters, sorting, pagination, and search.
export const apiGetCourseList = async (
  params: GetCourseListParams = {},
): Promise<CourseListResponse> => {
  const { signal } = params;

  try {
    const { data } = await privateApi.get<CourseListResponse>(
      '/inventory/course/list',
      {
        params: buildCourseListParams(params),
        signal,
      },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Get recommended courses with optional pagination.
export const apiGetRecommendCourseList = async (
  params: GetRecommendCourseListParams = {},
): Promise<RecommendCourseListResponse> => {
  const { signal } = params;

  try {
    const { data } = await privateApi.get<RecommendCourseListResponse>(
      '/recommend/course/list',
      {
        params: buildRecommendCourseListParams(params),
        signal,
      },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Get course detail by course id.
export const apiGetCourseDetail = async ({
  id,
  signal,
}: CourseIdParams): Promise<CourseDetailResponse> => {
  try {
    const { data } = await privateApi.get<CourseDetailResponse>(
      `/course/detail/${id}`,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Get lessons in a course by course id.
export const apiGetCourseLessonList = async ({
  id,
  signal,
}: CourseIdParams): Promise<CourseLessonListResponse> => {
  try {
    const { data } = await privateApi.get<CourseLessonListResponse>(
      `/course/detail/${id}/lesson/list`,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Add a course to user's whitelist.
export const apiPatchWhitelist = async ({
  course_id,
  signal,
}: WhitelistParams): Promise<MessageResponse> => {
  try {
    const { data } = await privateApi.patch<MessageResponse>(
      '/whitelist',
      { course_id },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Remove a course from user's whitelist.
export const apiDeleteWhitelist = async ({
  course_id,
  signal,
}: WhitelistParams): Promise<MessageResponse> => {
  try {
    const { data } = await privateApi.delete<MessageResponse>('/whitelist', {
      data: { course_id },
      signal,
    });

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Get all teachers in a course by course id.
export const apiGetTeacherInCourse = async ({
  id,
  signal,
}: CourseIdParams): Promise<Teacher[]> => {
  try {
    const { data } = await privateApi.get<Teacher[]>(
      `/course/detail/${id}/teacher/list`,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};
