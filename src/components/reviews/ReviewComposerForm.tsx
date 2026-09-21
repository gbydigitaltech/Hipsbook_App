import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { IS_TABLET } from '../../constants/platform';
import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';
import AppButton from '../buttons/AppButton';
import PressableRating from '../ratings/PressableRating';
import AppText from '../texts/AppText';

const RATING_HINTS = ['', 'แย่', 'พอใช้', 'ปานกลาง', 'ดี', 'ดีมาก'];

type Props = {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  initialRating?: number;
  initialText?: string;
  showRating?: boolean;
  requireRating?: boolean;
  requireText?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmit: (payload: { rating: number; text: string }) => void | Promise<void>;
  onCancel?: () => void;
};

/**
 * Review compose/edit form (content only, no modal of its own).
 * Embedded in a bottom sheet to replace the comments list in place.
 */
const ReviewComposerForm: React.FC<Props> = ({
  title = 'แชร์ประสบการณ์การเรียนรู้ของคุณ',
  subtitle = 'รีวิวของคุณช่วยให้ผู้เรียนคนอื่นตัดสินใจได้ง่ายขึ้น',
  placeholder = 'แสดงความคิดเห็น...',
  submitLabel = 'เขียนรีวิว',
  cancelLabel = 'ย้อนกลับ',
  initialRating = 0,
  initialText = '',
  showRating = true,
  requireRating = false,
  requireText = true,
  disabled = false,
  autoFocus = true,
  onSubmit,
  onCancel,
}) => {
  const { scale, verticalScale, responsiveRadius, moderateScale } =
    useResponsive();

  const [rating, setRating] = useState<number>(initialRating);
  const [text, setText] = useState<string>(initialText);
  const [submitting, setSubmitting] = useState(false);

  const fontSize = IS_TABLET ? 20 : 16;

  const canSubmit = useMemo(() => {
    if (disabled) return false;
    const hasText = text.trim().length > 0;
    const hasRating = rating > 0;
    if (requireText && !hasText) return false;
    if (requireRating && !hasRating) return false;
    return true;
  }, [disabled, text, rating, requireRating, requireText]);

  const handleSubmit = async () => {
    if (!canSubmit || disabled || submitting) return;
    try {
      setSubmitting(true);
      await onSubmit({ rating, text: text.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: verticalScale(18),
        },
        title: { color: AppColors.white, textAlign: 'center' },
        subtitle: {
          color: AppColors.textSecondary,
          textAlign: 'center',
          marginTop: verticalScale(6),
          paddingHorizontal: scale(10),
        },
        ratingWrap: {
          alignItems: 'center',
          marginTop: verticalScale(4),
          marginBottom: verticalScale(IS_TABLET ? 18 : 14),
        },
        ratingLabel: {
          color: AppColors.white,
          marginBottom: verticalScale(IS_TABLET ? 14 : 12),
        },
        ratingHint: {
          color: AppColors.primary,
          marginTop: verticalScale(IS_TABLET ? 12 : 10),
        },
        inputLabel: {
          color: AppColors.white,
          marginBottom: verticalScale(IS_TABLET ? 10 : 8),
        },
        input: {
          minHeight: verticalScale(IS_TABLET ? 150 : 124),
          maxHeight: verticalScale(IS_TABLET ? 180 : 150),
          paddingHorizontal: scale(IS_TABLET ? 18 : 14),
          paddingVertical: verticalScale(IS_TABLET ? 12 : 10),
          borderRadius: responsiveRadius(AppRadius.md),
          borderWidth: 1,
          borderColor: AppColors.border,
          backgroundColor: AppColors.surface,
          color: AppColors.white,
          fontFamily: getFontFamily('regular'),
          fontSize: moderateScale(fontSize, 0.5),
          textAlignVertical: 'top',
        },
        actionsRow: {
          flexDirection: 'row',
          gap: scale(IS_TABLET ? 14 : 12),
          marginTop: verticalScale(IS_TABLET ? 22 : 18),
        },
        backBtn: { flex: 1 },
        submitBtn: { flex: 1.6 },
      }),
    [scale, verticalScale, responsiveRadius, moderateScale, fontSize],
  );

  return (
    <View>
      <View style={styles.header}>
        <AppText
          fontSize={AppFontSize.title}
          fontWeight="semiBold"
          style={styles.title}
        >
          {title}
        </AppText>
        {!!subtitle && (
          <AppText fontSize={AppFontSize.caption} style={styles.subtitle}>
            {subtitle}
          </AppText>
        )}
      </View>

      {showRating && (
        <View style={styles.ratingWrap}>
          <AppText
            fontSize={AppFontSize.body}
            fontWeight="medium"
            style={styles.ratingLabel}
          >
            ให้คะแนนคอร์สนี้
          </AppText>

          <PressableRating
            value={rating}
            disabled={disabled || submitting}
            onChange={setRating}
            size={IS_TABLET ? 40 : 34}
            spacing={IS_TABLET ? 12 : 10}
          />

          <AppText
            fontSize={AppFontSize.caption}
            fontWeight="medium"
            style={[styles.ratingHint, { opacity: rating > 0 ? 1 : 0 }]}
          >
            {RATING_HINTS[rating] || '​'}
          </AppText>
        </View>
      )}

      <AppText
        fontSize={AppFontSize.body}
        fontWeight="medium"
        style={styles.inputLabel}
      >
        ความคิดเห็นของคุณ
      </AppText>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={AppColors.textTertiary}
        editable={!disabled && !submitting}
        multiline
        autoFocus={autoFocus}
        style={styles.input}
        maxFontSizeMultiplier={1.2}
        allowFontScaling={false}
      />

      <View style={styles.actionsRow}>
        <AppButton
          title={cancelLabel}
          containerStyle={styles.backBtn}
          onPress={onCancel}
          useGradient={false}
          backgroundColor={AppColors.backgroundInteractive}
          disabled={submitting}
          fontSize={AppFontSize.subtitle}
        />

        <AppButton
          title={submitting ? 'กำลังส่ง...' : submitLabel}
          containerStyle={styles.submitBtn}
          onPress={handleSubmit}
          disabled={!canSubmit || disabled || submitting}
          fontSize={AppFontSize.subtitle}
        />
      </View>
    </View>
  );
};

export default ReviewComposerForm;
