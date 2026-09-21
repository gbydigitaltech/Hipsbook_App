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

import { Ionicons } from '@react-native-vector-icons/ionicons';
import AppText from '../../../components/texts/AppText';
import { IS_TABLET } from '../../../constants/platform';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';
import type { LessonItem } from '../ClassroomScreen';
import {
  AppFontSize,
  AppRadius,
  thaiSafeLineHeight,
} from '../../../styles/sharedstyles';

type Props = {
  visible: boolean;
  onClose: () => void;
  courseTitle?: string;
  lesson?: LessonItem | null;
  onOpenPdf?: (url: string) => void;
};

const { height: screenHeight } = Dimensions.get('window');

const stripHtml = (html?: string) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

const formatDuration = (ms?: number) => {
  const n = typeof ms === 'number' ? ms : Number(ms) || 0;
  const totalSec = Math.floor(n / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const LessonDetailSheet: React.FC<Props> = ({
  visible,
  onClose,
  courseTitle,
  lesson,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

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
          paddingHorizontal: scale(18),
          paddingTop: verticalScale(14),
          paddingBottom: verticalScale(24),
          minHeight: '50%',
          maxHeight: '80%',
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
          alignItems: 'flex-start',
          justifyContent: 'center',
          marginBottom: verticalScale(IS_TABLET ? 20 : 16),
        },
        title: {
          color: AppColors.white,
          textAlign: 'left',
        },
        contentContainer: {
          paddingBottom: verticalScale(IS_TABLET ? 12 : 8),
        },
        coursePill: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: scale(6),
          paddingHorizontal: scale(12),
          paddingVertical: verticalScale(6),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.primary,
          marginBottom: verticalScale(IS_TABLET ? 14 : 12),
        },
        coursePillText: {
          color: AppColors.white,
        },
        lessonTitle: {
          color: AppColors.white,
          marginBottom: verticalScale(IS_TABLET ? 16 : 12),
        },
        metaRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: scale(8),
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          paddingHorizontal: scale(12),
          paddingVertical: verticalScale(7),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.backgroundInteractive,
        },
        chipText: {
          color: AppColors.textSecondary,
        },
        divider: {
          height: 1,
          backgroundColor: AppColors.surfaceSubtle,
          marginVertical: verticalScale(IS_TABLET ? 22 : 18),
        },
        sectionLabel: {
          color: AppColors.white,
          marginBottom: verticalScale(10),
        },
        descriptionText: {
          color: AppColors.textSecondary,
          lineHeight: thaiSafeLineHeight(verticalScale(24)),
        },
        emptyText: {
          color: AppColors.textTertiary,
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  if (!shouldRender) return null;

  const title = lesson?.label ?? '';
  const groupTitle = lesson?.groupTitle ?? '';
  const desc = stripHtml(lesson?.description);
  const durationLabel = lesson?.duration ? formatDuration(lesson.duration) : '';

  return (
    <Modal
      transparent
      visible={shouldRender}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={styles.flex1} onPress={onClose} />
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
                รายละเอียดบทเรียน
              </AppText>
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
            >
              {!!courseTitle && (
                <View style={styles.coursePill}>
                  <Ionicons
                    name="book-outline"
                    size={IS_TABLET ? 16 : 14}
                    color={AppColors.white}
                  />
                  <AppText
                    fontSize={AppFontSize.body}
                    fontWeight="medium"
                    style={styles.coursePillText}
                    numberOfLines={1}
                  >
                    {courseTitle}
                  </AppText>
                </View>
              )}

              <AppText
                fontSize={AppFontSize.h2}
                fontWeight="semiBold"
                style={styles.lessonTitle}
              >
                {title}
              </AppText>

              {(!!groupTitle || !!durationLabel) && (
                <View style={styles.metaRow}>
                  {!!groupTitle && (
                    <View style={styles.chip}>
                      <Ionicons
                        name="albums-outline"
                        size={IS_TABLET ? 16 : 14}
                        color={AppColors.textSecondary}
                      />
                      <AppText
                        fontSize={AppFontSize.body}
                        style={styles.chipText}
                      >
                        {groupTitle}
                      </AppText>
                    </View>
                  )}

                  {!!durationLabel && (
                    <View style={styles.chip}>
                      <Ionicons
                        name="time-outline"
                        size={IS_TABLET ? 16 : 14}
                        color={AppColors.textSecondary}
                      />
                      <AppText
                        fontSize={AppFontSize.body}
                        style={styles.chipText}
                      >
                        {durationLabel} นาที
                      </AppText>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.divider} />

              <AppText
                fontSize={AppFontSize.subtitle}
                fontWeight="medium"
                style={styles.sectionLabel}
              >
                รายละเอียด
              </AppText>

              {desc ? (
                <AppText
                  fontSize={AppFontSize.body}
                  style={styles.descriptionText}
                >
                  {desc}
                </AppText>
              ) : (
                <AppText fontSize={AppFontSize.body} style={styles.emptyText}>
                  ไม่มีรายละเอียดบทเรียน
                </AppText>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default LessonDetailSheet;
