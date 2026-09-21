import React, { useMemo } from 'react';
import {
  Image,
  ImageStyle,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppCircleIconButtonProps } from '../../types/ui/buttons/app-circle-icon-button.props';

const DEFAULT_SIZE = 30;

// Responsive icon button (circle/square)
const AppCircleIconButton: React.FC<AppCircleIconButtonProps> = ({
  iconSource, // Icon image source
  onPress, // Called when button is pressed
  size = DEFAULT_SIZE, // Base visual size
  activeOpacity = 0.8, // Opacity while pressing
  disabled = false, // Disable interaction
  circular = true, // true = circle, false = square
  enforceMinTap = true, // Ensure minimum tap target size
  iconRatio = 1, // Inner icon size ratio (0..1+)
  testID, // Testing identifier
}) => {
  const { moderateScale, MIN_TAP } = useResponsive();

  // Scaled visual button size
  const visualSize = useMemo(
    () => Math.max(1, moderateScale(size, 0.5)),
    [size, moderateScale],
  );

  // Tap area size (optionally enforce minimum touch target)
  const touchSize = useMemo(
    () => (enforceMinTap ? Math.max(MIN_TAP, visualSize) : visualSize),
    [enforceMinTap, MIN_TAP, visualSize],
  );

  // Border radius for container
  const containerRadius = useMemo(
    () => (circular ? visualSize / 2 : 0),
    [circular, visualSize],
  );

  // Inner icon size relative to visual size
  const iconSize = useMemo(
    () => Math.max(1, Math.min(visualSize, visualSize * iconRatio)),
    [visualSize, iconRatio],
  );

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[styles.touchArea, { width: touchSize, height: touchSize }]}
      hitSlop={HIT_SLOP}
    >
      <View
        style={[
          styles.visualButton,
          {
            width: visualSize,
            height: visualSize,
            borderRadius: containerRadius,
          },
        ]}
      >
        <Image
          source={iconSource}
          style={[
            styles.icon,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: containerRadius,
            },
          ]}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
};

export default AppCircleIconButton;

// Extra tap padding for easier press
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 } as const;

const styles = StyleSheet.create({
  touchArea: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  visualButton: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  icon: {} as ImageStyle,
});
