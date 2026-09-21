import { ImageSourcePropType } from 'react-native';

/** Props for reusable circle/icon button component */
export interface AppCircleIconButtonProps {
  /** Icon image source */
  iconSource: ImageSourcePropType;

  /** Button size in pixels */
  size?: number;

  /** Press handler */
  onPress: () => void;

  /** Touchable active opacity on press */
  activeOpacity?: number;

  /** Disable interaction */
  disabled?: boolean;

  /** Render as perfect circle when true */
  circular?: boolean;

  /** Enforce minimum tap target size for accessibility */
  enforceMinTap?: boolean;

  /** Icon size ratio relative to button size (0..1) */
  iconRatio?: number;

  /** Test identifier for E2E/UI tests */
  testID?: string;
}
