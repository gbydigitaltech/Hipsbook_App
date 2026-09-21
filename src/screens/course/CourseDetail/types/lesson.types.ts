export interface CourseLesson {
  id: string | number;
  label: string;
  description?: string;

  price?: number;
  is_free?: boolean;
  activate?: boolean;

  media_id?: string;
}
