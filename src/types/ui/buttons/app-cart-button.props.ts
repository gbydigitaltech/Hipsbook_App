import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

/** Base props for cart button appearance and behavior */
export interface AppCartButtonBaseProps {
  /** Press handler */
  onPress?: () => void;

  /** Badge count (e.g., cart items) */
  count?: number;

  /** Button background color */
  backgroundColor?: ColorValue;

  /** Cart icon color */
  iconColor?: string;

  /** Button corner radius in pixels */
  radius?: number;

  /** Optional wrapper style override */
  containerStyle?: StyleProp<ViewStyle>;

  /** Icon size in pixels */
  iconSize?: number;
}

/** Optional toggle behavior props for cart button */
export interface AppCartButtonToggleProps {
  /** Enable active/inactive toggle mode */
  enableToggle?: boolean;

  /** Initial active state for uncontrolled usage */
  defaultActive?: boolean;

  /** Controlled active state */
  active?: boolean;

  /** Callback fired when toggle state changes */
  onToggle?: (nextActive: boolean) => void;
}

/** Complete cart button props */
export type AppCartButtonProps = AppCartButtonBaseProps &
  AppCartButtonToggleProps;
