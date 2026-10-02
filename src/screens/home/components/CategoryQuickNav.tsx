import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import CategoryIconBadge from '../../../components/category/CategoryIconBadge';
import AppText from '../../../components/texts/AppText';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
  sharedPaddingHorizontal,
} from '../../../styles/sharedstyles';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type QuickNavItem = {
  key: string;
  label: string;
  /** @deprecated fallback now comes from CategoryIconBadge */
  icon?: IoniconName;
  /** Category icon from the API (white glyph PNG, same as the website) */
  iconUri?: string | null;
  onPress: () => void;
};

type Props = {
  items: QuickNavItem[];
};

/**
 * Shortcuts to course categories.
 *
 * The home page stacks category sliders; reaching a lower one means scrolling
 * past all of them. This row jumps straight to a category's list page.
 *
 * Flat design — solid chips, thin border, brand-colored icon, no shadow.
 */
const CategoryQuickNav: React.FC<Props> = ({ items }) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          paddingHorizontal: scale(sharedPaddingHorizontal),
          gap: scale(10),
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
          backgroundColor: AppColors.surfaceSubtle,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.pill),
          paddingVertical: verticalScale(10),
          paddingLeft: scale(12),
          paddingRight: scale(16),
        },
        pressed: {
          backgroundColor: AppColors.surface,
          opacity: PRESSED_OPACITY,
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  if (!items.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {items.map(item => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <CategoryIconBadge
            uri={item.iconUri}
            categoryId={item.key}
            size={16}
          />
          <AppText fontSize={AppFontSize.caption} numberOfLines={1}>
            {item.label}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default React.memo(CategoryQuickNav);
