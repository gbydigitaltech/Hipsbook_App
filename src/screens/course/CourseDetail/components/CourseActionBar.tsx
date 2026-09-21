import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../../../components/buttons/AppButton';
import AppText from '../../../../components/texts/AppText';
import { IS_TABLET } from '../../../../constants/platform';
import { useResponsive } from '../../../../helpers/responsive';
import { AppColors } from '../../../../styles/colors';
import {
  AppFontSize,
  sharedPaddingHorizontal,
} from '../../../../styles/sharedstyles';

type Props = {
  price: number;
  actionLabel: string;
  onPressAction: () => void;
  formatPrice: (value: number) => string;
};

const CourseActionBar: React.FC<Props> = ({
  price,
  actionLabel,
  onPressAction,
  formatPrice,
}) => {
  const { scale, verticalScale } = useResponsive();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: scale(16),
          backgroundColor: AppColors.surfaceSubtle,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: AppColors.border,
          paddingHorizontal: scale(sharedPaddingHorizontal),
          paddingTop: verticalScale(12),
          paddingBottom: verticalScale(12) + insets.bottom,
        },
        priceBlock: {
          flexShrink: 1,
          minWidth: 0,
        },
        priceLabel: {
          color: AppColors.textTertiary,
        },
        price: {
          color: AppColors.primary,
        },
        actionButton: {
          flexShrink: 0,
          minWidth: scale(IS_TABLET ? 220 : 170),
        },
      }),
    [scale, verticalScale, insets.bottom],
  );

  return (
    <View style={styles.bar}>
      <View style={styles.priceBlock}>
        <AppText fontSize={AppFontSize.caption} style={styles.priceLabel}>
          ราคาคอร์ส
        </AppText>
        <AppText
          fontSize={AppFontSize.h2}
          fontWeight="semiBold"
          style={styles.price}
          numberOfLines={1}
        >
          {price === 0 ? 'ฟรี' : `฿${formatPrice(price)}`}
        </AppText>
      </View>

      <AppButton
        title={actionLabel}
        containerStyle={styles.actionButton}
        fontSize={AppFontSize.subtitle}
        fullWidth={false}
        onPress={onPressAction}
      />
    </View>
  );
};

export default CourseActionBar;
