import { ViewStyle } from 'react-native';
import { CourseTeacherRef } from '../../cards/course-card.props';

export type SliderCourseItem = {
  id: string;
  label: string;
  cover_image?: string | null;
  teacher: CourseTeacherRef[];
  is_free?: boolean;
  price?: number | null;
  whitelist?: boolean;
  library_id?: string;
  library?: boolean | null;
  onPress?: () => void;
  onToggleWhitelist?: (next: boolean) => void;
  onPressStartLearn?: () => void;
  onPressBuy?: () => void;
  onPressGoToLibrary?: () => void;
};

export type HorizontalCourseSliderProps = {
  data: SliderCourseItem[];
  itemWidth?: number;
  gap?: number;
  containerStyle?: ViewStyle;
  autoSlideInterval?: number;
  autoplayDelayMs?: number;
  onReachEnd?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  reachEndThreshold?: number;
  loading?: boolean;
  skeletonCount?: number;
};

export type VerticalCourseSliderProps = {
  data: SliderCourseItem[];
  gap?: number;
  containerStyle?: ViewStyle;
  autoSlideInterval?: number;
  autoplayDelayMs?: number;
  loading?: boolean;
  skeletonCount?: number;
};
