export interface DocumentAttachment {
  url: string;
}

export interface CourseDocumentItem {
  id: string | number;
  label: string;

  price?: number;
  is_free?: boolean;
  activate?: boolean;

  attachment?: DocumentAttachment[];
  lesson_type?: string;
}

export interface CourseAudioItem {
  id: string | number;
  label: string;

  price?: number;
  is_free?: boolean;
  activate?: boolean;

  media_id: string;
  str_duration?: string;
  lesson_type?: string;
}
export type CourseDocumentUnion = CourseDocumentItem | CourseAudioItem;
