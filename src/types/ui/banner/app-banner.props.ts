import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

/** Props for reusable app banner/carousel component */
export interface AppBannerProps {
  /** Single banner image source */
  source?: ImageSourcePropType;

  /** Multiple banner image sources (for slider mode) */
  sources?: ImageSourcePropType[];

  /** Link list (same index as sources) */
  links?: string[];

  /** Banner aspect ratio (width / height) */
  aspectRatio?: number;

  /** Optional container style override */
  style?: StyleProp<ViewStyle>;

  /** Auto-slide interval in milliseconds */
  autoSlideInterval?: number;
}
