import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ForwardChevronIcon from '../../assets/icons/ForwardChevronIcon';
import AppText from '../../components/texts/AppText';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize } from '../../styles/sharedstyles';
import { AppSectionHeaderProps } from '../../types/ui/sections/app-section-header.props';

/**
 * Header for each section.
 *
 * - A thin brand-colored bar precedes the title so the eye finds each section fast.
 * - "See all" shows only when it actually does something (it used to always show).
 *   An arrow marks it as a button.
 */
const AppSectionHeader: React.FC<AppSectionHeaderProps> = ({
  title,
  onPressSeeAll,
  seeAllLabel = 'ดูทั้งหมด',
  containerStyle,
  titleFontSize = AppFontSize.title,
  seeAllFontSize = AppFontSize.caption,
}) => {
  const { scale, moderateScale } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: scale(8),
        },
        titleGroup: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
          flexShrink: 1,
          minWidth: 0,
        },
        accentBar: {
          width: scale(3),
          height: moderateScale(titleFontSize, 0.5),
          borderRadius: scale(2),
          backgroundColor: AppColors.primary,
        },
        title: {
          flexShrink: 1,
        },
        seeAllGroup: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(4),
        },
        seeAllText: {
          color: AppColors.textSecondary,
        },
        pressed: {
          opacity: 0.6,
        },
      }),
    [scale, moderateScale, titleFontSize],
  );

  return (
    <View style={containerStyle}>
      <View style={styles.row}>
        <View style={styles.titleGroup}>
          <View style={styles.accentBar} />
          <AppText
            fontWeight="semiBold"
            fontSize={titleFontSize}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.title}
          >
            {title}
          </AppText>
        </View>

        {/* Shown only when actually pressable */}
        {onPressSeeAll ? (
          <Pressable
            onPress={onPressSeeAll}
            accessibilityRole="button"
            accessibilityLabel={seeAllLabel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.seeAllGroup,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              fontSize={seeAllFontSize}
              numberOfLines={1}
              style={styles.seeAllText}
            >
              {seeAllLabel}
            </AppText>
            <ForwardChevronIcon size={10} color={AppColors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export default AppSectionHeader;
