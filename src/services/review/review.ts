import {
  CreateCourseReviewResponse,
  GetCourseReviewAllResponse,
  GetMyCourseReviewResponse,
  ToggleCourseReviewLikeResponse,
} from '../../types/data/review/review-api.types';
import { GetCourseReviewDetailResponse } from '../../types/data/review/review-detail.types';
import { asError } from '../asError';
import { privateApi } from '../http';

type RequestParams = {
  signal?: AbortSignal;
};

type CourseIdParams = RequestParams & {
  courseId: string;
};

type ReviewIdParams = RequestParams & {
  reviewId: string;
};

type CreateCourseReviewParams = RequestParams & {
  courseId: string;
  rating?: number;
  content?: string;
};

type GetCourseReviewAllParams = RequestParams & {
  courseId: string;
  page?: number;
  limit?: number;
};

type DeleteCourseReviewResponse = {
  status?: string;
  message?: string;
};

const normalizeRequiredId = (value: string, fieldName: string): string => {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
};

const buildCreateCourseReviewPayload = ({
  courseId,
  rating,
  content,
}: CreateCourseReviewParams) => {
  const course_id = normalizeRequiredId(courseId, 'course_id');
  const contentTrimmed = typeof content === 'string' ? content.trim() : '';

  const hasContent = contentTrimmed.length > 0;
  const hasRating = typeof rating === 'number';

  if (!hasRating && !hasContent) {
    throw new Error('Either rating or content must be provided');
  }

  if (hasRating) {
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new Error('rating must be between 1 and 5');
    }
  }

  return {
    course_id,
    ...(hasRating ? { rating } : {}),
    ...(hasContent ? { content: contentTrimmed } : {}),
  };
};

export const apiGetMyCourseReview = async ({
  courseId,
  signal,
}: CourseIdParams): Promise<GetMyCourseReviewResponse> => {
  try {
    const course_id = normalizeRequiredId(courseId, 'course_id');

    const { data } = await privateApi.post<GetMyCourseReviewResponse>(
      '/course-review/me',
      { course_id },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiCreateCourseReview = async ({
  courseId,
  rating,
  content,
  signal,
}: CreateCourseReviewParams): Promise<CreateCourseReviewResponse> => {
  try {
    const payload = buildCreateCourseReviewPayload({
      courseId,
      rating,
      content,
      signal,
    });

    const { data } = await privateApi.post<CreateCourseReviewResponse>(
      '/course-review/create',
      payload,
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiGetCourseReviewAll = async ({
  courseId,
  page,
  limit,
  signal,
}: GetCourseReviewAllParams): Promise<GetCourseReviewAllResponse> => {
  try {
    const course_id = normalizeRequiredId(courseId, 'course_id');

    const { data } = await privateApi.post<GetCourseReviewAllResponse>(
      '/course-review/all',
      {
        course_id,
        ...(typeof page === 'number' ? { page } : {}),
        ...(typeof limit === 'number' ? { limit } : {}),
      },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiToggleCourseReviewLike = async ({
  reviewId,
  signal,
}: ReviewIdParams): Promise<ToggleCourseReviewLikeResponse> => {
  try {
    const review_id = normalizeRequiredId(reviewId, 'review_id');

    const { data } = await privateApi.post<ToggleCourseReviewLikeResponse>(
      '/course-review-like/toggle',
      { review_id },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiDeleteCourseReview = async ({
  courseId,
  signal,
}: CourseIdParams): Promise<DeleteCourseReviewResponse> => {
  try {
    const course_id = normalizeRequiredId(courseId, 'course_id');

    const { data } = await privateApi.post<DeleteCourseReviewResponse>(
      '/course-review/delete',
      { course_id },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiGetCourseReviewDetail = async ({
  reviewId,
  signal,
}: ReviewIdParams): Promise<GetCourseReviewDetailResponse> => {
  try {
    const review_id = normalizeRequiredId(reviewId, 'review_id');

    const { data } = await privateApi.post<GetCourseReviewDetailResponse>(
      '/course-review/detail',
      {
        review_id,
      },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};
