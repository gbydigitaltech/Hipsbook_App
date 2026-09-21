import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

/** Supported semantic font weights for app button text */
export type FontWeightType = 'regular' | 'medium' | 'semiBold' | 'bold';

/** Props for reusable app button component */
export interface AppButtonProps {
  /** Button label text */
  title: string;

  /** Press handler */
  onPress?: () => void;

  /** Disable interaction */
  disabled?: boolean;

  /** Show loading state/spinner */
  loading?: boolean;

  /** Stretch button to full container width */
  fullWidth?: boolean;

  /** Outer container style override */
  containerStyle?: StyleProp<ViewStyle>;

  /** Inner content wrapper style override */
  contentStyle?: StyleProp<ViewStyle>;

  /** Button text style override */
  textStyle?: StyleProp<TextStyle>;

  /** Solid background color (when gradient is not used) */
  backgroundColor?: string;

  /** Border radius in pixels */
  radius?: number;

  /** Opacity value for button container */
  opacity?: number;

  /** Text color */
  fontColor?: string;

  /** Text size in pixels */
  fontSize?: number;

  /** Semantic text weight */
  fontWeight?: FontWeightType;

  /** Touchable active opacity on press */
  activeOpacity?: number;

  /** Enable gradient background */
  useGradient?: boolean;

  /** Gradient color stops */
  gradientColors?: string[];

  /** Gradient stop positions (0..1) */
  gradientLocations?: number[];

  /** Gradient angle in degrees */
  gradientAngle?: number;

  /** Enforce minimum tap target size for accessibility */
  enforceMinTap?: boolean;

  secondary?: boolean;
}
