import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { log, logWarn } from '../../helpers/logger';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CommentIcon from '../../assets/icons/teacher/CommentIcon';
import PlayCircleSolidIcon from '../../assets/icons/teacher/PlayCircleSolidIcon';
import StarIcon from '../../assets/icons/teacher/StarIcon';
import AppBackground from '../../components/background/AppBackground';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import RoundProfileImage from '../../components/profiles/RoundProfileImage';
import HorizontalCourseSlider from '../../components/slides/courses/HorizontalCourseSlider';
import AppText from '../../components/texts/AppText';
import AppScrollView from '../../components/views/AppScrollView';
import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { useWhitelist } from '../../hooks/course/useWhitelist';
import { useUpdateLibraryStatus } from '../../hooks/library/useUpdateLibraryStatus';
import { useOrderCheckout } from '../../hooks/orders/useOrderCheckout';
import { useTeacherCourses } from '../../hooks/teachers/useTeacherCourses';
import { useTeacherDetail } from '../../hooks/teachers/useTeacherDetail';
import { useWhitelistStore } from '../../stores/whitelist';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  sharedPaddingHorizontal,
  thaiSafeLineHeight,
} from '../../styles/sharedstyles';
import { Course } from '../../types/data/courses/course.type';
import { AppStackParamList } from '../../types/data/navigation/navigation.types';
import { SliderCourseItem } from '../../types/ui/slides/course/course-slider.props';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

type TeacherProfileRouteProp = RouteProp<AppStackParamList, 'TeacherProfile'>;
type TeacherProfileNavProp = NativeStackNavigationProp<AppStackParamList>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const extractLibraryId = (res: any) => {
  const raw =
    res?.library_id ??
    res?.data?.library_id ??
    res?.result?.library_id ??
    res?.payload?.library_id;

  return typeof raw === 'string' ? raw.trim() : '';
};

const getExistingLibraryId = (course: SliderCourseItem) =>
  (course as any)?.library_id ?? (course as any)?.library?.id;

const TeacherProfileScreen = () => {
  const route = useRoute<TeacherProfileRouteProp>();
  const navigation = useNavigation<TeacherProfileNavProp>();
  const { id } = route.params ?? {};

  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const scrollRef = useRef<ScrollView | null>(null);

  const stripHtml = (html?: string | null) => {
    if (!html) return '';
    return html
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(ul|ol)[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const { updateLibraryStatus } = useUpdateLibraryStatus();
  const { updateWhitelist } = useWhitelist();
  const whitelistMap = useWhitelistStore(s => s.map);
  const { checkout } = useOrderCheckout();

  const [isProcessing, setIsProcessing] = useState(false);
  const isStartingRef = useRef(false);

  const handleCoursePressFromHook = useCallback(
    (courseId: string) => {
      navigation.navigate('CourseDetail', { id: courseId });
    },
    [navigation],
  );

  const handleCoursePress = useCallback(
    async (course: SliderCourseItem) => {
      const existingLibraryId = getExistingLibraryId(course);

      if (existingLibraryId) {
        await updateLibraryStatus({
          libraryId: existingLibraryId,
          status: 'SHOW',
        });

        navigation.navigate('ClassRoom', { id: existingLibraryId });
        return;
      }

      navigation.navigate('CourseDetail', { id: course.id });
    },
    [navigation, updateLibraryStatus],
  );

  const handleGoToLibrary = useCallback(
    async (course: SliderCourseItem) => {
      const existingLibraryId = getExistingLibraryId(course);

      if (!existingLibraryId) return;

      await updateLibraryStatus({
        libraryId: existingLibraryId,
        status: 'SHOW',
      });

      navigation.navigate('ClassRoom', { id: existingLibraryId });
    },
    [navigation, updateLibraryStatus],
  );

  const handleToggleWhitelist = useCallback(
    async (course: SliderCourseItem, next: boolean) => {
      await updateWhitelist(course as unknown as Course, next);
    },
    [updateWhitelist],
  );

  const handleStartLearn = useCallback(
    async (course: SliderCourseItem) => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      try {
        const existingLibraryId = getExistingLibraryId(course);

        if (existingLibraryId) {
          await updateLibraryStatus({
            libraryId: existingLibraryId,
            status: 'SHOW',
          });

          navigation.navigate('ClassRoom', { id: existingLibraryId });
          return;
        }

        setIsProcessing(true);

        const isInWhitelist =
          course.whitelist === true || !!whitelistMap[course.id];

        if (isInWhitelist) {
          await updateWhitelist(course as unknown as Course, false);
        }

        const courseIdStr = String(course.id);
        let libraryId = '';
        let lastRes: any = null;

        for (let attempt = 1; attempt <= 10; attempt++) {
          lastRes = await checkout({ course: [courseIdStr], lesson: [] });
          libraryId = extractLibraryId(lastRes);
          if (libraryId) break;
          await sleep(400);
        }

        if (!libraryId) {
          logWarn(
            'Teacher',
            '[TeacherProfile] missing library_id after retries',
            lastRes,
          );
          return;
        }

        navigation.navigate('ClassRoom', { id: libraryId });
      } catch (e) {
        log('Teacher', 'handleStartLearn error:', e);
      } finally {
        setIsProcessing(false);
        isStartingRef.current = false;
      }
    },
    [checkout, navigation, updateLibraryStatus, updateWhitelist, whitelistMap],
  );

  const { teacher, loadingTeacher } = useTeacherDetail({ teacherId: id });

  const {
    teacherCourses,
    loadingTeacherCourses,
    loadingMoreTeacherCourses,
    hasMore,
    loadMoreTeacherCourses,
  } = useTeacherCourses({
    teacherId: id,
    onCoursePress: handleCoursePressFromHook,
  });

  const teacherCoursesRecommend = useMemo(
    () =>
      teacherCourses.map(c => ({
        ...c,
        whitelist: whitelistMap[c.id] ?? !!c.whitelist,
        onPress: () => handleCoursePress(c),
        onToggleWhitelist: (next: boolean) => handleToggleWhitelist(c, next),
        onPressStartLearn: () => handleStartLearn(c),
        onPressBuy: () => handleStartLearn(c),
        onPressGoToLibrary: () => handleGoToLibrary(c),
      })),
    [
      teacherCourses,
      whitelistMap,
      handleCoursePress,
      handleToggleWhitelist,
      handleStartLearn,
      handleGoToLibrary,
    ],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screenContainer: { flex: 1 },

        screenHeader: {
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },

        profileCard: {
          backgroundColor: AppColors.surfaceSubtle,
          borderWidth: 1,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.lg),
          paddingVertical: verticalScale(IS_TABLET ? 24 : 20),
          paddingHorizontal: scale(IS_TABLET ? 26 : 22),
          marginTop: verticalScale(IS_TABLET ? 28 : 24),
          marginHorizontal: scale(sharedPaddingHorizontal),
        },
        profileSection: {
          justifyContent: 'center',
          alignItems: 'center',
          gap: verticalScale(IS_TABLET ? 12 : 10),
        },
        statsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: scale(IS_TABLET ? 24 : 18),
          marginTop: verticalScale(4),
        },
        statItem: {
          flexDirection: 'column',
          gap: verticalScale(3),
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: scale(64),
        },
        statNumberRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
        },
        statLabel: { color: AppColors.textTertiary },
        statDivider: {
          width: StyleSheet.hairlineWidth,
          height: verticalScale(30),
          backgroundColor: AppColors.border,
        },
        sectionHeadingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
        },
        accentBar: {
          width: scale(3),
          height: verticalScale(16),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.primary,
        },
        bodyText: {
          color: AppColors.textSecondary,
          lineHeight: thaiSafeLineHeight(verticalScale(IS_TABLET ? 26 : 22)),
        },
        educationSection: {
          marginTop: verticalScale(16),
          gap: verticalScale(IS_TABLET ? 10 : 8),
        },

        experienceCard: {
          backgroundColor: AppColors.surfaceSubtle,
          borderWidth: 1,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.lg),
          paddingVertical: verticalScale(IS_TABLET ? 24 : 20),
          paddingHorizontal: scale(IS_TABLET ? 26 : 22),
          marginTop: verticalScale(IS_IOS ? 24 : 20),
          gap: verticalScale(IS_TABLET ? 10 : 8),
          marginHorizontal: scale(sharedPaddingHorizontal),
        },

        coursesSection: {
          marginTop: verticalScale(24),
          marginBottom: verticalScale(20),
          gap: verticalScale(14),
        },
      }),
    [verticalScale, responsiveRadius, scale],
  );

  const teacherFullName =
    teacher && (teacher.first_name || teacher.last_name)
      ? `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim()
      : '—';

  const ratingText =
    teacher?.ratings_amount && teacher.ratings_amount > 0
      ? teacher.ratings_amount
      : 0;

  const reviewText =
    teacher?.review_amount && teacher.review_amount > 0
      ? teacher.review_amount
      : 0;

  const isLoading = loadingTeacher || loadingTeacherCourses;

  return (
    <View style={styles.screenContainer}>
      <AppBackground pointerEvents="none" />

      <AppScrollView
        ref={scrollRef}
        withHorizontalPadding={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppScreenHeader title="ผู้สอน" containerStyle={styles.screenHeader} />

        <View style={styles.profileCard}>
          <View style={styles.profileSection}>
            <RoundProfileImage
              size={IS_TABLET ? 104 : 88}
              source={
                teacher?.profile_image
                  ? { uri: teacher.profile_image }
                  : undefined
              }
            />

            <AppText fontWeight="medium" fontSize={AppFontSize.title}>
              {teacherFullName}
            </AppText>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statNumberRow}>
                  <StarIcon size={IS_TABLET ? 22 : 18} />
                  <AppText fontWeight="semiBold" fontSize={AppFontSize.subtitle}>
                    {ratingText}
                  </AppText>
                </View>
                <AppText fontSize={AppFontSize.caption} style={styles.statLabel}>
                  คะแนน
                </AppText>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={styles.statNumberRow}>
                  <CommentIcon size={IS_TABLET ? 22 : 18} />
                  <AppText fontWeight="semiBold" fontSize={AppFontSize.subtitle}>
                    {reviewText}
                  </AppText>
                </View>
                <AppText fontSize={AppFontSize.caption} style={styles.statLabel}>
                  รีวิว
                </AppText>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={styles.statNumberRow}>
                  <PlayCircleSolidIcon size={IS_TABLET ? 22 : 18} />
                  <AppText fontWeight="semiBold" fontSize={AppFontSize.subtitle}>
                    {teacher?.course_amount ?? 0}
                  </AppText>
                </View>
                <AppText fontSize={AppFontSize.caption} style={styles.statLabel}>
                  คอร์ส
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.educationSection}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.accentBar} />
              <AppText
                fontWeight="medium"
                style={{ color: AppColors.primary }}
                fontSize={AppFontSize.subtitle}
              >
                ประวัติการศึกษา
              </AppText>
            </View>
            <AppText fontSize={AppFontSize.body} style={styles.bodyText}>
              {stripHtml(teacher?.education) || 'ยังไม่มีข้อมูลประวัติการศึกษา'}
            </AppText>
          </View>
        </View>

        <View style={styles.experienceCard}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.accentBar} />
            <AppText
              fontWeight="medium"
              style={{ color: AppColors.primary }}
              fontSize={AppFontSize.subtitle}
            >
              ประสบการณ์
            </AppText>
          </View>
          <AppText fontSize={AppFontSize.body} style={styles.bodyText}>
            {stripHtml(teacher?.experience) || 'ยังไม่มีข้อมูลประสบการณ์'}
          </AppText>
        </View>

        <View style={styles.coursesSection}>
          <AppText
            fontWeight="medium"
            fontSize={AppFontSize.subtitle}
            style={{ marginHorizontal: scale(sharedPaddingHorizontal) }}
          >
            คอร์สที่สอนโดย{' '}
            <AppText
              fontWeight="medium"
              style={{ color: AppColors.primary }}
              fontSize={AppFontSize.subtitle}
            >
              {teacherFullName}
            </AppText>
          </AppText>

          <View>
            <HorizontalCourseSlider
              data={teacherCoursesRecommend}
              onReachEnd={loadMoreTeacherCourses}
              hasMore={hasMore}
              loadingMore={loadingMoreTeacherCourses}
              reachEndThreshold={1}
            />
          </View>
        </View>
      </AppScrollView>

      <AppLoadingOverlay
        visible={isLoading}
        message="กำลังโหลดข้อมูลผู้สอน..."
      />
      <AppLoadingOverlay visible={isProcessing} message="กำลังดำเนินการ" />
    </View>
  );
};

export default TeacherProfileScreen;
