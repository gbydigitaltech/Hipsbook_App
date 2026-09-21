import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import CartIcon from '../../assets/icons/CartIcon';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import type { AppCartButtonProps } from '../../types/ui/buttons/app-cart-button.props';
import AppText from '../texts/AppText';
import { PRESSED_OPACITY } from '../../styles/sharedstyles';

const AppCartButton: React.FC<AppCartButtonProps> = ({
  onPress, // Called when button is pressed
  count = 0, // Cart count (used when enableToggle = false)
  enableToggle = false, // If true, button works in toggle mode
  defaultActive = false, // Initial toggle state (uncontrolled mode)
  active, // Controlled toggle state from parent
  onToggle, // Called when toggle state changes
  backgroundColor = AppColors.backgroundInteractive, // Button background color
  iconColor = AppColors.white, // Cart icon color
  radius = 50, // Base corner radius
  containerStyle, // Extra style override for button container
  iconSize, // Optional icon size override
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const paddingVertical = verticalScale(10);
  const paddingHorizontal = scale(20);
  const borderRadius = responsiveRadius(radius);

  // Resolve icon size with safe min/max fallback
  const resolvedIconSize =
    iconSize ?? Math.max(12, Math.min(verticalScale(20), scale(20)));

  const baseBadgeHeight = Math.max(verticalScale(14), resolvedIconSize * 0.45);
  const badgeHeight = baseBadgeHeight;
  const badgeMinWidth = Math.max(14, badgeHeight);
  const badgePaddingX = Math.max(2, scale(3));
  const badgeRadius = badgeHeight / 2;
  const badgeFontSize = Math.max(9, Math.round(badgeHeight * 0.55));
  const badgeOffset = badgeHeight * 0.35;

  // Supports both controlled and uncontrolled toggle state
  const [internalActive, setInternalActive] = React.useState(defaultActive);
  const isActive = active ?? internalActive;

  const handlePress = () => {
    if (enableToggle) {
      const next = !isActive;
      if (active === undefined) setInternalActive(next); // uncontrolled only
      onToggle?.(next);
    }
    onPress?.();
  };

  // In toggle mode: active => 1, inactive => 0
  const displayCount = enableToggle ? (isActive ? 1 : 0) : count;

  // Memoize dynamic badge style object
  const dynamicBadgeStyle = useMemo(
    () => ({
      top: -badgeOffset,
      right: -badgeOffset,
      height: badgeHeight,
      minWidth: badgeMinWidth,
      paddingHorizontal: badgePaddingX,
      borderRadius: badgeRadius,
    }),
    [badgeOffset, badgeHeight, badgeMinWidth, badgePaddingX, badgeRadius],
  );

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [
        styles.buttonContainer,
        {
          backgroundColor,
          paddingVertical,
          paddingHorizontal,
          borderRadius,
          opacity: pressed ? PRESSED_OPACITY : 1,
        },
        containerStyle,
      ]}
    >
      <View
        style={[
          styles.iconWrapper,
          {
            width: resolvedIconSize,
            height: resolvedIconSize,
          },
        ]}
      >
        <CartIcon size={resolvedIconSize} color={iconColor as string} />

        {displayCount > 0 && (
          <View style={[styles.badgeContainer, dynamicBadgeStyle]}>
            <AppText
              style={{
                color: AppColors.white,
                fontSize: badgeFontSize,
                fontWeight: '700' as const,
              }}
            >
              {displayCount > 99 ? '99+' : displayCount}
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default AppCartButton;

const styles = StyleSheet.create({
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flexDirection: 'row',
  },
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    backgroundColor: AppColors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
