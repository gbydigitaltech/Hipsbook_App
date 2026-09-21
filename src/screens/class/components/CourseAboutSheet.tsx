import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import RoundProfileImage from '../../../components/profiles/RoundProfileImage';
import AppText from '../../../components/texts/AppText';
import { IS_TABLET } from '../../../constants/platform';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';
import { AppFontSize, AppRadius } from '../../../styles/sharedstyles';

type Props = {
  visible: boolean;
  onClose: () => void;
  course?: any;
  teachers?: any[];
  teachersLoading?: boolean;
};

const { height: screenHeight } = Dimensions.get('window');

const formatDurationTH = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(num) || num <= 0) return '-';

  const totalSec = num >= 1000 ? Math.floor(num / 1000) : Math.floor(num);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ชม.`);
  if (m > 0) parts.push(`${m} นาที`);
  if (parts.length === 0 && s > 0) parts.push(`${s} วิ.`);

  return parts.join(' ');
};

const CourseAboutSheet: React.FC<Props> = ({
  visible,
  onClose,
  course,
  teachers,
  teachersLoading,
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
          textAlign: 'center',
        },
        contentContainer: {
          paddingBottom: verticalScale(8),
        },
        infoWrap: {
          marginTop: verticalScale(4),
        },
        row: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        rowSpacing: {
          height: verticalScale(12),
        },
        valueText: {
          color: AppColors.white,
        },
        sectionWrap: {
          marginTop: verticalScale(32),
          marginBottom: verticalScale(8),
        },
        teacherContainer: {
          flexDirection: 'column',
        },
        teacherContainerSpacing: {
          marginBottom: verticalScale(12),
        },
        teacherHeader: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        teacherInfo: {
          marginLeft: scale(12),
          flex: 1,
        },
        loading: {
          marginVertical: verticalScale(20),
        },
        descriptionWrap: {
          marginBottom: verticalScale(20),
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  if (!shouldRender) return null;

  const levelText = course?.level || '-';
  const durationText = formatDurationTH(course?.duration);
  const lessonAmount = course?.lesson_amount || 0;
  const learnerAmount = course?.learners_amount || 0;
  const subDescription = course?.sub_description || '-';

  return (
    <Modal
      transparent
      animationType="none"
      visible={shouldRender}
      onRequestClose={onClose}
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
                เกี่ยวกับหลักสูตร
              </AppText>
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
            >
              <View style={styles.infoWrap}>
                <View style={styles.row}>
                  <AppText fontSize={AppFontSize.subtitle}>ระดับ</AppText>
                  <AppText
                    fontSize={AppFontSize.subtitle}
                    style={styles.valueText}
                  >
                    {levelText}
                  </AppText>
                </View>

                <View style={styles.rowSpacing} />

                <View style={styles.row}>
                  <AppText fontSize={AppFontSize.subtitle}>
                    ระยะเวลาเรียนทั้งหมด
                  </AppText>
                  <AppText
                    fontSize={AppFontSize.subtitle}
                    style={styles.valueText}
                  >
                    {durationText}
                  </AppText>
                </View>

                <View style={styles.rowSpacing} />

                <View style={styles.row}>
                  <AppText fontSize={AppFontSize.subtitle}>บทเรียน</AppText>
                  <AppText
                    fontSize={AppFontSize.subtitle}
                    style={styles.valueText}
                  >
                    {lessonAmount} บทเรียน
                  </AppText>
                </View>

                <View style={styles.rowSpacing} />

                <View style={styles.row}>
                  <AppText fontSize={AppFontSize.subtitle}>
                    จำนวนผู้เรียน
                  </AppText>
                  <AppText
                    fontSize={AppFontSize.subtitle}
                    style={styles.valueText}
                  >
                    {learnerAmount} คน
                  </AppText>
                </View>

                <View style={styles.sectionWrap}>
                  <AppText fontSize={AppFontSize.title} fontWeight="medium">
                    ผู้สอน
                  </AppText>
                </View>

                {teachersLoading ? (
                  <ActivityIndicator
                    color={AppColors.primary}
                    style={styles.loading}
                  />
                ) : (
                  teachers?.map((teacher, index) => {
                    const fullName = `${teacher.first_name ?? ''} ${
                      teacher.last_name ?? ''
                    }`.trim();
                    const isLast = index === (teachers?.length ?? 0) - 1;

                    return (
                      <View
                        key={teacher.id || index}
                        style={[
                          styles.teacherContainer,
                          !isLast && styles.teacherContainerSpacing,
                        ]}
                      >
                        <View style={styles.teacherHeader}>
                          <RoundProfileImage
                            size={IS_TABLET ? 56 : 28}
                            name={fullName}
                            source={
                              teacher.profile_image
                                ? { uri: teacher.profile_image }
                                : undefined
                            }
                            disabled
                          />
                          <View style={styles.teacherInfo}>
                            <AppText fontSize={AppFontSize.subtitle}>
                              {fullName}
                            </AppText>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}

                <View style={styles.sectionWrap}>
                  <AppText fontSize={AppFontSize.title} fontWeight="medium">
                    คอร์สเรียนได้อะไรบ้าง?
                  </AppText>
                </View>

                <View style={styles.descriptionWrap}>
                  <AppText fontSize={AppFontSize.body}>
                    {subDescription}
                  </AppText>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default CourseAboutSheet;
