import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IS_Android, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

type Props = {
  visible?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onPress?: () => void;
};

const ReviewComposer: React.FC<Props> = ({
  visible = true,
  placeholder = 'แสดงความคิดเห็น...',
  disabled = false,
  onPress,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: scale(sharedPaddingHorizontal),
          paddingTop: verticalScale(IS_TABLET ? 14 : 10),
          paddingBottom: verticalScale(IS_Android ? 10 : 22),
          backgroundColor: AppColors.secondary,
          borderTopWidth: 1,
          borderTopColor: AppColors.border,
        },
        fakeInput: {
          minHeight: verticalScale(IS_TABLET ? 56 : 44),
          borderRadius: responsiveRadius(AppRadius.md),
          backgroundColor: AppColors.backgroundInteractive,
          paddingHorizontal: scale(IS_TABLET ? 18 : 14),
          justifyContent: 'center',
        },
        fakePlaceholder: {
          color: AppColors.textTertiary,
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.fakeInput,
          { opacity: pressed ? PRESSED_OPACITY : 1 },
        ]}
      >
        <AppText fontSize={AppFontSize.body} style={styles.fakePlaceholder}>
          {placeholder}
        </AppText>
      </Pressable>
    </View>
  );
};

export default ReviewComposer;
