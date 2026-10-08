export interface CourseLesson {
  id: string | number;
  label: string;
  description?: string;

  price?: number;
  is_free?: boolean;
  activate?: boolean;

  media_id?: string;

  /** "HH:MM:SS.0" from the API */
  str_duration?: string;
  /** milliseconds */
  duration?: number;
}
