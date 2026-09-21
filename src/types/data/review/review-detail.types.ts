import { CourseReviewJoinUser } from './review-user.types';
import { CourseReview } from './review.types';

export type CourseReviewReplyItem = {
  id: string;
  fk_review_id: string;
  fk_user_id: string;
  fk_parent_id: string | null;

  content: string | null;
  status: 'ACTIVE' | 'HIDDEN' | string;

  create_timestamp: string;
  modify_timestamp: string;

  join_User?: CourseReviewJoinUser;
  depth: number;
};

export type CourseReviewDetailReview = CourseReview & {
  status_at?: string | null;
  status_by?: string | null;
  create_by?: string | null;
  modify_by?: string | null;
  join_User?: CourseReviewJoinUser;
};

export type GetCourseReviewDetailResponse = {
  review: CourseReviewDetailReview;
  like_count: number;
  liked_by_me: boolean | null;
  reply_count: number;
  reply_user_count: number;
  replies_flat: CourseReviewReplyItem[];
};
