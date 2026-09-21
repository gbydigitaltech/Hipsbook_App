import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import HeartOutlineIcon from '../../assets/icons/HeartOutlineIcon';
import HeartSolidIcon from '../../assets/icons/HeartSolidIcon';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { WhitelistButtonProps } from '../../types/ui/buttons/whitelist-button.props';

const WhitelistButton: React.FC<WhitelistButtonProps> = ({
  isWhitelisted, // Current whitelist state
  onToggle, // Called with next state when pressed
  iconSize = 18, // Heart icon size
  buttonWidth = 28, // Base width before responsive scale
  buttonHeight = 28, // Base height before responsive scale
  disabled = false, // Disable interaction
  testID, // Testing identifier

  activeIconColor = AppColors.primary, // Heart color when whitelisted
  inactiveIconColor = AppColors.textPrimary, // Heart color when not whitelisted

  activeBgColor = AppColors.surfaceActive, // Background when whitelisted
  inactiveBgColor = AppColors.surfaceStrong, // Background when not whitelisted

  pressedOpacity = 0.9, // Opacity while pressing
  pressedScale = 0.9, // Scale while pressing
  rippleColor = AppColors.white + '33', // Android ripple color
}) => {
  const { scale, verticalScale, MIN_TAP } = useResponsive();

  const bg = isWhitelisted ? activeBgColor : inactiveBgColor;
  const iconColor = isWhitelisted ? activeIconColor : inactiveIconColor;

  // Responsive button size
  const w = scale(buttonWidth);
  const h = verticalScale(buttonHeight);

  // Force circular button using max dimension
  const diameter = Math.max(w, h);
  const br = diameter / 2;

  // Expand touch area to meet minimum tap target
  const pad = Math.max(0, (MIN_TAP - diameter) / 2);

  // "Pop" animation played whenever the whitelist state changes
  const pop = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    pop.stopAnimation();
    pop.setValue(1);
    Animated.sequence([
      Animated.timing(pop, {
        toValue: isWhitelisted ? 0.72 : 0.86,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(pop, {
        toValue: 1,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isWhitelisted, pop]);

  const handlePress = () => {
    if (disabled) return;
    onToggle?.(!isWhitelisted); // Toggle next state
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={isWhitelisted ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
      accessibilityState={{ disabled, selected: isWhitelisted }}
      hitSlop={{ top: pad, bottom: pad, left: pad, right: pad }}
      android_ripple={
        Platform.OS === 'android'
          ? {
              color: rippleColor,
              borderless: false,
              radius: br,
            }
          : undefined
      }
      style={({ pressed }) => [
        styles.container,
        {
          width: diameter,
          height: diameter,
          transform: [{ scale: pressed ? pressedScale : 1 }],
          opacity: pressed ? pressedOpacity : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.circle,
          isWhitelisted ? styles.activeShadow : styles.inactiveShadow,
          {
            width: diameter,
            height: diameter,
            borderRadius: br,
            backgroundColor: bg,
            borderColor: isWhitelisted
              ? AppColors.primary + '55'
              : AppColors.borderStrong,
            transform: [{ scale: pop }],
          },
        ]}
      >
        <View style={styles.iconWrapper}>
          {isWhitelisted ? (
            <HeartSolidIcon size={iconSize} color={iconColor} />
          ) : (
            <HeartOutlineIcon size={iconSize} color={iconColor} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrapper: { justifyContent: 'center', alignItems: 'center' },
  activeShadow: {
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },
  inactiveShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
});

export default WhitelistButton;
