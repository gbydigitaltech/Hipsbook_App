import { CourseReviewRatingSummary } from './review-rating.types';
import { CourseReviewJoinUser } from './review-user.types';
import { CourseReview, CourseReviewMe } from './review.types';

export type MyReviewMeta = {
  status: string | null;
  review_id: string | null;
  can_create: boolean;
  can_edit: boolean;
};

export type GetMyCourseReviewResponse = {
  has_review: boolean;
  like_count: number;
  liked_by_me: boolean | null;
  message: string;

  my_review: MyReviewMeta;

  replies_flat: unknown[];

  reply_count: number;
  reply_user_count: number;

  review: CourseReviewMe | null;
};

export type CreateCourseReviewResponse = {
  createdNew: boolean;
  review: CourseReview;
};

export type CourseReviewAllItem = {
  id: string;

  fk_course_id: string;
  fk_user_id: string;

  rating: number | null;
  content: string | null;

  status: 'ACTIVE' | 'HIDDEN' | string;

  create_timestamp: string;
  modify_timestamp: string;

  join_User?: CourseReviewJoinUser;

  like_count: number;
  reply_count: number;
  replier_count: number;

  liked_by_me: boolean | null;
};

export type CourseReviewAllMyReviewMeta = {
  status: string | null;
  review_id: string | null;
  can_create: boolean | null;
  can_edit: boolean | null;
  message: string | null;
};

export type GetCourseReviewAllResponse = {
  course_id: string;

  my_review: CourseReviewAllMyReviewMeta;

  rating_summary: CourseReviewRatingSummary;

  data: CourseReviewAllItem[];

  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ToggleCourseReviewLikeRequest = {
  review_id: string;
};

export type ToggleCourseReviewLikeResponse = {
  liked: boolean;
  like_count: number;
};
