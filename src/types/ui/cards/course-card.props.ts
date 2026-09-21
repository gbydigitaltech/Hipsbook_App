import type { StyleProp, ViewStyle } from 'react-native';

/** Optional embedded teacher profile in course-teacher relation */
export type CourseTeacherJoin = {
  /** Teacher ID */
  id: string;

  /** Teacher profile image URL */
  profile_image?: string | null;

  /** Teacher first name */
  first_name?: string | null;

  /** Teacher last name */
  last_name?: string | null;
} | null;

/** Teacher reference item attached to a course */
export type CourseTeacherRef = {
  /** Foreign key to teacher */
  fk_teacher_id: string;

  /** Optional embedded teacher data */
  join_Teacher?: CourseTeacherJoin;
};

/** Props for course card component */
export interface CourseCardProps {
  /** Course ID */
  id: string;

  /** Course title/label */
  label: string;

  /** Course cover image URL */
  cover_image?: string | null;

  /** Teacher references for this course */
  teacher: CourseTeacherRef[];

  /** True if course is free */
  is_free?: boolean;

  /** Course price */
  price?: number | null;

  /** Handler when card is pressed */
  onPress?: () => void;

  /** Handler for buy action */
  onPressBuy?: () => void;

  /** Handler for start-learning action */
  onPressStartLearn?: () => void;

  /** Handler for go-to-library action */
  onPressGoToLibrary?: () => void;

  /** Current whitelist state */
  whitelist?: boolean;

  /** Callback when whitelist is toggled */
  onToggleWhitelist?: (next: boolean) => void;

  /** Initial cart toggle state (uncontrolled mode) */
  cartToggleDefault?: boolean;

  /** Callback when cart toggle changes */
  onToggleCart?: (next: boolean) => void;

  /** Optional container style override */
  containerStyle?: StyleProp<ViewStyle>;

  /** Library ID if course is in user library */
  library_id?: string;

  /** Library state/metadata */
  library?: boolean | null;

  /** Custom label for start/continue action */
  startLabel?: string;
}
