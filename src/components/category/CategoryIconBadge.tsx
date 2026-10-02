import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Fallback icons for categories whose API `icon` is null. Drawn in the same
 * white line style as the API icons. Unknown categories get a generic icon.
 */
const FALLBACK_ICONS: Record<string, IoniconName> = {
  '050ee12f-9645-4833-95e6-dcbcae06c346': 'ribbon-outline', // Masterclass
  '7be46a6d-3153-4759-ac40-7acac1ef7843': 'people-outline', // สมาคมเมโลเดียน
  '10b02053-6a88-4e2c-9b7e-f8a68fae9b49': 'happy-outline', // หลักสูตรดนตรีปฐมวัย
};

export const categoryFallbackIcon = (categoryId?: string): IoniconName =>
  (categoryId && FALLBACK_ICONS[categoryId]) || 'albums-outline';

type Props = {
  /** Category icon from the API (white glyph PNG, same as the website) */
  uri?: string | null;
  /** Used to pick a fallback icon when `uri` is empty */
  categoryId?: string;
  /** Icon size before scaling (default 18) */
  size?: number;
  /** @deprecated kept for callers; icons are white on every chip */
  selected?: boolean;
};

/** Category icon: API image, or a fallback Ionicon in the same white style */
const CategoryIconBadge: React.FC<Props> = ({ uri, categoryId, size = 18 }) => {
  const { scale } = useResponsive();
  const d = scale(size);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        // Plain icon, no background circle
        badge: {
          width: d,
          height: d,
          alignItems: 'center',
          justifyContent: 'center',
        },
        image: { width: d, height: d },
      }),
    [d],
  );

  return (
    <View style={styles.badge}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      ) : (
        <Ionicons
          name={categoryFallbackIcon(categoryId)}
          size={Math.round(d * 0.9)}
          color={AppColors.white}
        />
      )}
    </View>
  );
};

export default React.memo(CategoryIconBadge);
