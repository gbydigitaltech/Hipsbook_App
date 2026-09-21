export type CourseLessonAttachment = {
  label: string;
  description: string;

  directory: string | null;

  url: string;

  file_type: string;

  [key: string]: any;
};

export type CourseLessonItem = {
  id: string;

  label: string;

  video_preview: string | null;

  media_id: string;

  name: string;

  description: string;

  duration: number;
  str_duration: string;

  attachment: CourseLessonAttachment[];

  lesson_id: string;

  lesson_type: string;

  lesson_group: string;

  learn: boolean;

  activate: boolean;

  is_free: boolean;

  price: number;

  library_id: string;

  library: boolean;
};

export type CourseLessonGroup = {
  unknow: CourseLessonItem[];

  video: CourseLessonItem[];

  audio: CourseLessonItem[];

  document: CourseLessonItem[];
};

export type CourseLessonSection = {
  id?: string;

  title: string;

  lesson: CourseLessonItem[];

  lesson_group: CourseLessonGroup;
};
