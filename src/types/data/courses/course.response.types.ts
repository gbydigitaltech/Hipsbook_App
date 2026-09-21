import { CourseCategory } from './course.category.types';
import { CourseLessonSection } from './course.lesson.types';
import { CourseImageList } from './course.type';

export type JoinCourseAttachment = {
  [key: string]: any;
};

export type CourseDetailResponse = {
  id: string;

  courses_id: string;

  video_preview: string | null;

  label: string;

  price: number;

  description: string;

  tag: string;

  join_CourseAttachment: JoinCourseAttachment[];

  view: number;

  cover_image: string;

  cover_image_list: CourseImageList;

  duration: number;

  str_duration: string;

  library_id: string;

  library: boolean;

  whitelist: boolean;

  sub_description: string[];

  level: string;

  course_status: string;

  course_category: CourseCategory[];

  lesson_amount: number;

  lesson_duration: number;

  lesson_str_duration: string;

  review_amount: number;

  ratings_amount: number | null;

  learners_amount: number;

  student: number;

  learning_amount: number;

  learning_progress: number;
};

export type CourseLessonListResponse = {
  amount: number;

  duration: number;

  str_duration: string;

  data: CourseLessonSection[];
};
