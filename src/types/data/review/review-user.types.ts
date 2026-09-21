export type CourseReviewUserPersonalInfo = {
  first_name: string;
  last_name: string;
};

export type CourseReviewJoinUser = {
  id: string;
  email: string;

  join_PersonalInfo: CourseReviewUserPersonalInfo[];
};
