// src/components/list/AppListTile.tsx
import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ForwardChevronIcon from '../../assets/icons/ForwardChevronIcon';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppListTileProps } from '../../types/ui/lists/app-list-tile.props';
import AppText from '../texts/AppText';
import { AppRadius, PRESSED_OPACITY } from '../../styles/sharedstyles';

const AppListTile: React.FC<AppListTileProps> = ({
  title, // Main title text
  leftIcon, // Optional left icon
  rightIcon, // Optional right icon (used when rightContent is undefined)
  rightContent, // Optional custom right content (priority over rightIcon)
  onPress, // Press handler
  containerStyle, // Container style override
  titleFontSize, // Title font size override
  disabled = false, // Disable interactions
  grouped = false, // Inside AppListGroup (the group draws the frame).
  destructive = false, // Destructive row, e.g. sign out.
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const [isPressed, setIsPressed] = useState(false); // Local pressed visual state

  // Responsive sizing
  const iconHeightBox = verticalScale(24);
  const iconWidthBox = scale(24);
  const defaultFontSize = 16;
  const finalFontSize = titleFontSize ?? defaultFontSize;
  const chevronSize = 14;

  // Memoize styles to avoid re-creating style objects every render
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: AppColors.cardBackgroundSecondary,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.lg),
          paddingHorizontal: scale(20),
          paddingVertical: verticalScale(18),
        },
        /** In a group — the group already draws the frame and rounded corners. */
        grouped: {
          borderWidth: 0,
          borderRadius: 0,
          backgroundColor: 'transparent',
          paddingHorizontal: scale(16),
        },
        leftSlot: {
          width: iconWidthBox,
          height: iconHeightBox,
          marginRight: scale(18),
          alignItems: 'center',
          justifyContent: 'center',
        },
        textContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        rightContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: scale(8),
        },
        destructiveText: { color: AppColors.danger },
        disabled: { opacity: 0.6 },
        pressed: { backgroundColor: AppColors.surface },
      }),
    [scale, verticalScale, responsiveRadius, iconWidthBox, iconHeightBox],
  );

  // Expand touch area for easier tapping
  const hitSlop = useMemo(
    () => ({
      top: verticalScale(6),
      right: scale(6),
      bottom: verticalScale(6),
      left: scale(6),
    }),
    [scale, verticalScale],
  );

  return (
    <TouchableOpacity
      activeOpacity={grouped ? 1 : PRESSED_OPACITY}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.container,
        grouped && styles.grouped,
        isPressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        containerStyle,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {/* Left icon slot */}
      <View style={styles.leftSlot}>{leftIcon ?? null}</View>

      {/* Title */}
      <View style={styles.textContainer}>
        <AppText
          fontWeight="medium"
          fontSize={finalFontSize}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={destructive ? styles.destructiveText : undefined}
        >
          {title}
        </AppText>
      </View>

      {/* Right area:
          - if rightContent is defined: render it (or nothing when null/false)
          - otherwise: rightIcon fallback to default chevron */}
      {rightContent !== undefined ? (
        rightContent ? (
          <View style={styles.rightContainer}>{rightContent}</View>
        ) : null
      ) : (
        <View style={styles.rightContainer}>
          {rightIcon ?? <ForwardChevronIcon size={chevronSize} />}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default AppListTile;
