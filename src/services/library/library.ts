import { CourseListResponse } from '../../types/data/courses/course.list.types';
import { GetCourseListParams } from '../../types/data/courses/course.query.types';
import {
  CourseDetailResponse,
  CourseLessonListResponse,
} from '../../types/data/courses/course.response.types';
import { CourseTeacherListResponse } from '../../types/data/courses/course.teacher.types';
import { asError } from '../asError';
import { privateApi } from '../http';

type RequestParams = {
  signal?: AbortSignal;
};

type LibraryIdParams = RequestParams & {
  libraryId: string;
};

type UpdateLibraryParams = RequestParams & {
  courseId: string;
};

type UpdateLibraryStatusParams = RequestParams & {
  libraryId: string;
  status: string;
};

type UpdateLibraryResponse = {
  new: boolean;
  id: string;
};

type UpdateLibraryStatusResponse = {
  id: string;
  status: string;
};

const buildLibraryListParams = ({
  search,
  page,
  limit,
}: GetCourseListParams = {}) => ({
  ...(search ? { search } : {}),
  ...(page !== undefined ? { page } : {}),
  ...(limit !== undefined ? { limit } : {}),
});

// Get user's library list with optional search and pagination.
export const apiGetLibraryList = async (
  params: GetCourseListParams = {},
): Promise<CourseListResponse> => {
  const { signal } = params;

  try {
    const { data } = await privateApi.get<CourseListResponse>('/library/list', {
      params: buildLibraryListParams(params),
      signal,
    });

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiGetLibraryDetail = async ({
  libraryId,
  signal,
}: LibraryIdParams): Promise<CourseDetailResponse> => {
  try {
    const { data } = await privateApi.get<CourseDetailResponse>(
      `/library/detail/${libraryId}`,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiGetLibraryLesson = async ({
  libraryId,
  signal,
}: LibraryIdParams): Promise<CourseLessonListResponse> => {
  try {
    const { data } = await privateApi.get<CourseLessonListResponse>(
      `/library/detail/${libraryId}/lesson/list`,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

// Toggle/update course in user's library.
export const apiUpdateLibrary = async ({
  courseId,
  signal,
}: UpdateLibraryParams): Promise<UpdateLibraryResponse> => {
  try {
    const { data } = await privateApi.patch<UpdateLibraryResponse>(
      '/library',
      { course_id: courseId },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiGetLibraryTeacherList = async ({
  libraryId,
  signal,
}: LibraryIdParams): Promise<CourseTeacherListResponse> => {
  try {
    const { data } = await privateApi.get<CourseTeacherListResponse>(
      `/library/detail/${libraryId}/teacher/list`,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiUpdateLibraryStatus = async ({
  libraryId,
  status,
  signal,
}: UpdateLibraryStatusParams): Promise<UpdateLibraryStatusResponse> => {
  try {
    const { data } = await privateApi.patch<UpdateLibraryStatusResponse>(
      '/library/status',
      {
        library_id: libraryId,
        status,
      },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};
