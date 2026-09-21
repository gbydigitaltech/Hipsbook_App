import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { log, logWarn } from '../../../helpers/logger';

import AppBackground from '../../../components/background/AppBackground';
import CourseHorizontalCard from '../../../components/cards/CourseHorizontalCard';
import AppLoadingOverlay from '../../../components/loading/AppLoadingOverlay';
import SwipeableCourseRow from '../../../components/slides/courses/SwipeableCourseRow';
import AppEmptyState from '../../../components/states/AppEmptyState';
import AppText from '../../../components/texts/AppText';
import AppFlatList from '../../../components/views/AppFlatList';
import { IS_TABLET } from '../../../constants/platform';
import { useResponsive } from '../../../helpers/responsive';
import { useWhitelist as useCourseWhitelist } from '../../../hooks/course/useWhitelist';
import { useLibraryList } from '../../../hooks/library/useLibraryList';
import { useUpdateLibraryStatus } from '../../../hooks/library/useUpdateLibraryStatus';
import { useOrderCheckout } from '../../../hooks/orders/useOrderCheckout';
import { useAuth } from '../../../stores/auth';
import { useProfile } from '../../../stores/profile';
import { useWhitelistStore } from '../../../stores/whitelist';
import { AppColors } from '../../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  sharedPaddingHorizontal,
  sharedTopSpace,
} from '../../../styles/sharedstyles';

import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Course } from '../../../types/data/courses/course.type';
import {
  AppStackParamList,
  BottomTabParamList,
} from '../../../types/data/navigation/navigation.types';
import ListHeader, { MY_COURSE_AVATAR_SIZE } from './components/ListHeader';
import SectionHeader from './components/SectionHeader';

const PAGE_SIZE = 10;

type CourseTabNavProp = BottomTabNavigationProp<BottomTabParamList, 'Course'>;
type RootStackNavProp = NativeStackNavigationProp<AppStackParamList>;
type CourseScreenNavProp = CompositeNavigationProp<
  CourseTabNavProp,
  RootStackNavProp
>;

type NullableId = string | number | null | undefined;

type LibraryCourseItem = Course & {
  library_id?: NullableId;
  libraryId?: NullableId;
  course_id?: NullableId;
  courses_id?: NullableId;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const toSafeIdString = (value: NullableId) => {
  return value != null ? String(value).trim() : '';
};

const extractLibraryId = (res: any) => {
  const raw =
    res?.library_id ??
    res?.data?.library_id ??
    res?.result?.library_id ??
    res?.payload?.library_id;

  return toSafeIdString(raw);
};

const getItemLibraryId = (item: {
  library_id?: NullableId;
  libraryId?: NullableId;
  id?: NullableId;
}) => {
  const raw = item?.library_id ?? item?.libraryId ?? item?.id;
  return toSafeIdString(raw);
};

const getCourseId = (item: {
  courses_id?: NullableId;
  course_id?: NullableId;
  id?: NullableId;
}) => {
  const raw = item?.courses_id ?? item?.course_id ?? item?.id;
  return toSafeIdString(raw);
};

const MyCourseScreen = () => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const [tabs, setTabs] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [hiddenLibraryIds, setHiddenLibraryIds] = useState<string[]>([]);
  const isStartingRef = useRef(false);

  const navigation = useNavigation<CourseScreenNavProp>();
  const isFavoriteTab = tabs === 1;

  const {
    courses: libraryCourses,
    isLoading: libraryIsLoading,
    isLoadingMore: libraryIsLoadingMore,
    hasMore: libraryHasMore,
    handleLoadMore: libraryHandleLoadMore,
    refetch: libraryRefetch,
  } = useLibraryList({ searchValue, pageSize: PAGE_SIZE });

  const { updateLibraryStatus } = useUpdateLibraryStatus();

  const libraryCourseIds = useMemo(
    () =>
      new Set(
        libraryCourses.map(course => getCourseId(course)).filter(Boolean),
      ),
    [libraryCourses],
  );

  const favoriteList = useWhitelistStore(s => s.list);
  const whitelistMap = useWhitelistStore(s => s.map);

  const filteredFavorites = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    let list = favoriteList;

    if (q) {
      list = list.filter(c => c.label?.toLowerCase().includes(q));
    }

    return list.filter(c => {
      const courseId = getCourseId(c);
      return !courseId || !libraryCourseIds.has(courseId);
    });
  }, [favoriteList, searchValue, libraryCourseIds]);

  const { courses, isLoading, isLoadingMore, hasMore, handleLoadMore } =
    useMemo(() => {
      if (!isFavoriteTab) {
        return {
          courses: libraryCourses,
          isLoading: libraryIsLoading,
          isLoadingMore: libraryIsLoadingMore,
          hasMore: libraryHasMore,
          handleLoadMore: libraryHandleLoadMore,
        };
      }

      return {
        courses: filteredFavorites,
        isLoading: false,
        isLoadingMore: false,
        hasMore: false,
        handleLoadMore: () => {},
      };
    }, [
      isFavoriteTab,
      libraryCourses,
      libraryIsLoading,
      libraryIsLoadingMore,
      libraryHasMore,
      libraryHandleLoadMore,
      filteredFavorites,
    ]);

  const visibleCourses = useMemo(() => {
    if (isFavoriteTab) return courses;

    return courses.filter(item => {
      const libraryId = getItemLibraryId(item as LibraryCourseItem);
      return !libraryId || !hiddenLibraryIds.includes(libraryId);
    });
  }, [courses, hiddenLibraryIds, isFavoriteTab]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: { flex: 1 },
        container: { flex: 1, width: '100%' },

        profileHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: scale(12),
          marginTop: sharedTopSpace,
          marginHorizontal: scale(sharedPaddingHorizontal),
        },
        sectionHeader: {
          paddingTop: verticalScale(IS_TABLET ? 20 : 16),
          paddingBottom: verticalScale(IS_TABLET ? 20 : 16),
        },
        profileInfo: {
          flex: 1,
          minWidth: 0,
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: verticalScale(2),
        },

        // normal
        nameText: {
          textAlign: 'left',
        },
        emailText: {
          textAlign: 'left',
          color: AppColors.textTertiary,
        },

        // skeleton
        skeletonAvatar: {
          width: MY_COURSE_AVATAR_SIZE,
          height: MY_COURSE_AVATAR_SIZE,
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.backgroundInteractive,
        },
        skeletonTextGroup: {
          flex: 1,
          minWidth: 0,
          justifyContent: 'center',
          gap: verticalScale(6),
        },
        skeletonName: {
          width: scale(IS_TABLET ? 200 : 150),
          maxWidth: '90%',
          height: verticalScale(IS_TABLET ? 28 : 24),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.backgroundInteractive,
        },
        skeletonEmail: {
          width: scale(IS_TABLET ? 180 : 130),
          maxWidth: '100%',
          height: verticalScale(IS_TABLET ? 18 : 14),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.backgroundInteractive,
        },

        renderItemContainer: {
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },
        button: { flex: 1 },
        buttonContent: {
          paddingVertical: verticalScale(16),
        },
        emptyWrapper: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        loadMoreText: { textAlign: 'center', color: AppColors.textSecondary },
        loadMoreRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: verticalScale(8),
          marginBottom: verticalScale(4),
          gap: scale(8),
        },
        courseListContainer: {
          flexGrow: 1,
          gap: verticalScale(14),
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const isAuthenticated = useAuth(s => s.isAuthenticated);
  const fetchProfile = useProfile(s => s.fetchProfile);
  const profile = useProfile(s => s.profile);
  const isFetchingProfile = useProfile(s => s.isFetchingProfile);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;

      if (!profile) {
        fetchProfile();
      }

      libraryRefetch();

      return undefined;
    }, [isAuthenticated, profile, fetchProfile, libraryRefetch]),
  );

  const { updateWhitelist } = useCourseWhitelist();
  const { checkout } = useOrderCheckout();

  const handleToggleWhitelist = async (course: Course, next: boolean) => {
    await updateWhitelist(course, next);
  };

  const handleHideCard = useCallback(
    async (course: LibraryCourseItem) => {
      if (isFavoriteTab) return;

      const libraryId = getItemLibraryId(course);

      if (!libraryId) {
        log('Course', 'handleHideCard error: missing library_id', course);
        return;
      }

      setHiddenLibraryIds(prev => {
        if (prev.includes(libraryId)) return prev;
        return [...prev, libraryId];
      });

      try {
        await updateLibraryStatus({
          libraryId,
          status: 'HIDDEN',
        });

        await libraryRefetch();
      } catch (error) {
        setHiddenLibraryIds(prev => prev.filter(id => id !== libraryId));
        log('Course', 'handleHideCard error', error);
      }
    },
    [isFavoriteTab, updateLibraryStatus, libraryRefetch],
  );

  const handleOpenLibraryCourse = useCallback(
    async (item: LibraryCourseItem) => {
      const libraryId = getItemLibraryId(item);

      if (!libraryId) {
        log(
          'Course',
          'handleOpenLibraryCourse error: missing library_id',
          item,
        );
        return;
      }

      navigation.navigate('ClassRoom', {
        id: libraryId,
        autoPickFirstActivated: true,
      });
    },
    [navigation],
  );

  const handleStartLearnFavorite = useCallback(
    async (course: Course) => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      try {
        setIsProcessing(true);

        await updateWhitelist(course, false);

        const courseIdStr = getCourseId(course);
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
            'Course',
            '[MyCourseScreen] missing library_id after retries',
            lastRes,
          );
          return;
        }

        await libraryRefetch();

        navigation.navigate('ClassRoom', {
          id: libraryId,
          autoPickFirstActivated: true,
        });
      } catch (e) {
        log('Course', 'handleStartLearnFavorite error:', e);
      } finally {
        setIsProcessing(false);
        isStartingRef.current = false;
      }
    },
    [checkout, navigation, updateWhitelist, libraryRefetch],
  );

  useEffect(() => {
    if (isFavoriteTab) return;
    if (!libraryCourses.length) return;

    const latestIds = new Set(
      libraryCourses.map(item => getItemLibraryId(item)).filter(Boolean),
    );

    setHiddenLibraryIds(prev => prev.filter(id => latestIds.has(id)));
  }, [libraryCourses, isFavoriteTab]);

  useEffect(() => {
    if (tabs === 1) return;
    if (!searchValue.trim()) return;

    setHiddenLibraryIds([]);
  }, [tabs, searchValue]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardOpen(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardOpen(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const showProfileSkeleton = isFetchingProfile && !profile;

  /** Whether a search query is active — used to pick the right empty-state message. */
  const hasSearchQuery = searchValue.trim().length > 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.rootView}>
        <AppBackground pointerEvents="none" />

        <View style={styles.container}>
          <AppFlatList
            data={visibleCourses}
            keyExtractor={(item, index) => {
              if (isFavoriteTab) {
                const courseId = getCourseId(item as Course);
                return courseId
                  ? `favorite-${courseId}`
                  : `favorite-fallback-${index}`;
              }

              const libraryId = getItemLibraryId(item as LibraryCourseItem);
              if (libraryId) return `library-${libraryId}`;

              const fallbackCourseId = getCourseId(item as Course);
              return fallbackCourseId
                ? `library-course-${fallbackCourseId}-${index}`
                : `library-fallback-${index}`;
            }}
            withHorizontalPadding={false}
            contentContainerStyle={styles.courseListContainer}
            keyboardShouldPersistTaps="handled"
            staticHeader={
              <>
                <ListHeader
                  profile={profile ?? null}
                  courseCount={libraryCourses.length}
                  styles={styles}
                  showSkeleton={showProfileSkeleton}
                  onPressAvatar={() => navigation.navigate('Profile')}
                />

                <SectionHeader
                  search={searchValue}
                  setSearch={setSearchValue}
                  styles={styles}
                  handleSetTab={setTabs}
                  tab={tabs}
                  libraryCount={libraryCourses.length}
                  favoriteCount={filteredFavorites.length}
                />
              </>
            }
            renderItem={({ item }) => {
              const card = (
                <CourseHorizontalCard
                  id={item.id}
                  label={item.label}
                  cover_image={item.cover_image ?? ''}
                  teacher={item.join_CourseTeacher || item.teacher}
                  is_free={item.is_free}
                  price={item.price}
                  {...(isFavoriteTab
                    ? {
                        whitelist: !!whitelistMap[item.id],
                        onToggleWhitelist: (next: boolean) =>
                          handleToggleWhitelist(item as Course, next),
                      }
                    : { startLabel: 'เรียนต่อ' })}
                  onPress={() => {
                    if (keyboardOpen) return Keyboard.dismiss();

                    if (isFavoriteTab) {
                      navigation.navigate('CourseDetail', { id: item.id });
                      return;
                    }

                    handleOpenLibraryCourse(item as LibraryCourseItem);
                  }}
                  onPressStartLearn={() => {
                    if (keyboardOpen) return Keyboard.dismiss();

                    if (isFavoriteTab) {
                      handleStartLearnFavorite(item as Course);
                      return;
                    }

                    handleOpenLibraryCourse(item as LibraryCourseItem);
                  }}
                />
              );

              return (
                <View style={styles.renderItemContainer}>
                  {isFavoriteTab ? (
                    card
                  ) : (
                    <SwipeableCourseRow
                      onHide={() => handleHideCard(item as LibraryCourseItem)}
                    >
                      {card}
                    </SwipeableCourseRow>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.emptyWrapper}>
                  <ActivityIndicator size="small" color={AppColors.primary} />
                  <AppText
                    style={styles.loadMoreText}
                    fontSize={AppFontSize.caption}
                  >
                    กำลังโหลดคอร์ส...
                  </AppText>
                </View>
              ) : (
                <AppEmptyState
                  containerStyle={styles.emptyWrapper}
                  icon={
                    hasSearchQuery
                      ? 'search-outline'
                      : isFavoriteTab
                      ? 'heart-outline'
                      : 'book-outline'
                  }
                  title={
                    hasSearchQuery
                      ? 'ไม่พบคอร์สที่ค้นหา'
                      : isFavoriteTab
                      ? 'ยังไม่มีรายการโปรด'
                      : 'ยังไม่มีคอร์สเรียน'
                  }
                  description={
                    hasSearchQuery
                      ? `ไม่พบคอร์สที่ตรงกับ "${searchValue.trim()}" ลองใช้คำค้นอื่นดู`
                      : isFavoriteTab
                      ? 'แตะรูปหัวใจที่คอร์สเพื่อบันทึกไว้ที่นี่'
                      : 'คอร์สที่คุณซื้อหรือลงทะเบียนจะแสดงที่นี่'
                  }
                />
              )
            }
            footer={
              !isFavoriteTab &&
              isLoadingMore &&
              visibleCourses.length > 0 &&
              hasMore ? (
                <View style={styles.loadMoreRow}>
                  <ActivityIndicator size="small" color={AppColors.primary} />
                  <AppText
                    style={styles.loadMoreText}
                    fontSize={AppFontSize.caption}
                  >
                    กำลังโหลดเพิ่ม...
                  </AppText>
                </View>
              ) : null
            }
            onEndReached={() => {
              if (!isFavoriteTab && !isLoadingMore && hasMore) {
                handleLoadMore();
              }
            }}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <AppLoadingOverlay visible={isProcessing} message="กำลังดำเนินการ" />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default MyCourseScreen;
