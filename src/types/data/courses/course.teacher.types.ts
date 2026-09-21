export type CourseTeacherItem = {
  fk_teacher_id: string;

  join_Teacher: {
    id: string;
    profile_image: string | null;

    first_name: string;
    last_name: string;
  };
};

export type CourseTeacherSkill = string;

export type CourseTeacherDetailItem = {
  id: string;
  profile_image: string | null;

  first_name: string;
  last_name: string;

  gender: string | null;
  date_of_birth: string | number | null;

  email: string | null;
  phone_number: string | null;
  line_id: string | null;

  education: string;
  experience: string;

  skill: CourseTeacherSkill[];
  skill_other: CourseTeacherSkill[];

  course_amount: number;
  review_amount: number;
  ratings_amount: number;

  course_total: number;
  review_total: number;
  ratings_total: number;

  [key: string]: any;
};

export type CourseTeacherListResponse = CourseTeacherDetailItem[];
