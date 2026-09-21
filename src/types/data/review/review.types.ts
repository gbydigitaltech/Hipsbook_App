export type CourseReview = {
  id: string;
  fk_course_id: string;
  fk_user_id: string;

  rating: number | null;
  content: string | null;

  status: 'ACTIVE' | 'HIDDEN' | string;

  status_at: string;
  status_by: string;

  create_timestamp: string;
  modify_timestamp: string;
};

export type CourseReviewMe = {
  id?: string;
  course_id?: string;
  rating?: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
};
