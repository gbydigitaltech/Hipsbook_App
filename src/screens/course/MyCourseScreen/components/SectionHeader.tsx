import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Search from '../../../../components/search/Search';
import AppText from '../../../../components/texts/AppText';
import { IS_TABLET } from '../../../../constants/platform';
import { useResponsive } from '../../../../helpers/responsive';
import { AppColors } from '../../../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
  sharedPaddingHorizontal,
} from '../../../../styles/sharedstyles';

type Props = {
  search: string;
  setSearch: (t: string) => void;
  handleSetTab: (t: number) => void;
  tab: number;
  libraryCount?: number;
  favoriteCount?: number;
  styles: ReturnType<typeof StyleSheet.create>;
};

const TABS = [
  { key: 0, label: 'คอร์สเรียนของฉัน' },
  { key: 1, label: 'รายการโปรด' },
];

/**
 * Tabs to switch between library courses and favorites, with a search box.
 *
 * Changes:
 * - Each tab shows its item count, so the user knows how many before tapping.
 * - The search box shows on both tabs. It used to hide on the favorites tab
 *   even though the filter still ran, so items seemed to vanish with no hint
 *   that a query was still active — and the layout jumped on every switch.
 */
const SectionHeader = ({
  search,
  setSearch,
  styles,
  handleSetTab,
  tab,
  libraryCount,
  favoriteCount,
}: Props) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const counts = [libraryCount, favoriteCount];

  const local = useMemo(
    () =>
      StyleSheet.create({
        segmentWrap: {
          paddingHorizontal: scale(sharedPaddingHorizontal),
          marginBottom: verticalScale(IS_TABLET ? 16 : 12),
        },
        segment: {
          flexDirection: 'row',
          backgroundColor: AppColors.surfaceSubtle,
          borderRadius: responsiveRadius(AppRadius.pill),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          padding: scale(4),
          gap: scale(4),
        },
        segmentItem: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: scale(6),
          paddingVertical: verticalScale(IS_TABLET ? 17 : 14),
          paddingHorizontal: scale(8),
          borderRadius: responsiveRadius(AppRadius.pill),
        },
        segmentItemActive: {
          backgroundColor: AppColors.primary,
        },
        segmentText: {
          color: AppColors.textTertiary,
          flexShrink: 1,
        },
        segmentTextActive: {
          color: AppColors.white,
        },
        countBadge: {
          minWidth: scale(20),
          paddingHorizontal: scale(6),
          paddingVertical: verticalScale(1),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        countBadgeActive: {
          backgroundColor: 'rgba(0,0,0,0.22)',
        },
        countText: {
          color: AppColors.textSecondary,
        },
        countTextActive: {
          color: AppColors.white,
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  return (
    <View style={styles.sectionHeader}>
      <View style={local.segmentWrap}>
        <View style={local.segment}>
          {TABS.map((item, index) => {
            const active = tab === item.key;
            const count = counts[index];

            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={PRESSED_OPACITY}
                style={[local.segmentItem, active && local.segmentItemActive]}
                onPress={() => handleSetTab(item.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={
                  count != null ? `${item.label} ${count} รายการ` : item.label
                }
              >
                <AppText
                  fontSize={AppFontSize.body}
                  fontWeight={active ? 'semiBold' : 'medium'}
                  numberOfLines={1}
                  style={active ? local.segmentTextActive : local.segmentText}
                >
                  {item.label}
                </AppText>

                {typeof count === 'number' && count > 0 ? (
                  <View
                    style={[local.countBadge, active && local.countBadgeActive]}
                  >
                    <AppText
                      fontSize={AppFontSize.overline}
                      fontWeight="semiBold"
                      style={active ? local.countTextActive : local.countText}
                    >
                      {count > 99 ? '99+' : count}
                    </AppText>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Search value={search} onChangeText={setSearch} />
    </View>
  );
};

// memo: prevent unnecessary re-renders when props are unchanged
export default React.memo(SectionHeader);
