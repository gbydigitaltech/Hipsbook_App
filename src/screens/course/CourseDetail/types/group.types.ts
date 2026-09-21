import { CourseAudioItem, CourseDocumentItem } from './document.types';
import { CourseLesson } from './lesson.types';

export interface LessonGroup {
  title: string;
  videos: CourseLesson[];
}

export interface DocumentGroup {
  title: string;
  items: (CourseDocumentItem | CourseAudioItem)[];
}
