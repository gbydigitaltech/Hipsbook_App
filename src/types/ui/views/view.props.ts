import type { ReactElement, ReactNode } from 'react';
import type {
  FlatListProps,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

/** Props for safe-area wrapper view component */
export interface AppSafeViewProps {
  /** Child content */
  children: ReactNode;

  /** Optional container style override */
  style?: StyleProp<ViewStyle>;

  /** Optional background color */
  backgroundColor?: string;
}

/** Extended props for app scroll view wrapper */
export type AppScrollViewProps = ScrollViewProps & {
  /** Apply shared horizontal padding automatically */
  withHorizontalPadding?: boolean;

  /** Extra bottom spacer height in pixels */
  extraBottomSpace?: number;

  /** Non-scrolling header area rendered above main scroll content */
  staticHeader?: ReactNode;

  /** Header rendered inside scroll content */
  header?: ReactNode;

  /** Footer rendered inside scroll content */
  footer?: ReactNode;
};

/** Extended props for app flat list wrapper */
export type AppFlatListProps<ItemT = any> = FlatListProps<ItemT> & {
  /** Apply shared horizontal padding automatically */
  withHorizontalPadding?: boolean;

  /** Extra bottom spacer height in pixels */
  extraBottomSpace?: number;

  /** Non-scrolling header area rendered above list */
  staticHeader?: ReactNode;

  /** List header component rendered inside list */
  header?: ReactElement | null;

  /** List footer component rendered inside list */
  footer?: ReactElement | null;
};
