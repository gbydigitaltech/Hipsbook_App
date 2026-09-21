import { ReactNode } from 'react';
import { StyleProp, TextProps, TextStyle } from 'react-native';

/** Supported semantic font weights for app text */
export type FontWeightType = 'regular' | 'medium' | 'semiBold' | 'bold';

/** Props for reusable app text component */
export interface AppTextProps extends TextProps {
  /** Text content or nested nodes */
  children: ReactNode;

  /** Semantic font weight */
  fontWeight?: FontWeightType;

  /** Font size in pixels */
  fontSize?: number;

  /** Optional text style override */
  style?: StyleProp<TextStyle>;
}
