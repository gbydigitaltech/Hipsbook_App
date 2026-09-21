import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { IS_TABLET } from '../../../constants/platform';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';
import { VerticalCourseSliderProps } from '../../../types/ui/slides/course/course-slider.props';
import CourseVerticalCard from '../../cards/CourseVerticalCard';
import { AppRadius } from '../../../styles/sharedstyles';

const DEFAULT_AUTO_SLIDE_INTERVAL = 5000;
const DEFAULT_AUTOPLAY_DELAY = 500;
const DEFAULT_SKELETON_COUNT = 3;

const VerticalCourseSliderSkeletonCard = React.memo(() => {
  const { scale, verticalScale, responsiveRadius, responsiveSpacing } =
    useResponsive();

  const avatarSize = scale(IS_TABLET ? 30 : 26);
  const padding = responsiveSpacing(IS_TABLET ? 12 : 10);
  const fixedHeight = verticalScale(IS_TABLET ? 372 : 310);
  const cardWidth = scale(IS_TABLET ? 264 : 220);
  const cardRadius = responsiveRadius(AppRadius.md);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardContainer: {
          height: fixedHeight,
          width: cardWidth,
          borderRadius: cardRadius,
          backgroundColor: AppColors.cardBackground,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          overflow: 'hidden',
        },
        cover: {
          width: '100%',
          aspectRatio: 4 / 3,
          backgroundColor: AppColors.surfaceSubtle,
          borderTopLeftRadius: cardRadius,
          borderTopRightRadius: cardRadius,
          borderWidth: 1,
          borderColor: AppColors.borderStrong,
        },
        infoContainer: {
          flex: 1,
          paddingHorizontal: padding,
          paddingTop: verticalScale(4),
          paddingBottom: padding,
          justifyContent: 'space-around',
          gap: verticalScale(6),
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: scale(8),
        },
        titleBlock: {
          flex: 1,
          gap: verticalScale(6),
        },
        titleLineLong: {
          height: verticalScale(IS_TABLET ? 18 : 14),
          width: '92%',
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
        },
        titleLineShort: {
          height: verticalScale(IS_TABLET ? 18 : 14),
          width: '68%',
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
        },
        sideIcon: {
          width: scale(IS_TABLET ? 34 : 28),
          height: scale(IS_TABLET ? 34 : 28),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
          marginTop: verticalScale(2),
        },
        teacherRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          minHeight: verticalScale(IS_TABLET ? 26 : 22),
        },
        teacherAvatar: {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: AppColors.surfaceStrong,
          borderWidth: 1,
          borderColor: AppColors.borderStrong,
        },
        teacherName: {
          height: verticalScale(IS_TABLET ? 14 : 12),
          width: '44%',
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
        },
        teacherBadge: {
          height: verticalScale(IS_TABLET ? 24 : 20),
          width: scale(IS_TABLET ? 34 : 28),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
        },
        actionButton: {
          marginTop: verticalScale(2),
          backgroundColor: AppColors.backgroundInteractive,
          borderRadius: responsiveRadius(AppRadius.pill),
          height: verticalScale(40),
          alignItems: 'center',
          justifyContent: 'center',
        },
        actionText: {
          width: '42%',
          height: verticalScale(IS_TABLET ? 14 : 12),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surfaceActive,
        },
      }),
    [
      avatarSize,
      cardRadius,
      cardWidth,
      fixedHeight,
      padding,
      responsiveRadius,
      scale,
      verticalScale,
    ],
  );

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cover} />
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <View style={styles.titleLineLong} />
            <View style={styles.titleLineShort} />
          </View>
          <View style={styles.sideIcon} />
        </View>

        <View style={styles.teacherRow}>
          <View style={styles.teacherAvatar} />
          <View style={styles.teacherName} />
          <View style={styles.teacherBadge} />
        </View>

        <View style={styles.actionButton}>
          <View style={styles.actionText} />
        </View>
      </View>
    </View>
  );
});

VerticalCourseSliderSkeletonCard.displayName =
  'VerticalCourseSliderSkeletonCard';

const VerticalCourseSlider: React.FC<VerticalCourseSliderProps> = React.memo(
  ({
    data,
    gap = 8,
    containerStyle,
    autoSlideInterval = DEFAULT_AUTO_SLIDE_INTERVAL,
    autoplayDelayMs = DEFAULT_AUTOPLAY_DELAY,
    loading = false,
    skeletonCount = DEFAULT_SKELETON_COUNT,
  }) => {
    const { scale, verticalScale } = useResponsive();
    const { width: screenWidth } = useWindowDimensions();

    const carouselRef = useRef<Carousel<any> | null>(null);

    const cardWidth = useMemo(() => scale(IS_TABLET ? 264 : 220), [scale]);

    const sliderHeight = verticalScale(IS_TABLET ? 372 : 310);

    useEffect(() => {
      if (loading || !data || data.length === 0) return;
      const id = setTimeout(() => {
        carouselRef.current?.snapToItem?.(0, false);
      }, 50);
      return () => clearTimeout(id);
    }, [loading, data]);

    const styles = useMemo(
      () =>
        StyleSheet.create({
          root: {
            width: screenWidth,
            height: sliderHeight,
          } as ViewStyle,
          slideInner: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: gap,
          },
        }),
      [screenWidth, sliderHeight, gap],
    );

    type ItemType = VerticalCourseSliderProps['data'][number];

    const skeletonData = useMemo(
      () =>
        Array.from({ length: Math.max(1, skeletonCount) }, (_, index) => ({
          id: `skeleton-${index}`,
        })),
      [skeletonCount],
    );

    const renderSkeletonItem = useCallback(
      ({ item }: { item: { id: string } }) => (
        <View style={styles.slideInner}>
          <VerticalCourseSliderSkeletonCard key={item.id} />
        </View>
      ),
      [styles.slideInner],
    );

    const renderItem = useCallback(
      ({ item }: { item: ItemType }) => (
        <View style={styles.slideInner}>
          <CourseVerticalCard {...item} />
        </View>
      ),
      [styles.slideInner],
    );

    if (loading) {
      const shouldLoopSkeleton = skeletonData.length > 1;

      return (
        <View style={[styles.root, containerStyle]}>
          <Carousel<{ id: string }>
            data={skeletonData}
            renderItem={renderSkeletonItem}
            sliderWidth={screenWidth}
            itemWidth={cardWidth + gap * 2}
            vertical={false}
            activeSlideAlignment="center"
            inactiveSlideScale={0.9}
            inactiveSlideOpacity={0.5}
            loop={shouldLoopSkeleton}
            loopClonesPerSide={1}
            autoplay={false}
            scrollEnabled={shouldLoopSkeleton}
            enableSnap
            firstItem={0}
          />
        </View>
      );
    }

    if (!data || data.length === 0) return null;

    const shouldLoop = data.length > 1;

    return (
      <View style={[styles.root, containerStyle]}>
        <Carousel<ItemType>
          ref={carouselRef}
          data={data}
          renderItem={renderItem}
          sliderWidth={screenWidth}
          itemWidth={cardWidth + gap * 2}
          vertical={false}
          activeSlideAlignment="center"
          inactiveSlideScale={0.9}
          inactiveSlideOpacity={0.5}
          loop={shouldLoop}
          loopClonesPerSide={data.length > 2 ? 2 : 1}
          autoplay={shouldLoop}
          autoplayInterval={autoSlideInterval}
          autoplayDelay={autoplayDelayMs}
          scrollEnabled={shouldLoop}
          enableSnap
          firstItem={0}
        />
      </View>
    );
  },
);

VerticalCourseSlider.displayName = 'VerticalCourseSlider';

export default VerticalCourseSlider;
