// AppBackground.tsx
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../styles/colors';
import type { AppBackgroundProps } from '../../types/ui/backgrounds/app-background.props';

const AppBackground = React.memo(function AppBackground({
  startColor = AppColors.primary,
  endColor = AppColors.secondary,
  stopsPercent = [-12.95, 14.54], // gradient stop positions in %
  angle = 180.0,
  coverStatusBar = true, // include safe-area top in gradient height
  overshootTopExtra = 0, // extra extend ratio on top
  overshootBottomExtra = 0, // extra extend ratio on bottom
  pointerEvents = 'none',
  ...rest
}: AppBackgroundProps) {
  // Screen size
  const { width, height: winH } = useWindowDimensions();

  // Safe-area insets (notch/status bar)
  const insets = useSafeAreaInsets();

  // Convert stop % -> decimal range
  const minStop = Math.min(...stopsPercent) / 100;
  const maxStop = Math.max(...stopsPercent) / 100;

  // Required overshoot when stops are outside [0..1]
  const overshootTop = Math.max(0, -minStop) + overshootTopExtra;
  const overshootBottom = Math.max(0, maxStop - 1) + overshootBottomExtra;

  // Base drawable height (optionally includes status-bar area)
  const baseH = winH + (coverStatusBar ? insets.top : 0);

  // Total extended length factor
  const L = 1 + overshootTop + overshootBottom;

  // Normalize stop locations into [0..1] on extended length
  const locations = stopsPercent.map(p => (p / 100 + overshootTop) / L);

  // Final gradient frame
  const extendedHeight = baseH * L;
  const topOffset = -baseH * overshootTop;

  return (
    <LinearGradient
      colors={[startColor, endColor]}
      useAngle
      angle={angle}
      angleCenter={{ x: 0.5, y: 0.5 }}
      locations={locations}
      pointerEvents={pointerEvents}
      style={[
        StyleSheet.absoluteFill,
        { width, height: extendedHeight, top: topOffset }, // full width + extended vertical range
      ]}
      {...rest}
    />
  );
});

export default AppBackground;
