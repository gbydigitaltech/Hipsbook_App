import React, { memo, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import VideoIcon from '../../assets/icons/course/VideoIcon';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppButtonHeight,
  AppFontSize,
  AppIconSize,
  AppRadius,
  PRESSED_OPACITY,
  adaptiveSize,
} from '../../styles/sharedstyles';
import AppButton from '../buttons/AppButton';
import AppText from '../texts/AppText';

type LessonActionButtonProps = {
  /** true: "start" button, false: buy button with the price */
  canStart: boolean;
  priceLabel: string;
  startLabel?: string;
  onPressStart?: () => void;
  onPressBuy?: () => void;
  /**
   * Render "start" as a plain view (when the whole card is already pressable,
   * e.g. in the classroom list) instead of its own touchable.
   */
  startAsView?: boolean;
};

/**
 * Action button for lesson cards (course detail + classroom).
 *
 * - Same height as other course-card buttons (AppButtonHeight.card).
 * - Minimum width 120 (phone) / 144 (tablet); grows with the label so long
 *   prices are not cut off, up to the full width of the text column.
 */
const LessonActionButton: React.FC<LessonActionButtonProps> = ({
  canStart,
  priceLabel,
  startLabel = 'เริ่มเรียน',
  onPressStart,
  onPressBuy,
  startAsView = false,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const styles = useMemo(() => {
    const height = verticalScale(AppButtonHeight.card);
    return StyleSheet.create({
      wrapper: {
        alignSelf: 'flex-end',
        minWidth: scale(adaptiveSize(120)),
        maxWidth: '100%',
        height,
      },
      startLearn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: scale(8),
        paddingHorizontal: scale(adaptiveSize(16)),
        backgroundColor: AppColors.backgroundInteractive,
        borderRadius: responsiveRadius(AppRadius.pill),
      },
      startLearnText: {
        color: AppColors.primary,
        flexShrink: 1,
      },
      buyContainer: {
        height,
        borderRadius: responsiveRadius(AppRadius.pill),
      },
      buyContent: {
        // Width follows the label (long prices grow the button)
        width: 'auto',
        height,
        minHeight: height,
        paddingVertical: 0,
        paddingHorizontal: scale(adaptiveSize(16)),
      },
    });
  }, [scale, verticalScale, responsiveRadius]);

  if (!canStart) {
    return (
      <View style={styles.wrapper}>
        <AppButton
          title={priceLabel}
          onPress={onPressBuy ?? (() => {})}
          fontSize={AppFontSize.caption}
          fullWidth
          containerStyle={styles.buyContainer}
          contentStyle={styles.buyContent}
        />
      </View>
    );
  }

  const content = (
    <>
      <VideoIcon size={AppIconSize.md} color={AppColors.primary} />
      <AppText
        style={styles.startLearnText}
        fontSize={AppFontSize.caption}
        numberOfLines={1}
      >
        {startLabel}
      </AppText>
    </>
  );

  return (
    <View style={styles.wrapper}>
      {startAsView ? (
        <View style={styles.startLearn}>{content}</View>
      ) : (
        <TouchableOpacity
          onPress={onPressStart}
          activeOpacity={PRESSED_OPACITY}
          style={styles.startLearn}
          accessibilityRole="button"
          accessibilityLabel={startLabel}
        >
          {content}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default memo(LessonActionButton);
