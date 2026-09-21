import type { StyleProp, ViewStyle } from 'react-native';

/** Props for reusable back button component */
export interface AppBackButtonProps {
  /** Icon color */
  color?: string;

  /** Optional wrapper style override */
  style?: StyleProp<ViewStyle>;

  /** Press handler (defaults to navigation back behavior if omitted) */
  onPress?: () => void;

  /** Icon size in pixels */
  size?: number;
}
