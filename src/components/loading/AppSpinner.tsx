import React from 'react';
import { ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { AppColors } from '../../styles/colors';

export type AppSpinnerProps = {
  /**
   * small = inline (buttons, pills, list footers, section loading)
   * large = full screen / overlay / video
   */
  size?: 'small' | 'large';
  /** Defaults to the app primary color; override only on colored surfaces */
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** The one loading spinner used across the app (same color/sizes everywhere) */
const AppSpinner: React.FC<AppSpinnerProps> = ({
  size = 'small',
  color = AppColors.primary,
  style,
  accessibilityLabel = 'กำลังโหลด',
}) => (
  <ActivityIndicator
    size={size}
    color={color}
    style={style}
    accessibilityLabel={accessibilityLabel}
  />
);

export default AppSpinner;
