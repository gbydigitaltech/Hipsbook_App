import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { log, logWarn } from '../../helpers/logger';
import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import SearchIcon from '../../assets/icons/search/SearchIcon';
import AppBackground from '../../components/background/AppBackground';
import AppBanner from '../../components/banners/AppBanner';
import AppIconBadgeButton from '../../components/buttons/AppIconBadgeButton';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import RoundProfileImage from '../../components/profiles/RoundProfileImage';
import AppTeacherAvatarSlider, {
  TeacherAvatarItem,
} from '../../components/slides/teachers/AppTeacherAvatarSlider';
import AppSectionHeader from '../../components/sections/AppSectionHeader';
import AppText from '../../components/texts/AppText';
import AppScrollView from '../../components/views/AppScrollView';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { useBanner } from '../../hooks/banner/useBanner';
import { useRecommendedCourses } from '../../hooks/course/useRecommendedCourses';
import { useWhitelist } from '../../hooks/course/useWhitelist';
import { useUpdateLibraryStatus } from '../../hooks/library/useUpdateLibraryStatus';
import { useOrderCheckout } from '../../hooks/orders/useOrderCheckout';
import { useRecommendedTeachers } from '../../hooks/teachers/useRecommendedTeachers';
import { useProfile } from '../../stores/profile';
import { useWhitelistStore } from '../../stores/whitelist';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  sharedPaddingHorizontal,
  sharedTopSpace,
} from '../../styles/sharedstyles';
import { Course } from '../../types/data/courses/course.type';
import {
  AppStackParamList,
  BottomTabParamList,
} from '../../types/data/navigation/navigation.types';
import { SliderCourseItem } from '../../types/ui/slides/course/course-slider.props';
import CategoryQuickNav, { QuickNavItem } from './components/CategoryQuickNav';
import HomeCourseSection from './components/HomeCourseSection';

type HomeBottomNavProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;
type HomeStackNavProp = NativeStackNavigationProp<AppStackParamList>;
type HomeNavigationProp = CompositeNavigationProp<
  HomeBottomNavProp,
  HomeStackNavProp
>;

const HITSONG_CATEGORY_ID = 'd8d7d43b-1ce0-42d2-b68b-006762a7a8c0';
const MUSIC_CATEGORY_ID = '4627985a-c645-4cda-ab04-edb774485a5d';
const FOOD_CATEGORY_ID = '593f72b4-e6df-4a65-9bbe-86f0b495690c';
const GENERAL_SUBJECT_CATEGORY_ID = '30982c38-59ad-41fd-b4d1-70483443cc98';
const SHORT_COURSE_CATEGORY_ID = '8fa21636-24ed-4ef3-828c-ad3bade07ef9';
const MUSIC_DEV_CATEGORY_ID = '04712b55-5a76-4fde-8852-9587270e9e19';
const MASTERCLASS_CATEGORY_ID = '050ee12f-9645-4833-95e6-dcbcae06c346';
const MELODEON_CATEGORY_ID = '7be46a6d-3153-4759-ac40-7acac1ef7843';

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

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const scrollRef = useRef<any>(null);

  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const profile = useProfile(s => s.profile);
  const isFetchingProfile = useProfile(s => s.isFetchingProfile);
  const whitelistMap = useWhitelistStore(s => s.map);

  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const isStartingRef = useRef(false);

  const { updateWhitelist } = useWhitelist();
  const { updateLibraryStatus } = useUpdateLibraryStatus();
  const { checkout } = useOrderCheckout();
  const { banners } = useBanner();
  const { recommendedTeachers } = useRecommendedTeachers({ limit: 50 });

  const bannerPairs = useMemo(
    () =>
      banners.map(b => ({
        source: { uri: b.imageUrl },
        link: b.link,
      })),
    [banners],
  );

  const bannerSources = useMemo(
    () => bannerPairs.map(b => b.source),
    [bannerPairs],
  );

  const bannerLinks = useMemo(
    () => bannerPairs.map(b => b.link),
    [bannerPairs],
  );

  const hitsongFilters = useMemo(
    () => ({
      category: HITSONG_CATEGORY_ID,
      limit: 10,
    }),
    [],
  );

  const musicFilters = useMemo(
    () => ({
      category: MUSIC_CATEGORY_ID,
      limit: 10,
    }),
    [],
  );

  const foodFilters = useMemo(
    () => ({
      category: FOOD_CATEGORY_ID,
      limit: 10,
    }),
    [],
  );

  const generalSubjectFilters = useMemo(
    () => ({
      category: GENERAL_SUBJECT_CATEGORY_ID,
      limit: 10,
    }),
    [],
  );

  const shortCourseFilters = useMemo(
    () => ({
      category: SHORT_COURSE_CATEGORY_ID,
      limit: 10,
    }),
    [],
  );

  const musicDevFilters = useMemo(
    () => ({ category: MUSIC_DEV_CATEGORY_ID, limit: 10 }),
    [],
  );

  const masterclassFilters = useMemo(
    () => ({ category: MASTERCLASS_CATEGORY_ID, limit: 10 }),
    [],
  );

  const melodeonFilters = useMemo(
    () => ({ category: MELODEON_CATEGORY_ID, limit: 10 }),
    [],
  );

  const handleCoursePress = useCallback(
    (course: SliderCourseItem) => {
      navigation.navigate('CourseDetail', { id: course.id });
    },
    [navigation],
  );

  const handleTeacherPress = useCallback(
    (teacher: TeacherAvatarItem) => {
      navigation.navigate('TeacherProfile', { id: teacher.id });
    },
    [navigation],
  );

  const handleSeeAllCourses = useCallback(
    (categoryId: string, title?: string) => {
      navigation.navigate('Course', {
        initialCategoryIds: [categoryId],
        initialTitle: title,
      });
    },
    [navigation],
  );

  /** Quick shortcuts to each category's course list. */
  const quickNavItems = useMemo<QuickNavItem[]>(
    () => [
      {
        key: 'hitsong',
        label: 'Hitsong',
        icon: 'flame-outline',
        onPress: () => handleSeeAllCourses(HITSONG_CATEGORY_ID, 'Hitsong'),
      },
      {
        key: 'music',
        label: 'ดนตรี',
        icon: 'musical-notes-outline',
        onPress: () => handleSeeAllCourses(MUSIC_CATEGORY_ID, 'ดนตรี'),
      },
      {
        key: 'food',
        label: 'อาหาร',
        icon: 'restaurant-outline',
        onPress: () => handleSeeAllCourses(FOOD_CATEGORY_ID, 'อาหาร'),
      },
      {
        key: 'general',
        label: 'วิชาเรียนทั่วไป',
        icon: 'school-outline',
        onPress: () =>
          handleSeeAllCourses(GENERAL_SUBJECT_CATEGORY_ID, 'วิชาเรียนทั่วไป'),
      },
      {
        key: 'short',
        label: 'หลักสูตรระยะสั้น',
        icon: 'time-outline',
        onPress: () =>
          handleSeeAllCourses(SHORT_COURSE_CATEGORY_ID, 'หลักสูตรระยะสั้น'),
      },
      {
        key: 'musicDev',
        label: 'ศูนย์ส่งเสริมพัฒนาดนตรี',
        icon: 'headset-outline',
        onPress: () =>
          handleSeeAllCourses(
            MUSIC_DEV_CATEGORY_ID,
            'ศูนย์ส่งเสริมพัฒนาดนตรี',
          ),
      },
      {
        key: 'masterclass',
        label: 'Masterclass',
        icon: 'ribbon-outline',
        onPress: () =>
          handleSeeAllCourses(MASTERCLASS_CATEGORY_ID, 'Masterclass'),
      },
      {
        key: 'melodeon',
        label: 'สมาคมเมโลเดียน',
        icon: 'people-outline',
        onPress: () =>
          handleSeeAllCourses(MELODEON_CATEGORY_ID, 'สมาคมเมโลเดียน'),
      },
    ],
    [handleSeeAllCourses],
  );

  const handleToggleWhitelist = useCallback(
    async (course: Course, next: boolean) => {
      await updateWhitelist(course, next);
    },
    [updateWhitelist],
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

  const handleCheckoutCourse = useCallback(
    async (course: SliderCourseItem) => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      try {
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
            'Home',
            '[HomeScreen] missing library_id after retries',
            lastRes,
          );
          return;
        }

        navigation.navigate('ClassRoom', { id: libraryId });
      } catch (e) {
        log('Home', 'handleCheckoutCourse error:', e);
      } finally {
        setIsProcessing(false);
        isStartingRef.current = false;
      }
    },
    [checkout, navigation, updateWhitelist, whitelistMap],
  );

  const handleStartLearn = useCallback(
    async (course: SliderCourseItem) => {
      await handleCheckoutCourse(course);
    },
    [handleCheckoutCourse],
  );

  const handleBuyCourse = useCallback(
    async (course: SliderCourseItem) => {
      await handleCheckoutCourse(course);
    },
    [handleCheckoutCourse],
  );

  const runAsync = useCallback((task: Promise<unknown>, label: string) => {
    task.catch(error => {
      log('Home', `${label} error:`, error);
    });
  }, []);

  const {
    recommendedCourses: rawHitsongCourses,
    loadingRecommendedCourses: isHitsongLoading,
  } = useRecommendedCourses({
    onCoursePress: handleCoursePress,
    filters: hitsongFilters,
  });

  const {
    recommendedCourses: rawMusicCourses,
    loadingRecommendedCourses: isMusicLoading,
  } = useRecommendedCourses({
    onCoursePress: handleCoursePress,
    filters: musicFilters,
  });

  const {
    recommendedCourses: rawFoodCourses,
    loadingRecommendedCourses: isFoodLoading,
  } = useRecommendedCourses({
    onCoursePress: handleCoursePress,
    filters: foodFilters,
  });

  const {
    recommendedCourses: rawGeneralSubjectCourses,
    loadingRecommendedCourses: isGeneralSubjectLoading,
  } = useRecommendedCourses({
    onCoursePress: handleCoursePress,
    filters: generalSubjectFilters,
  });

  const {
    recommendedCourses: rawShortCourseCourses,
    loadingRecommendedCourses: isShortCourseLoading,
  } = useRecommendedCourses({
    onCoursePress: handleCoursePress,
    filters: shortCourseFilters,
  });

  const {
    recommendedCourses: rawMusicDevCourses,
    loadingRecommendedCourses: isMusicDevLoading,
  } = useRecommendedCourses({
    onCoursePress: handleCoursePress,
    filters: musicDevFilters,
  });

  const {
    recommendedCourses: rawMasterclassCourses,
    loadingRecommendedCourses: isMasterclassLoading,
  } = useRecommendedCourses({
    onCoursePress: handleCoursePress,
    filters: masterclassFilters,
  });

  const {
    recommendedCourses: rawMelodeonCourses,
    loadingRecommendedCourses: isMelodeonLoading,
  } = useRecommendedCourses({
    onCoursePress: handleCoursePress,
    filters: melodeonFilters,
  });

  const attachCourseActions = useCallback(
    (courses: SliderCourseItem[]) =>
      courses.map(course => ({
        ...course,
        whitelist: whitelistMap[course.id] ?? !!course.whitelist,
        onPress: () => {
          const existingLibraryId = getExistingLibraryId(course);

          if (existingLibraryId) {
            runAsync(handleGoToLibrary(course), 'onPressGoToLibrary');
            return;
          }

          handleCoursePress(course);
        },
        onPressStartLearn: () => {
          runAsync(handleStartLearn(course), 'onPressStartLearn');
        },
        onPressBuy: () => {
          runAsync(handleBuyCourse(course), 'onPressBuy');
        },
        onPressGoToLibrary: () => {
          runAsync(handleGoToLibrary(course), 'onPressGoToLibrary');
        },
        onToggleWhitelist: (next: boolean) => {
          runAsync(
            handleToggleWhitelist(course as unknown as Course, next),
            'onToggleWhitelist',
          );
        },
      })),
    [
      handleBuyCourse,
      handleCoursePress,
      handleGoToLibrary,
      handleStartLearn,
      handleToggleWhitelist,
      runAsync,
      whitelistMap,
    ],
  );

  const hitsongCourses = useMemo(
    () => attachCourseActions(rawHitsongCourses),
    [attachCourseActions, rawHitsongCourses],
  );

  const musicCourses = useMemo(
    () => attachCourseActions(rawMusicCourses),
    [attachCourseActions, rawMusicCourses],
  );

  const foodCourses = useMemo(
    () => attachCourseActions(rawFoodCourses),
    [attachCourseActions, rawFoodCourses],
  );

  const generalSubjectCourses = useMemo(
    () => attachCourseActions(rawGeneralSubjectCourses),
    [attachCourseActions, rawGeneralSubjectCourses],
  );

  const shortCourseCourses = useMemo(
    () => attachCourseActions(rawShortCourseCourses),
    [attachCourseActions, rawShortCourseCourses],
  );

  const musicDevCourses = useMemo(
    () => attachCourseActions(rawMusicDevCourses),
    [attachCourseActions, rawMusicDevCourses],
  );

  const masterclassCourses = useMemo(
    () => attachCourseActions(rawMasterclassCourses),
    [attachCourseActions, rawMasterclassCourses],
  );

  const melodeonCourses = useMemo(
    () => attachCourseActions(rawMelodeonCourses),
    [attachCourseActions, rawMelodeonCourses],
  );

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo?.({ y: 0, animated: true });
      // Refetch only queries that are actually stale (past staleTime),
      // instead of refetching on every screen focus.
      queryClient.refetchQueries({
        queryKey: ['recommendCourses'],
        type: 'active',
        stale: true,
      });
    }, [queryClient]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: {
          flex: 1,
        },
        header: {
          marginTop: sharedTopSpace,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },
        leftHead: {
          flexDirection: 'row',
          gap: scale(12),
          alignItems: 'center',
          flexShrink: 1,
          flexGrow: 1,
          minWidth: 0,
        },
        rightHead: {
          flexDirection: 'row',
          gap: scale(14),
          alignItems: 'center',
          paddingRight: scale(8),
        },
        nameText: {
          flexShrink: 1,
          color: AppColors.white,
        },
        greetingCol: {
          flexShrink: 1,
          minWidth: 0,
          gap: verticalScale(2),
        },
        greetingText: {
          color: AppColors.textSecondary,
        },
        skeletonAvatar: {
          width: IS_TABLET ? 60 : 50,
          height: IS_TABLET ? 60 : 50,
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.backgroundInteractive,
        },
        skeletonName: {
          width: scale(IS_TABLET ? 180 : 120),
          maxWidth: '70%',
          height: verticalScale(IS_TABLET ? 22 : 16),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.backgroundInteractive,
        },
        bannerContainer: {
          marginTop: verticalScale(IS_TABLET ? 30 : 26),
        },
        quickNavContainer: {
          marginTop: verticalScale(IS_TABLET ? 24 : 20),
        },
        courseSection: {
          marginTop: verticalScale(30),
        },
        teacherSectionHeader: {
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },
        recommendedTeacherSection: {
          marginTop: verticalScale(24),
          gap: verticalScale(18),
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const fullName =
    `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() ||
    'ผู้ใช้';

  const initialsNameSource = (
    profile?.first_name ??
    profile?.email ??
    ''
  ).trim();

  const showProfileSkeleton = isFetchingProfile && !profile;

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppLoadingOverlay visible={isProcessing} message="กำลังดำเนินการ" />

      <AppScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        withHorizontalPadding={false}
      >
        <View style={styles.header}>
          <View style={styles.leftHead}>
            {showProfileSkeleton ? (
              <>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonName} />
              </>
            ) : (
              <>
                <RoundProfileImage
                  name={initialsNameSource || undefined}
                  imageUrl={
                    typeof profile?.profile_image === 'string'
                      ? profile.profile_image
                      : undefined
                  }
                  size={IS_TABLET ? 60 : 50}
                  disabled
                />

                <View style={styles.greetingCol}>
                  <AppText
                    style={styles.greetingText}
                    fontSize={AppFontSize.caption}
                    numberOfLines={1}
                  >
                    พร้อมเรียนรู้หรือยัง
                  </AppText>
                  <AppText
                    style={styles.nameText}
                    fontWeight="semiBold"
                    fontSize={AppFontSize.title}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {fullName}
                  </AppText>
                </View>
              </>
            )}
          </View>

          <View style={styles.rightHead}>
            <AppIconBadgeButton
              renderIcon={(s, c) => (
                <SearchIcon size={IS_TABLET ? 34 : 28} color={c} />
              )}
              onPress={() => navigation.navigate('Course')}
            />
          </View>
        </View>

        <View style={styles.bannerContainer}>
          <AppBanner sources={bannerSources} links={bannerLinks} />
        </View>

        <View style={styles.quickNavContainer}>
          <CategoryQuickNav items={quickNavItems} />
        </View>

        <View style={styles.courseSection}>
          <HomeCourseSection
            title="อาหาร"
            data={foodCourses}
            variant="vertical"
            useSectionHeader
            loading={isFoodLoading}
            skeletonCount={3}
            onPressSeeAll={() => handleSeeAllCourses(FOOD_CATEGORY_ID, 'อาหาร')}
            autoSlideInterval={5000}
          />
        </View>

        <View style={styles.courseSection}>
          <HomeCourseSection
            title="ดนตรี"
            data={musicCourses}
            variant="vertical"
            useSectionHeader
            loading={isMusicLoading}
            skeletonCount={3}
            onPressSeeAll={() =>
              handleSeeAllCourses(MUSIC_CATEGORY_ID, 'ดนตรี')
            }
            autoSlideInterval={5000}
          />
        </View>

        <View style={styles.courseSection}>
          <HomeCourseSection
            title="Hitsong"
            data={hitsongCourses}
            variant="vertical"
            useSectionHeader
            loading={isHitsongLoading}
            skeletonCount={3}
            onPressSeeAll={() =>
              handleSeeAllCourses(HITSONG_CATEGORY_ID, 'Hitsong')
            }
            autoSlideInterval={4500}
          />
        </View>

        <View style={styles.courseSection}>
          <HomeCourseSection
            title="หลักสูตรระยะสั้น"
            data={shortCourseCourses}
            variant="vertical"
            useSectionHeader
            loading={isShortCourseLoading}
            skeletonCount={3}
            onPressSeeAll={() =>
              handleSeeAllCourses(SHORT_COURSE_CATEGORY_ID, 'หลักสูตรระยะสั้น')
            }
            autoSlideInterval={5500}
          />
        </View>

        <View style={styles.courseSection}>
          <HomeCourseSection
            title="วิชาเรียนทั่วไป"
            data={generalSubjectCourses}
            variant="vertical"
            useSectionHeader
            loading={isGeneralSubjectLoading}
            skeletonCount={3}
            onPressSeeAll={() =>
              handleSeeAllCourses(
                GENERAL_SUBJECT_CATEGORY_ID,
                'วิชาเรียนทั่วไป',
              )
            }
            autoSlideInterval={6500}
          />
        </View>

        <View style={styles.courseSection}>
          <HomeCourseSection
            title="ศูนย์ส่งเสริมพัฒนาดนตรี"
            data={musicDevCourses}
            variant="vertical"
            useSectionHeader
            loading={isMusicDevLoading}
            skeletonCount={3}
            onPressSeeAll={() =>
              handleSeeAllCourses(
                MUSIC_DEV_CATEGORY_ID,
                'ศูนย์ส่งเสริมพัฒนาดนตรี',
              )
            }
            autoSlideInterval={6000}
          />
        </View>

        <View style={styles.courseSection}>
          <HomeCourseSection
            title="Masterclass"
            data={masterclassCourses}
            variant="vertical"
            useSectionHeader
            loading={isMasterclassLoading}
            skeletonCount={3}
            onPressSeeAll={() =>
              handleSeeAllCourses(MASTERCLASS_CATEGORY_ID, 'Masterclass')
            }
            autoSlideInterval={6000}
          />
        </View>

        <View style={styles.courseSection}>
          <HomeCourseSection
            title="สมาคมเมโลเดียน"
            data={melodeonCourses}
            variant="vertical"
            useSectionHeader
            loading={isMelodeonLoading}
            skeletonCount={3}
            onPressSeeAll={() =>
              handleSeeAllCourses(MELODEON_CATEGORY_ID, 'สมาคมเมโลเดียน')
            }
            autoSlideInterval={6000}
          />
        </View>

        <View style={styles.recommendedTeacherSection}>
          <AppSectionHeader
            title="อาจารย์ของเรา"
            containerStyle={styles.teacherSectionHeader}
          />

          <AppTeacherAvatarSlider
            data={recommendedTeachers}
            onItemPress={handleTeacherPress}
          />
        </View>
      </AppScrollView>
    </View>
  );
};

export default HomeScreen;
