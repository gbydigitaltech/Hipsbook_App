import type { StyleProp, ViewStyle } from 'react-native';

/** Props for filter action button component */
export interface FilterButtonProps {
  /** Press handler */
  onPress?: () => void;

  /** Optional wrapper style override */
  style?: StyleProp<ViewStyle>;

  /** Icon/tint color */
  color?: string;

  /** Icon size in pixels */
  size?: number;

  /** Button background color */
  backgroundColor?: string;

  /** Button corner radius in pixels */
  radius?: number;
}
