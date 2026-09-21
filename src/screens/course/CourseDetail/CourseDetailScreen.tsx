import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { log, logWarn } from '../../../helpers/logger';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import BookIcon from '../../../assets/icons/course/BookIcon';
import ChatIcon from '../../../assets/icons/course/ChatIcon';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import VideoIcon from '../../../assets/icons/course/VideoIcon';
import DocumentIcon from '../../../assets/icons/DocumentIcon';
import AppBackground from '../../../components/background/AppBackground';
import WhitelistButton from '../../../components/buttons/WhitelistButton';
import AppLoadingOverlay from '../../../components/loading/AppLoadingOverlay';
import ReviewComposer from '../../../components/reviews/ReviewComposer';
import ReviewLongPressActionSheet from '../../../components/reviews/ReviewLongPressActionSheet';
import CourseDetailTabs from '../../../components/tabs/CourseDetailTabs';
import CourseActionBar from './components/CourseActionBar';
import AppText from '../../../components/texts/AppText';
import ExpandableText from '../../../components/texts/ExpandableText';
import AppScrollView from '../../../components/views/AppScrollView';
import { IS_TABLET } from '../../../constants/platform';
import { useResponsive } from '../../../helpers/responsive';
import { useCourseDetail } from '../../../hooks/course/useCourseDetail';
import { useCourseLessonList } from '../../../hooks/course/useCourseLessonList';
import { useGetTeacherInCourse } from '../../../hooks/course/useGetTeacherInCourse';
import { useWhitelist } from '../../../hooks/course/useWhitelist';
import { useOrderCheckout } from '../../../hooks/orders/useOrderCheckout';
import { useCourseReviewAll } from '../../../hooks/review/useCourseReviewAll';
import { useCourseReviewDetail } from '../../../hooks/review/useCourseReviewDetail';
import { useCreateCourseReview } from '../../../hooks/review/useCreateCourseReview';
import { useDeleteCourseReview } from '../../../hooks/review/useDeleteCourseReview';
import { useToggleCourseReviewLike } from '../../../hooks/review/useToggleCourseReviewLike';
import { useWhitelistStore } from '../../../stores/whitelist';
import { AppColors } from '../../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../../styles/sharedstyles';
import { AppStackParamList } from '../../../types/data/navigation/navigation.types';
import CourseCommentsSection from './components/CourseCommentsSection';
import CourseDocumentTab from './components/CourseDocumentTab';
import CourseLessonTab from './components/CourseLessonTab';
import CourseReviewComposerSheet from './components/CourseReviewComposerSheet';
import CourseReviewRepliesModal from './components/CourseReviewRepliesModal';
import TeacherItem from './components/TeacherItem';
import {
  CourseAudioItem,
  CourseDocumentItem,
  CourseDocumentUnion,
} from './types/document.types';
import AppScreenHeader from '../../../components/sections/AppScreenHeader';

type CourseDetailRouteProp = RouteProp<AppStackParamList, 'CourseDetail'>;
type CourseDetailNavProp = NativeStackNavigationProp<
  AppStackParamList,
  'CourseDetail'
>;

type ReviewComposerMode = 'create' | 'edit';

type ReviewComposerInitialData = {
  rating?: number | null;
  text?: string | null;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const formatNumberTH = (n: number) => {
  try {
    return new Intl.NumberFormat('th-TH').format(n);
  } catch {
    return (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

const extractLibraryId = (res: any) => {
  const raw =
    res?.library_id ??
    res?.data?.library_id ??
    res?.result?.library_id ??
    res?.payload?.library_id;
  return typeof raw === 'string' ? raw.trim() : '';
};

const CourseDetailScreen = () => {
  const { width } = useWindowDimensions();
  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const scrollRef = useRef<ScrollView | null>(null);
  const navigation = useNavigation<CourseDetailNavProp>();
  const route = useRoute<CourseDetailRouteProp>();

  const { id, mediaId } = route.params as { id: string; mediaId?: string };
  const [activeTab, setActiveTab] = useState<
    'content' | 'lesson' | 'document' | 'comment'
  >('content');

  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [reviewComposerMode, setReviewComposerMode] =
    useState<ReviewComposerMode>('create');
  const [composerInitialData, setComposerInitialData] =
    useState<ReviewComposerInitialData>();

  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [commentActionOpen, setCommentActionOpen] = useState(false);

  const [selectedReplyReviewId, setSelectedReplyReviewId] = useState<
    string | null
  >(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);

  const openCommentAction = useCallback((item: any) => {
    setSelectedReview(item);
    setCommentActionOpen(true);
  }, []);

  const closeCommentAction = useCallback(() => {
    setCommentActionOpen(false);
  }, []);

  const openReviewSheet = useCallback(
    (mode: ReviewComposerMode, review?: any) => {
      setReviewComposerMode(mode);

      if (mode === 'edit' && review) {
        setComposerInitialData({
          rating: review?.rating ?? 0,
          text: review?.content ?? '',
        });
      } else {
        setComposerInitialData(undefined);
      }

      setCommentSheetOpen(true);
    },
    [],
  );

  const closeSheet = useCallback(() => {
    setCommentSheetOpen(false);
    setReviewComposerMode('create');
    setComposerInitialData(undefined);
  }, []);

  const closeReplyModal = useCallback(() => {
    setReplyModalOpen(false);
    setSelectedReplyReviewId(null);
  }, []);

  const {
    data: course,
    loading: courseLoading,
    error: courseError,
  } = useCourseDetail(id);

  const { data: teachers, loading: teachersLoading } =
    useGetTeacherInCourse(id);

  const {
    data: lessonList,
    loading: lessonLoading,
    error: lessonError,
  } = useCourseLessonList(id);

  const {
    displayData: reviewItems,
    my_review: myReviewState,
    loading: reviewLoading,
    hasMore: reviewHasMore,
    loadMore: loadMoreReviews,
    refetch: refetchReviews,
  } = useCourseReviewAll(id, {
    enabled: activeTab === 'comment',
    page: 1,
    limit: 5,
  });

  const {
    data: reviewDetail,
    loading: reviewDetailLoading,
    error: reviewDetailError,
  } = useCourseReviewDetail(selectedReplyReviewId, {
    enabled: replyModalOpen && !!selectedReplyReviewId,
  });

  const { submit: submitCourseReview } = useCreateCourseReview();
  const { remove: deleteCourseReview } = useDeleteCourseReview();
  const { toggle: toggleLike } = useToggleCourseReviewLike();

  const { updateWhitelist } = useWhitelist();
  const whitelistMap = useWhitelistStore(s => s.map);

  const { checkout } = useOrderCheckout();
  const [isProcessing, setIsProcessing] = useState(false);
  const isStartingRef = useRef(false);

  const canCreateReview = myReviewState?.can_create ?? true;
  const canEditReview = myReviewState?.can_edit ?? false;
  const reviewGuardMessage =
    myReviewState?.message || 'ไม่สามารถดำเนินการกับความคิดเห็นนี้ได้';
  const isEditingReview = reviewComposerMode === 'edit';

  // Only owners/enrolled users (course in their library) may write a review.
  // Everyone else can read reviews only.
  const isCourseOwned = !!course?.library || !!course?.library_id;
  const reviewComposerVisible =
    activeTab === 'comment' && isCourseOwned && canCreateReview;
  const reviewComposerSpace = verticalScale(IS_TABLET ? 72 : 60);

  const videoGroups = useMemo(() => {
    if (!lessonList?.data) return [];
    return lessonList.data
      .map(section => ({
        title: section.title,
        videos: section.lesson_group.video,
      }))
      .filter(group => group.videos.length > 0);
  }, [lessonList]);

  const documentGroups = useMemo<
    { title: string; items: CourseDocumentUnion[] }[]
  >(() => {
    if (!lessonList?.data) return [];

    return lessonList.data
      .map(section => {
        const docs: CourseDocumentItem[] = section.lesson_group.document.filter(
          d => d.attachment?.[0]?.url,
        );

        const audios: CourseAudioItem[] = section.lesson_group.audio.filter(
          a => a.media_id,
        );

        const items: CourseDocumentUnion[] = [...docs, ...audios];

        return {
          title: section.title,
          items,
        };
      })
      .filter(group => group.items.length > 0);
  }, [lessonList]);

  const isInitialLoading = courseLoading || teachersLoading || lessonLoading;
  const isError = !!courseError || !!lessonError;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: { flex: 1 },

        coverImageContainer: {
          width: '100%',
          aspectRatio: 16 / 9,
          borderRadius: responsiveRadius(AppRadius.md),
          overflow: 'hidden',
          marginTop: verticalScale(16),
        },
        coverImage: { width: '100%', height: '100%' },

        titleBlock: {
          marginTop: verticalScale(16),
          gap: verticalScale(10),
        },
        categoryPill: {
          alignSelf: 'flex-start',
          backgroundColor: AppColors.surfaceActive,
          borderRadius: responsiveRadius(AppRadius.pill),
          paddingHorizontal: scale(12),
          paddingVertical: verticalScale(5),
        },
        categoryPillText: { color: AppColors.primary },
        courseName: { color: AppColors.white },
        metaRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: scale(8),
          marginTop: verticalScale(2),
        },
        metaChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(5),
          backgroundColor: AppColors.cardBackgroundSecondary,
          borderRadius: responsiveRadius(AppRadius.sm),
          paddingHorizontal: scale(10),
          paddingVertical: verticalScale(6),
        },
        metaChipText: { color: AppColors.textSecondary },

        tabs: { marginTop: verticalScale(18) },
        contentTab: { paddingTop: verticalScale(10) },
        sectionTitle: { color: AppColors.primary },
        detailCard: {
          backgroundColor: AppColors.cardBackgroundSecondary,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.md),
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(16),
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
        detailEmpty: {
          color: AppColors.textTertiary,
          marginTop: verticalScale(10),
        },
        courseDescription: { marginTop: verticalScale(10) },
        teacherContainer: {
          marginTop: verticalScale(24),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: AppColors.border,
          paddingTop: verticalScale(20),
        },
        teacherList: {
          marginTop: verticalScale(16),
          gap: verticalScale(12),
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const coverSource = useMemo(
    () => ({
      uri:
        course?.cover_image_list?.IMAGE_16_9 ??
        course?.cover_image_list?.IMAGE_4_3 ??
        course?.cover_image_list?.IMAGE_1_1 ??
        course?.cover_image,
    }),
    [course],
  );

  const hasTeachers = useMemo(() => (teachers?.length ?? 0) > 0, [teachers]);

  const tags = useMemo(
    () =>
      (course?.tag || '')
        .split(' ')
        .map(t => t.replace(/^#+/, '').trim())
        .filter(Boolean),
    [course?.tag],
  );

  const inLibrary = !!course?.library || !!course?.library_id;
  const isFreeCourse = (course?.price ?? 0) === 0;

  const primaryActionLabel = useMemo(
    () => (inLibrary || isFreeCourse ? 'เริ่มเรียน' : 'ซื้อคอร์ส'),
    [inLibrary, isFreeCourse],
  );

  const handlePressTag = useCallback(
    (tag: string) => {
      const valueWithHash = `#${tag}`;

      navigation.navigate('MainTabs', {
        screen: 'Course',
        params: { initialTag: valueWithHash },
      });
    },
    [navigation],
  );

  useEffect(() => {
    if (!commentSheetOpen) return;

    if (!isEditingReview && !canCreateReview) {
      closeSheet();
      return;
    }

    if (isEditingReview && !canEditReview) {
      closeSheet();
    }
  }, [
    commentSheetOpen,
    isEditingReview,
    canCreateReview,
    canEditReview,
    closeSheet,
  ]);

  useEffect(() => {
    if (activeTab !== 'comment' && commentActionOpen) {
      closeCommentAction();
    }
  }, [activeTab, commentActionOpen, closeCommentAction]);

  useEffect(() => {
    if (!commentActionOpen && !commentSheetOpen) {
      setSelectedReview(null);
    }
  }, [commentActionOpen, commentSheetOpen]);

  useEffect(() => {
    if (reviewDetailError) {
      log('Course', 'review detail error:', reviewDetailError);
    }
  }, [reviewDetailError]);

  const handlePressReply = useCallback((item: any) => {
    const reviewId = item?.id ? String(item.id) : '';
    if (!reviewId) return;

    setSelectedReplyReviewId(reviewId);
    setReplyModalOpen(true);
  }, []);

  const handleChangeTab = useCallback(
    (key: string) => {
      setActiveTab(key as any);
      scrollRef.current?.scrollTo?.({ y: 0, animated: true });
      if (key !== 'comment') {
        closeSheet();
        closeCommentAction();
        closeReplyModal();
      }
    },
    [closeSheet, closeCommentAction, closeReplyModal],
  );

  const handleToggleWhitelist = useCallback(
    async (next: boolean) => {
      if (!course) return;
      await updateWhitelist(course, next);
    },
    [course, updateWhitelist],
  );

  const clearWhitelistBeforeCheckout = useCallback(async () => {
    if (!course) return;
    const isNow = whitelistMap[course.id] ?? !!course.whitelist;
    if (isNow) await updateWhitelist(course, false);
  }, [course, updateWhitelist, whitelistMap]);

  const handlePressLessonStart = useCallback(
    async (lesson: any) => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;
      setIsProcessing(true);

      try {
        await clearWhitelistBeforeCheckout();
        const lessonIdStr = String(lesson.id);
        let libraryId = '';

        for (let attempt = 1; attempt <= 10; attempt++) {
          const res = await checkout({ course: [], lesson: [lessonIdStr] });
          libraryId = extractLibraryId(res);
          if (libraryId) break;
          await sleep(400);
        }

        if (libraryId) {
          navigation.navigate('ClassRoom', {
            id: libraryId,
            lessonId: lessonIdStr,
            mediaId: lesson.media_id,
            autoStart: true,
          });
        }
      } catch (e) {
        log('Course', e);
      } finally {
        setIsProcessing(false);
        isStartingRef.current = false;
      }
    },
    [checkout, navigation, clearWhitelistBeforeCheckout],
  );

  const handlePressDocumentStart = useCallback(
    async (item: CourseDocumentUnion) => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;
      setIsProcessing(true);

      try {
        await clearWhitelistBeforeCheckout();
        const lessonIdStr = String(item.id);
        let libraryId = '';

        for (let attempt = 1; attempt <= 10; attempt++) {
          const res = await checkout({
            course: [],
            lesson: [lessonIdStr],
          });

          libraryId = extractLibraryId(res);
          if (libraryId) break;
          await sleep(400);
        }

        if (!libraryId) return;

        if ('attachment' in item && item.attachment?.[0]?.url) {
          navigation.navigate('ClassRoom', {
            id: libraryId,
            lessonId: lessonIdStr,
            openPdfUrl: item.attachment[0].url,
          });
        } else if ('media_id' in item) {
          navigation.navigate('ClassRoom', {
            id: libraryId,
            lessonId: lessonIdStr,
            mediaId: item.media_id,
            autoStart: true,
          });
        }
      } catch (e) {
        log('Course', 'handlePressDocumentStart error:', e);
      } finally {
        setIsProcessing(false);
        isStartingRef.current = false;
      }
    },
    [checkout, navigation, clearWhitelistBeforeCheckout],
  );

  const handlePrimaryAction = useCallback(async () => {
    if (!course || isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      if (inLibrary) {
        if (course.library_id) {
          navigation.navigate('ClassRoom', { id: course.library_id });
        }
        return;
      }

      if (!isFreeCourse) {
        log('Course', 'Paid course - go to purchase flow:', course.id);
        return;
      }

      await clearWhitelistBeforeCheckout();
      setIsProcessing(true);

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
        logWarn('Course', '[CourseDetail] missing library_id', lastRes);
        return;
      }

      navigation.navigate('ClassRoom', { id: libraryId });
    } catch (e) {
      log('Course', 'handlePrimaryAction error:', e);
    } finally {
      setIsProcessing(false);
      isStartingRef.current = false;
    }
  }, [
    course,
    inLibrary,
    isFreeCourse,
    navigation,
    checkout,
    clearWhitelistBeforeCheckout,
  ]);

  if (isInitialLoading) {
    return (
      <View style={styles.rootView}>
        <AppBackground pointerEvents="none" />
        <AppLoadingOverlay visible message="กำลังโหลดข้อมูลคอร์ส..." />
      </View>
    );
  }

  if (isError || !course) {
    return (
      <View style={styles.rootView}>
        <AppBackground pointerEvents="none" />
      </View>
    );
  }

  const metaChips: { icon: IoniconName; text: string }[] = [];
  if (course.ratings_amount != null && course.ratings_amount > 0) {
    metaChips.push({
      icon: 'star',
      text:
        course.review_amount > 0
          ? `${course.ratings_amount.toFixed(1)} (${formatNumberTH(
              course.review_amount,
            )})`
          : `${course.ratings_amount.toFixed(1)}`,
    });
  }
  if (course.lesson_amount > 0) {
    metaChips.push({
      icon: 'play-circle-outline',
      text: `${formatNumberTH(course.lesson_amount)} บทเรียน`,
    });
  }
  if (course.lesson_str_duration && course.lesson_str_duration.trim()) {
    metaChips.push({
      icon: 'time-outline',
      text: course.lesson_str_duration,
    });
  }
  if (course.learners_amount > 0) {
    metaChips.push({
      icon: 'people-outline',
      text: `${formatNumberTH(course.learners_amount)} ผู้เรียน`,
    });
  }
  if (course.level && course.level.trim()) {
    metaChips.push({ icon: 'ribbon-outline', text: course.level });
  }

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppLoadingOverlay visible={isProcessing} message="กำลังดำเนินการ" />

      <AppScrollView
        ref={scrollRef}
        withHorizontalPadding
        keyboardShouldPersistTaps="handled"
        extraBottomSpace={reviewComposerVisible ? reviewComposerSpace : 30}
      >
        <AppScreenHeader
          title={course.course_category?.[0]?.label ?? course.label}
          rightAction={
            <WhitelistButton
              isWhitelisted={!!(whitelistMap[course.id] ?? !!course.whitelist)}
              onToggle={handleToggleWhitelist}
              buttonHeight={IS_TABLET ? 42 : 36}
              buttonWidth={IS_TABLET ? 42 : 36}
              iconSize={IS_TABLET ? 24 : 20}
            />
          }
        />

        <View style={styles.coverImageContainer}>
          <Image
            source={coverSource}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.titleBlock}>
          <AppText
            fontSize={AppFontSize.h1}
            fontWeight="semiBold"
            style={styles.courseName}
          >
            {course.label}
          </AppText>

          {metaChips.length > 0 && (
            <View style={styles.metaRow}>
              {metaChips.map((chip, i) => (
                <View key={`${chip.text}-${i}`} style={styles.metaChip}>
                  <Ionicons
                    name={chip.icon}
                    size={IS_TABLET ? 18 : 15}
                    color={AppColors.primary}
                  />
                  <AppText
                    fontSize={AppFontSize.caption}
                    style={styles.metaChipText}
                  >
                    {chip.text}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.tabs}>
          <CourseDetailTabs
            tabs={[
              {
                key: 'content',
                label: 'รายละเอียด',
                icon: <BookIcon size={IS_TABLET ? 32 : 28} />,
              },
              {
                key: 'lesson',
                label: 'บทเรียน',
                icon: <VideoIcon size={IS_TABLET ? 32 : 28} />,
              },
              {
                key: 'document',
                label: 'เอกสาร',
                icon: <DocumentIcon size={IS_TABLET ? 32 : 28} />,
              },
              {
                key: 'comment',
                label: 'รีวิว',
                icon: <ChatIcon size={IS_TABLET ? 32 : 28} />,
              },
            ]}
            onChange={handleChangeTab}
          />

          <View style={styles.contentTab}>
            {activeTab === 'content' && (
              <View
                style={{ paddingBottom: verticalScale(IS_TABLET ? 24 : 20) }}
              >
                <View style={styles.detailCard}>
                  <View style={styles.sectionHeadingRow}>
                    <View style={styles.accentBar} />
                    <AppText
                      style={styles.sectionTitle}
                      fontWeight="medium"
                      fontSize={AppFontSize.subtitle}
                    >
                      รายละเอียดคอร์ส
                    </AppText>
                  </View>

                  {!!course.description ? (
                    <View style={styles.courseDescription}>
                      <ExpandableText
                        html={course.description}
                        contentWidth={width - scale(64)}
                        fontSize={AppFontSize.subtitle}
                        maxLines={7}
                        fadeColors={['rgba(27,27,27,0)', 'rgba(27,27,27,0.98)']}
                      />
                    </View>
                  ) : (
                    <AppText
                      style={styles.detailEmpty}
                      fontSize={AppFontSize.body}
                    >
                      ไม่มีรายละเอียดคอร์ส
                    </AppText>
                  )}
                </View>

                {(teachersLoading || hasTeachers) && (
                  <View style={styles.teacherContainer}>
                    <AppText
                      style={styles.sectionTitle}
                      fontWeight="medium"
                      fontSize={AppFontSize.subtitle}
                    >
                      ผู้สอน
                    </AppText>

                    <View style={styles.teacherList}>
                      {teachersLoading ? (
                        <AppText
                          fontSize={AppFontSize.caption}
                          style={{ color: AppColors.white }}
                        >
                          กำลังโหลดข้อมูลผู้สอน...
                        </AppText>
                      ) : (
                        hasTeachers &&
                        teachers!.map(teacher => (
                          <TeacherItem
                            key={teacher.id}
                            teacher={teacher}
                            onPress={() =>
                              navigation.navigate('TeacherProfile', {
                                id: teacher.id,
                              })
                            }
                          />
                        ))
                      )}
                    </View>
                  </View>
                )}

                {tags.length > 0 && (
                  <FlatList
                    data={tags}
                    horizontal
                    directionalLockEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    contentContainerStyle={{
                      gap: scale(IS_TABLET ? 12 : 10),
                      marginTop: verticalScale(IS_TABLET ? 24 : 20),
                    }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={PRESSED_OPACITY}
                        onPress={() => handlePressTag(item)}
                        disabled
                      >
                        <View
                          style={{
                            backgroundColor: AppColors.backgroundInteractive,
                            paddingVertical: verticalScale(IS_TABLET ? 8 : 6),
                            paddingHorizontal: scale(IS_TABLET ? 18 : 14),
                            borderRadius: responsiveRadius(AppRadius.sm),
                          }}
                        >
                          <AppText fontSize={AppFontSize.caption}>
                            {item}
                          </AppText>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            )}

            {activeTab === 'lesson' && (
              <CourseLessonTab
                groups={videoGroups}
                onPressLesson={handlePressLessonStart}
              />
            )}

            {activeTab === 'document' && (
              <CourseDocumentTab
                groups={documentGroups}
                currentMediaId={mediaId}
                onPressStartDocument={handlePressDocumentStart}
              />
            )}

            {activeTab === 'comment' && (
              <View
                style={{
                  paddingBottom: reviewComposerVisible
                    ? reviewComposerSpace
                    : 0,
                }}
              >
                <CourseCommentsSection
                  loading={reviewLoading}
                  items={reviewItems ?? []}
                  hasMore={reviewHasMore}
                  onLoadMore={loadMoreReviews}
                  onToggleLike={toggleLike}
                  onLongPressItem={openCommentAction}
                  onPressReply={handlePressReply}
                  myReviewId={myReviewState?.review_id}
                />
              </View>
            )}
          </View>
        </View>
      </AppScrollView>

      <ReviewComposer
        visible={reviewComposerVisible}
        placeholder="แสดงความคิดเห็น..."
        onPress={() => {
          if (!canCreateReview) {
            log('Course', reviewGuardMessage);
            return;
          }
          openReviewSheet('create');
        }}
      />

      <CourseReviewComposerSheet
        visible={
          commentSheetOpen &&
          (isEditingReview ? canEditReview : canCreateReview)
        }
        onClose={closeSheet}
        initialData={composerInitialData}
        onSubmit={async ({ rating, text }) => {
          const isEditFlow = isEditingReview;

          if (isEditFlow) {
            if (!canEditReview) {
              log('Course', reviewGuardMessage);
              closeSheet();
              return;
            }
          } else {
            if (!canCreateReview) {
              log('Course', reviewGuardMessage);
              closeSheet();
              return;
            }
          }

          try {
            setIsProcessing(true);

            const res = await submitCourseReview({
              courseId: id,
              rating,
              content: text,
            });

            const ok = !!res?.review?.id || res?.createdNew === true;
            if (!ok) {
              log(
                'Course',
                isEditFlow ? 'update review failed:' : 'create review failed:',
                res,
              );
              return;
            }

            closeSheet();
            await refetchReviews();
          } catch (e) {
            log(
              'Course',
              isEditFlow ? 'update review error:' : 'create review error:',
              e,
            );
          } finally {
            setIsProcessing(false);
          }
        }}
      />

      <ReviewLongPressActionSheet
        visible={commentActionOpen}
        onClose={closeCommentAction}
        title="จัดการความคิดเห็น"
        actions={[
          {
            key: 'edit',
            label: 'แก้ไขความคิดเห็น',
            onPress: () => {
              const review = selectedReview;

              if (review?.id !== myReviewState?.review_id) {
                closeCommentAction();
                return;
              }

              if (!canEditReview) {
                log('Course', reviewGuardMessage);
                closeCommentAction();
                return;
              }

              closeCommentAction();

              setTimeout(() => {
                openReviewSheet('edit', review);
              }, 320);
            },
          },
          {
            key: 'delete',
            label: 'ลบความคิดเห็น',
            destructive: true,
            onPress: () => {
              const review = selectedReview;

              if (review?.id !== myReviewState?.review_id) {
                closeCommentAction();
                return;
              }

              if (!canEditReview) {
                log('Course', reviewGuardMessage);
                closeCommentAction();
                return;
              }

              closeCommentAction();
              setTimeout(() => {
                Alert.alert(
                  'ลบความคิดเห็น',
                  'ต้องการลบความคิดเห็นนี้ใช่ไหม? การลบไม่สามารถกู้คืนได้',
                  [
                    { text: 'ยกเลิก', style: 'cancel' },
                    {
                      text: 'ลบ',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteCourseReview(id);
                          await refetchReviews();
                        } catch (e) {
                          log('Course', 'delete review error:', e);
                        }
                      },
                    },
                  ],
                );
              }, 320);
            },
          },
        ]}
      />

      <CourseReviewRepliesModal
        visible={replyModalOpen}
        loading={reviewDetailLoading}
        data={reviewDetail}
        onClose={closeReplyModal}
      />

      {/* Primary button stays pinned to the bottom, no need to scroll back up.
          Hidden while writing a review so it doesn't cover the keyboard. */}
      {!reviewComposerVisible && (
        <CourseActionBar
          price={course.price}
          actionLabel={primaryActionLabel}
          onPressAction={handlePrimaryAction}
          formatPrice={formatNumberTH}
        />
      )}
    </View>
  );
};

export default CourseDetailScreen;
