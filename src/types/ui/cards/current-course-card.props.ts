import { ImageSourcePropType } from 'react-native';

/** Teacher info used in current-course card */
export interface CurrentCourseTeacher {
  /** Teacher first name */
  first_name?: string;

  /** Teacher last name */
  last_name?: string;

  /** Teacher avatar/profile image (URL or local source) */
  profile_image?: string | ImageSourcePropType | null;
}

/** Props for current/in-progress course card component */
export interface CurrentCourseCardProps {
  /** Course ID */
  id: string;

  /** Course title */
  label: string;

  /** Learning progress value (expected as percentage or normalized value by component contract) */
  progress: number;

  /** Course cover image (URL or local source) */
  cover_image?: string | ImageSourcePropType | null;

  /** Optional teacher list */
  teacher?: CurrentCourseTeacher[];
}
