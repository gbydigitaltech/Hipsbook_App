import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  CompositeNavigationProp,
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { log, logWarn } from '../../helpers/logger';

import { Ionicons } from '@react-native-vector-icons/ionicons';
import AppBackground from '../../components/background/AppBackground';
import CourseHorizontalCard from '../../components/cards/CourseHorizontalCard';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import AppEmptyState from '../../components/states/AppEmptyState';
import Search, { SEARCH_BAR_HEIGHT } from '../../components/search/Search';
import AppText from '../../components/texts/AppText';
import AppFlatList from '../../components/views/AppFlatList';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import {
  LocalCourseFilterState,
  useCourseList,
} from '../../hooks/course/useCourseList';
import { useWhitelist } from '../../hooks/course/useWhitelist';
import { useUpdateLibraryStatus } from '../../hooks/library/useUpdateLibraryStatus';
import { useOrderCheckout } from '../../hooks/orders/useOrderCheckout';
import { useWhitelistStore } from '../../stores/whitelist';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
  sharedTopSpace,
} from '../../styles/sharedstyles';
import { Course } from '../../types/data/courses/course.type';
import {
  AppStackParamList,
  BottomTabParamList,
} from '../../types/data/navigation/navigation.types';
import CourseFilterModal, { CourseFilterState } from './CourseFilterModal';

const PAGE_SIZE = 10;
const DEFAULT_TITLE = 'คอร์สทั้งหมด';
const DEFAULT_TAG = 'ทั้งหมด';

type CourseTabNavProp = BottomTabNavigationProp<BottomTabParamList, 'Course'>;
type RootStackNavProp = NativeStackNavigationProp<AppStackParamList>;
type CourseScreenNavProp = CompositeNavigationProp<
  CourseTabNavProp,
  RootStackNavProp
>;
type CourseRouteProp = RouteProp<BottomTabParamList, 'Course'>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Pick library_id from different possible response shapes. */
const extractLibraryId = (res: any) => {
  const raw =
    res?.library_id ??
    res?.data?.library_id ??
    res?.result?.library_id ??
    res?.payload?.library_id;

  return typeof raw === 'string' ? raw.trim() : '';
};

const CourseScreen = () => {
  const navigation = useNavigation<CourseScreenNavProp>();
  const route = useRoute<CourseRouteProp>();
  const listRef = useRef<any>(null);

  const { scale, verticalScale } = useResponsive();
  const searchBarHeight = verticalScale(SEARCH_BAR_HEIGHT);
  const { updateWhitelist } = useWhitelist();
  const { updateLibraryStatus } = useUpdateLibraryStatus();
  const { checkout } = useOrderCheckout();
  const whitelistMap = useWhitelistStore(s => s.map);

  const [isProcessing, setIsProcessing] = useState(false);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [selectedTag, setSelectedTag] = useState(DEFAULT_TAG);
  const [searchText, setSearchText] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<LocalCourseFilterState>({});
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  const isStartingRef = useRef(false);

  const { courses, isLoading, isLoadingMore, hasMore, handleLoadMore } =
    useCourseList({
      selected: selectedTag,
      filters,
      searchValue,
      pageSize: PAGE_SIZE,
    });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: {
          flex: 1,
        },
        headerRow: {
          marginTop: sharedTopSpace,
          marginBottom: verticalScale(IS_TABLET ? 24 : 18),
        },
        title: {
          marginBottom: verticalScale(12),
        },
        filterBtn: {
          width: searchBarHeight,
          height: searchBarHeight,
          borderRadius: scale(16),
          backgroundColor: AppColors.backgroundInteractive,
          alignItems: 'center',
          justifyContent: 'center',
        },
        filterDot: {
          position: 'absolute',
          top: scale(9),
          right: scale(9),
          width: scale(8),
          height: scale(8),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.primary,
        },
        courseListContainer: {
          gap: verticalScale(14),
          paddingBottom: verticalScale(8),
        },
        loadMoreRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: verticalScale(8),
          marginBottom: verticalScale(4),
          gap: scale(8),
        },
        loadMoreText: {
          textAlign: 'center',
          color: AppColors.textSecondary,
        },
        emptyWrapper: {
          marginTop: verticalScale(40),
          alignItems: 'center',
        },
      }),
    [scale, verticalScale, searchBarHeight],
  );

  const hasActiveFilters = useMemo(
    () =>
      Object.values(filters).some(v =>
        Array.isArray(v) ? v.length > 0 : v != null && v !== '',
      ),
    [filters],
  );

  const scrollToTop = useCallback(() => {
    if (listRef.current?.scrollToOffset) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
      return;
    }

    if (listRef.current?.scrollToIndex) {
      listRef.current.scrollToIndex({ index: 0, animated: true });
    }
  }, []);

  const resetToDefaultState = useCallback(() => {
    Keyboard.dismiss();
    setTitle(DEFAULT_TITLE);
    setSelectedTag(DEFAULT_TAG);
    setSearchText('');
    setSearchValue('');
    setFilters({});
    setFilterVisible(false);
    setSearchKey(prev => prev + 1);
    scrollToTop();
  }, [scrollToTop]);

  const getExistingLibraryId = useCallback((course: Course) => {
    return course.library_id ?? (course.library as any)?.id;
  }, []);

  const openExistingLibraryCourse = useCallback(
    async (course: Course) => {
      const existingLibraryId = getExistingLibraryId(course);

      if (!existingLibraryId) return false;

      await updateLibraryStatus({
        libraryId: existingLibraryId,
        status: 'SHOW',
      });

      navigation.navigate('ClassRoom', { id: existingLibraryId });
      return true;
    },
    [getExistingLibraryId, navigation, updateLibraryStatus],
  );

  const handleSearchSubmit = useCallback(() => {
    setSearchValue(searchText.trim().replace(/^#/, ''));
  }, [searchText]);

  const handleToggleWhitelist = useCallback(
    async (course: Course, next: boolean) => {
      await updateWhitelist(course, next);
    },
    [updateWhitelist],
  );

  const handleGoToLibrary = useCallback(
    async (course: Course) => {
      await openExistingLibraryCourse(course);
    },
    [openExistingLibraryCourse],
  );

  const handleStartLearn = useCallback(
    async (course: Course) => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      try {
        const openedExistingCourse = await openExistingLibraryCourse(course);
        if (openedExistingCourse) return;

        setIsProcessing(true);

        const isInWhitelist =
          course.whitelist === true || !!whitelistMap[course.id];

        if (isInWhitelist) {
          await updateWhitelist(course, false);
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
            'Course',
            '[CourseScreen] missing library_id after retries',
            lastRes,
          );
          return;
        }

        navigation.navigate('ClassRoom', { id: libraryId });
      } catch (e) {
        log('Course', 'handleStartLearn error:', e);
      } finally {
        setIsProcessing(false);
        isStartingRef.current = false;
      }
    },
    [
      checkout,
      navigation,
      openExistingLibraryCourse,
      updateWhitelist,
      whitelistMap,
    ],
  );

  useEffect(() => {
    const nextCategoryIds = route.params?.initialCategoryIds ?? [];
    const nextTitle = route.params?.initialTitle?.trim();
    const nextTag = route.params?.initialTag?.trim();

    const hasRouteCategory = nextCategoryIds.length > 0;
    const hasRouteTitle = !!nextTitle;
    const hasRouteTag = !!nextTag;

    if (!hasRouteCategory && !hasRouteTitle && !hasRouteTag) return;

    Keyboard.dismiss();
    setSearchText('');
    setSearchValue('');
    setFilterVisible(false);

    setTitle(nextTitle || DEFAULT_TITLE);
    setSelectedTag(nextTag || DEFAULT_TAG);
    setFilters(
      hasRouteCategory
        ? {
            category: nextCategoryIds,
          }
        : {},
    );

    setSearchKey(prev => prev + 1);
    scrollToTop();
  }, [
    route.params?.initialCategoryIds,
    route.params?.initialTitle,
    route.params?.initialTag,
    scrollToTop,
  ]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      resetToDefaultState();
    });

    return unsubscribe;
  }, [navigation, resetToDefaultState]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchText('');
        setSearchValue('');
        Keyboard.dismiss();
        setSearchKey(prev => prev + 1);
      };
    }, []),
  );

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppLoadingOverlay visible={isProcessing} message="กำลังดำเนินการ" />

      <AppFlatList
        ref={listRef}
        data={courses}
        keyExtractor={item => item.id}
        withHorizontalPadding
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.courseListContainer}
        onEndReached={() => {
          if (hasMore) handleLoadMore();
        }}
        onEndReachedThreshold={1}
        showsVerticalScrollIndicator={false}
        staticHeader={
          <View style={styles.headerRow}>
            <AppText
              style={styles.title}
              fontSize={AppFontSize.h1}
              fontWeight="semiBold"
            >
              {title}
            </AppText>

            <Search
              key={searchKey}
              value={searchText}
              onChangeText={text => {
                setSearchText(text);
                const trimmed = text.trim();
                setSearchValue(trimmed ? trimmed.replace(/^#/, '') : '');
              }}
              onSubmit={handleSearchSubmit}
              withHorizontalPadding={false}
              trailingAction={
                <TouchableOpacity
                  style={styles.filterBtn}
                  activeOpacity={PRESSED_OPACITY}
                  accessibilityRole="button"
                  accessibilityLabel="ตัวกรองคอร์ส"
                  onPress={() => {
                    Keyboard.dismiss();
                    setFilterVisible(true);
                  }}
                >
                  <Ionicons
                    name="options-outline"
                    size={IS_TABLET ? 24 : 20}
                    color={AppColors.white}
                  />
                  {hasActiveFilters && <View style={styles.filterDot} />}
                </TouchableOpacity>
              }
            />
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyWrapper}>
              <ActivityIndicator
                size={IS_TABLET ? 'large' : 'small'}
                color={AppColors.primary}
              />
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
              icon="book-outline"
              title="ไม่พบคอร์สที่ค้นหา"
              description="ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูคอร์สทั้งหมด"
            />
          )
        }
        footer={
          isLoadingMore && courses.length > 0 && hasMore ? (
            <View style={styles.loadMoreRow}>
              <ActivityIndicator
                size={IS_TABLET ? 'large' : 'small'}
                color={AppColors.primary}
              />
              <AppText
                style={styles.loadMoreText}
                fontSize={AppFontSize.caption}
              >
                กำลังโหลดเพิ่ม...
              </AppText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <CourseHorizontalCard
            id={item.id}
            label={item.label}
            cover_image={item.cover_image ?? ''}
            teacher={item.teacher}
            is_free={item.is_free}
            price={item.price}
            whitelist={whitelistMap[item.id] ?? !!item.whitelist}
            library_id={item.library_id}
            library={item.library}
            onToggleWhitelist={next =>
              handleToggleWhitelist(item as Course, next)
            }
            onPress={async () => {
              if (isKeyboardVisible) {
                Keyboard.dismiss();
                return;
              }

              const openedExistingCourse = await openExistingLibraryCourse(
                item as Course,
              );

              if (openedExistingCourse) return;

              navigation.navigate('CourseDetail', { id: item.id });
            }}
            onPressStartLearn={() => handleStartLearn(item as Course)}
            onPressBuy={() => handleStartLearn(item as Course)}
            onPressGoToLibrary={() => handleGoToLibrary(item as Course)}
          />
        )}
      />

      <CourseFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={(payload: CourseFilterState) => setFilters(payload)}
      />
    </View>
  );
};

export default CourseScreen;
