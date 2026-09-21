import { Course } from './course.type';
import { PaginationResponse } from './pagination.types';

export type CourseListResponse = PaginationResponse & {
  data: Course[];

  sort_title: 'date' | 'price';

  sort_by: 'asc' | 'desc';

  course_total: number;
};

export type RecommendCourseListResponse = PaginationResponse & {
  data: Course[];
};
