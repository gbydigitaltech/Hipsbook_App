import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type IconProps = Partial<{ size: number; width: number; height: number }>;

export type AppIconButtonProps = {
  icon: React.ReactElement<IconProps>;
  onPress?: () => void;
  disabled?: boolean;

  iconSize?: number;
  buttonWidth?: number;
  buttonHeight?: number;
  borderRadius?: number | 'full';

  bgColor?: string;
  pressedOpacity?: number;
  pressedScale?: number;
  accessibilityLabel?: string;
};

const AppIconButton: React.FC<AppIconButtonProps> = ({
  icon,
  onPress,
  disabled = false,

  iconSize = 20,
  buttonWidth = 40,
  buttonHeight = 40,
  borderRadius = 'full',

  bgColor = AppColors.whitelistBackground,
  pressedOpacity = 0.85,
  pressedScale = 0.96,
  accessibilityLabel,
}) => {
  const { scale, MIN_TAP } = useResponsive();

  // Scale width and height equally so the button stays circular, not oval.
  // (If height must intentionally differ from width, switch back to verticalScale.)
  const w = scale(buttonWidth);
  const h = scale(buttonHeight);

  // Expand hitSlop to guarantee minimum tap target
  const padX = Math.max(0, (MIN_TAP - w) / 2);
  const padY = Math.max(0, (MIN_TAP - h) / 2);

  // "full" => round based on shortest side
  const br =
    borderRadius === 'full'
      ? Math.min(w, h) / 2
      : scale(borderRadius as number);

  // Scale the icon with the screen (responsive icon).
  const scaledIconSize = scale(iconSize);

  // Inject size props carefully.
  const clonedIcon = React.cloneElement(icon, {
    size: icon.props?.size ?? scaledIconSize,
    width: icon.props?.width ?? scaledIconSize,
    height: icon.props?.height ?? scaledIconSize,
  });

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={{ top: padY, bottom: padY, left: padX, right: padX }}
      style={({ pressed }): ViewStyle => {
        // Disabled visual state: drop opacity to 40%.
        let currentOpacity = 1;
        if (disabled) currentOpacity = 0.4;
        else if (pressed) currentOpacity = pressedOpacity;

        return {
          ...styles.container,
          backgroundColor: bgColor,
          opacity: currentOpacity,
          transform: [{ scale: pressed && !disabled ? pressedScale : 1 }],
          width: w,
          height: h,
          borderRadius: br,
        };
      }}
    >
      <View style={styles.iconWrapper}>{clonedIcon}</View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  iconWrapper: { justifyContent: 'center', alignItems: 'center' },
});

export default React.memo(AppIconButton);
