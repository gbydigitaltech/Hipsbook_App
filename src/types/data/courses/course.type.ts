import { CourseTeacherItem } from './course.teacher.types';

export type CourseImageList = {
  IMAGE_16_9?: string;
  IMAGE_4_3?: string;
  IMAGE_1_1?: string;
  [key: string]: string | undefined;
};

export type Course = {
  id: string;
  courses_id: string | null;

  label: string;

  cover_image: string | null;
  cover_image_list?: CourseImageList;

  is_free: boolean;
  price: number;

  view: number;

  duration: number;
  str_duration: string;

  level: string;

  student: number;

  teacher: CourseTeacherItem[];

  quiz_total: number;

  library_id: string;

  library: unknown | null;

  whitelist: unknown | null;
};
