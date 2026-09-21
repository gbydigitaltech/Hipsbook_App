import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import AppText from '../texts/AppText';
import { PRESSED_OPACITY } from '../../styles/sharedstyles';

export interface AppIconBadgeButtonProps {
  renderIcon: (size: number, color: string) => React.ReactNode; // Icon renderer (receives computed size + color)
  onPress?: () => void; // Called when button is pressed
  count?: number; // Badge count (hidden when <= 0)
  size?: number; // Base icon size before responsive scaling
  color?: string; // Icon color
  badgeColor?: string; // Badge background color
  badgeTextColor?: string; // Badge text color
  hitSlop?: number; // Extra touch area around button
  disabled?: boolean; // Disable interaction
}

const AppIconBadgeButton: React.FC<AppIconBadgeButtonProps> = ({
  renderIcon,
  onPress,
  count = 0,
  size = 26,
  color = AppColors.white,
  badgeColor = AppColors.danger,
  badgeTextColor = AppColors.white,
  hitSlop = 8,
  disabled,
}) => {
  const { scale, verticalScale } = useResponsive();

  // Responsive icon size with safe bounds
  const iconSize = Math.max(12, Math.min(verticalScale(16), scale(size)));

  // Badge layout values
  const badgeTop = verticalScale(-2);
  const badgeRight = scale(-4);
  const badgeHeight = verticalScale(16);
  const badgeMinWidth = Math.max(14, scale(16));
  const badgePaddingX = Math.max(2, scale(3));
  const badgeRadius = badgeHeight / 2;
  const badgeFontSize = Math.max(9, Math.min(12, Math.round(scale(10))));

  // Memoized dynamic badge style
  const dynamicBadgeStyle = useMemo(
    () => ({
      top: badgeTop,
      right: badgeRight,
      height: badgeHeight,
      minWidth: badgeMinWidth,
      paddingHorizontal: badgePaddingX,
      borderRadius: badgeRadius,
      backgroundColor: badgeColor,
    }),
    [
      badgeTop,
      badgeRight,
      badgeHeight,
      badgeMinWidth,
      badgePaddingX,
      badgeRadius,
      badgeColor,
    ],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? PRESSED_OPACITY : 1 },
      ]}
    >
      <View style={styles.iconWrapper}>
        {renderIcon(iconSize, color)}

        {/* Show badge only when count > 0 */}
        {count > 0 && (
          <View style={[styles.badge, dynamicBadgeStyle]}>
            <AppText
              style={{
                color: badgeTextColor,
                fontSize: badgeFontSize,
                fontWeight: '700' as const,
              }}
            >
              {/* Clamp large values */}
              {count > 99 ? '99+' : count}
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default React.memo(AppIconBadgeButton);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative', // Anchor for absolute badge
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
