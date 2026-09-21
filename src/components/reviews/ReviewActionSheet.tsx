import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import AppButton from '../buttons/AppButton';
import PressableRating from '../ratings/PressableRating';
import AppText from '../texts/AppText';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
  fontSize?: number;
  fontWeight?: Parameters<typeof getFontFamily>[0];
  initialRating?: number;
  initialText?: string;
  onPressBack?: () => void;
  onPressSubmit?: (payload: {
    rating: number;
    text: string;
  }) => void | Promise<void>;
  showRating?: boolean;
  requireRating?: boolean;
  requireText?: boolean;
  submitLabel?: string;
};

const { height: screenHeight } = Dimensions.get('window');

const RATING_HINTS = ['', 'แย่', 'พอใช้', 'ปานกลาง', 'ดี', 'ดีมาก'];

const ReviewActionSheet: React.FC<Props> = ({
  visible,
  onClose,
  title = 'แชร์ประสบการณ์การเรียนรู้ของคุณ',
  placeholder = 'แสดงความคิดเห็น...',
  disabled = false,
  fontSize = IS_TABLET ? 20 : 16,
  fontWeight = 'regular',
  initialRating = 0,
  initialText = '',
  onPressBack,
  onPressSubmit,
  showRating = true,
  requireRating = false,
  requireText = true,
  submitLabel = 'เขียนรีวิว',
}) => {
  const { scale, verticalScale, responsiveRadius, moderateScale } =
    useResponsive();

  const [rating, setRating] = useState<number>(initialRating);
  const [text, setText] = useState<string>(initialText);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [shouldRender, setShouldRender] = useState(visible);
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRating(initialRating);
      setText(initialText);
    }
  }, [visible, initialRating, initialText]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKeyboardHeight(e?.endCoordinates?.height ?? 0),
    );

    const hideSub = Keyboard.addListener(
      IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Keyboard.dismiss();

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
        setKeyboardHeight(0);
      });
    }
  }, [visible, translateY, backdropOpacity]);

  const canSubmit = useMemo(() => {
    if (disabled) return false;

    const hasText = text.trim().length > 0;
    const hasRating = rating > 0;

    if (requireText && !hasText) return false;
    if (requireRating && !hasRating) return false;

    return true;
  }, [disabled, text, rating, requireRating, requireText]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        keyboardAvoid: {
          flex: 1,
        },
        container: {
          flex: 1,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: AppColors.scrim,
        },
        flex1: {
          flex: 1,
        },
        bottomWrap: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: AppColors.sheet,
          borderTopWidth: 1,
          borderColor: AppColors.border,
          borderTopLeftRadius: responsiveRadius(AppRadius.sheet),
          borderTopRightRadius: responsiveRadius(AppRadius.sheet),
          paddingHorizontal: scale(18),
          paddingTop: verticalScale(14),
          paddingBottom: verticalScale(24),
          maxHeight: '80%',
        },
        keyboardWrap: {
          width: '100%',
        },
        handle: {
          alignSelf: 'center',
          width: scale(IS_TABLET ? 54 : 44),
          height: verticalScale(5),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.surfaceStrong,
          marginBottom: verticalScale(IS_TABLET ? 36 : 30),
        },
        header: {
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: verticalScale(18),
        },
        title: {
          color: AppColors.white,
          textAlign: 'center',
        },
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
          fontFamily: getFontFamily(fontWeight),
          fontSize: moderateScale(fontSize, 0.5),
          textAlignVertical: 'top',
          includeFontPadding: false,
        },
        actionsRow: {
          flexDirection: 'row',
          gap: scale(IS_TABLET ? 14 : 12),
          marginTop: verticalScale(IS_TABLET ? 22 : 18),
          marginBottom: verticalScale(IS_TABLET ? 10 : 8),
        },
        backBtn: { flex: 1 },
        submitBtn: { flex: 1.6 },
      }),
    [
      scale,
      verticalScale,
      responsiveRadius,
      moderateScale,
      fontSize,
      fontWeight,
    ],
  );

  const handleClose = () => {
    if (submitting) return;
    Keyboard.dismiss();
    onClose();
  };

  const handleBackdropPress = () => {
    if (keyboardHeight > 0) {
      Keyboard.dismiss();
      return;
    }

    handleClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || disabled || submitting) return;

    try {
      setSubmitting(true);
      await onPressSubmit?.({
        rating,
        text: text.trim(),
      });
      Keyboard.dismiss();
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (submitting) return;
    Keyboard.dismiss();
    onPressBack?.();
    onClose();
  };

  if (!shouldRender) return null;

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <Animated.View
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            >
              <Pressable style={styles.flex1} onPress={handleBackdropPress} />
            </Animated.View>

            <View
              style={[styles.bottomWrap, { paddingBottom: keyboardHeight }]}
              pointerEvents="box-none"
            >
              <Animated.View
                style={[styles.sheet, { transform: [{ translateY }] }]}
              >
                <View style={styles.keyboardWrap}>
                  <View style={styles.handle} />

                  <View style={styles.header}>
                    <AppText
                      fontSize={AppFontSize.title}
                      fontWeight="semiBold"
                      style={styles.title}
                    >
                      {title}
                    </AppText>
                    <AppText
                      fontSize={AppFontSize.caption}
                      style={styles.subtitle}
                    >
                      รีวิวของคุณช่วยให้ผู้เรียนคนอื่นตัดสินใจได้ง่ายขึ้น
                    </AppText>
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
                        style={[
                          styles.ratingHint,
                          { opacity: rating > 0 ? 1 : 0 },
                        ]}
                      >
                        {RATING_HINTS[rating] || '\u200b'}
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
                    autoFocus
                    style={styles.input}
                    maxFontSizeMultiplier={1.2}
                    allowFontScaling={false}
                  />

                  <View style={styles.actionsRow}>
                    <AppButton
                      title="ย้อนกลับ"
                      containerStyle={styles.backBtn}
                      onPress={handleBack}
                      useGradient={false}
                      backgroundColor={AppColors.backgroundInteractive}
                      disabled={disabled || submitting}
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
              </Animated.View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ReviewActionSheet;
