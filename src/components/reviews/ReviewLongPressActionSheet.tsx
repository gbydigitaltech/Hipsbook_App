import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

type ActionItem = {
  key: string;
  label: string;
  onPress?: () => void | Promise<void>;
  destructive?: boolean;
  disabled?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions?: ActionItem[];
  cancelText?: string;
  disabled?: boolean;
  closeOnPressAction?: boolean;
};

const { height: screenHeight } = Dimensions.get('window');

const ReviewLongPressActionSheet: React.FC<Props> = ({
  visible,
  onClose,
  title = 'จัดการความคิดเห็น',
  subtitle,
  actions = [],
  cancelText = 'ยกเลิก',
  disabled = false,
  closeOnPressAction = true,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [shouldRender, setShouldRender] = useState(visible);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
        setBusyKey(null);
      });
    }
  }, [visible, translateY, backdropOpacity]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        backdrop: {
          ...StyleSheet.absoluteFill,
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
          paddingHorizontal: scale(sharedPaddingHorizontal),
          paddingTop: verticalScale(IS_TABLET ? 18 : 14),
          paddingBottom: verticalScale(IS_TABLET ? 28 : 24),
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
          marginBottom: verticalScale(IS_TABLET ? 32 : 16),
        },
        title: {
          color: AppColors.white,
          textAlign: 'center',
        },
        subtitle: {
          color: AppColors.textSecondary,
          textAlign: 'center',
          marginTop: verticalScale(6),
        },
        actionList: {
          gap: verticalScale(IS_TABLET ? 14 : 10),
          paddingBottom: verticalScale(IS_TABLET ? 16 : 8),
        },
        actionButton: {
          minHeight: verticalScale(52),
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(IS_TABLET ? 18 : 14),
          borderRadius: responsiveRadius(AppRadius.md),
          backgroundColor: AppColors.backgroundInteractive,
        },
        actionButtonDisabled: {
          opacity: 0.5,
        },
        actionText: {
          color: AppColors.white,
          textAlign: 'center',
        },
        destructiveText: {
          color: AppColors.danger,
        },
        cancelButton: {
          marginTop: verticalScale(IS_TABLET ? 18 : 14),
          minHeight: verticalScale(52),
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(IS_TABLET ? 18 : 14),
          borderRadius: responsiveRadius(AppRadius.md),
          backgroundColor: AppColors.surfaceSubtle,
        },
        cancelText: {
          color: AppColors.white,
          textAlign: 'center',
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const handleClose = () => {
    if (disabled || busyKey) return;
    onClose();
  };

  const handlePressAction = async (item: ActionItem) => {
    if (disabled || busyKey || item.disabled) return;

    try {
      setBusyKey(item.key);
      await item.onPress?.();

      if (closeOnPressAction) {
        onClose();
      }
    } finally {
      setBusyKey(null);
    }
  };

  if (!shouldRender) return null;

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={styles.flex1} onPress={handleClose} />
        </Animated.View>

        <View style={styles.bottomWrap} pointerEvents="box-none">
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <AppText
                fontSize={AppFontSize.title}
                fontWeight="semiBold"
                style={styles.title}
              >
                {title}
              </AppText>

              {!!subtitle && (
                <AppText fontSize={AppFontSize.body} style={styles.subtitle}>
                  {subtitle}
                </AppText>
              )}
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.actionList}
            >
              {actions.map(item => {
                const isBusy = busyKey === item.key;
                const isDisabled = disabled || !!busyKey || item.disabled;

                return (
                  <Pressable
                    key={item.key}
                    onPress={() => handlePressAction(item)}
                    disabled={isDisabled}
                    style={[
                      styles.actionButton,
                      isDisabled && styles.actionButtonDisabled,
                    ]}
                  >
                    <AppText
                      fontSize={AppFontSize.subtitle}
                      fontWeight="medium"
                      style={[
                        styles.actionText,
                        item.destructive && styles.destructiveText,
                      ]}
                    >
                      {isBusy ? 'กำลังดำเนินการ...' : item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={handleClose}
              disabled={disabled || !!busyKey}
              style={[
                styles.cancelButton,
                (disabled || !!busyKey) && styles.actionButtonDisabled,
              ]}
            >
              <AppText
                fontSize={AppFontSize.subtitle}
                fontWeight="medium"
                style={styles.cancelText}
              >
                {cancelText}
              </AppText>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewLongPressActionSheet;
