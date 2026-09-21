import { GestureResponderEvent, ViewStyle } from 'react-native';

/** Props for reusable list-tile row component */
export interface AppListTileProps {
  /** Main title text */
  title: string;

  /** Optional left icon/content */
  leftIcon?: React.ReactNode;

  /** Optional right icon/content */
  rightIcon?: React.ReactNode;

  /** Press handler */
  onPress?: (event: GestureResponderEvent) => void;

  /** Optional container style override */
  containerStyle?: ViewStyle;

  /** Disable interaction */
  disabled?: boolean;

  /** Optional custom right-side content (overrides/adds right area) */
  rightContent?: React.ReactNode;

  /** Title font size in pixels */
  titleFontSize?: number;

  /**
   * Whether it sits inside an AppListGroup.
   *
   * When true the row doesn't draw its own frame/rounded corners; the group does.
   * (Set automatically by AppListGroup — normally no need to pass it.)
   */
  grouped?: boolean;

  /** Destructive/sign-out style — text and icon in red. */
  destructive?: boolean;
}
