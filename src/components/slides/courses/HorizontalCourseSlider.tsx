import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { useResponsive } from '../../../helpers/responsive';

import { IS_TABLET } from '../../../constants/platform';
import { AppColors } from '../../../styles/colors';
import { HorizontalCourseSliderProps } from '../../../types/ui/slides/course/course-slider.props';
import CourseHorizontalCard from '../../cards/CourseHorizontalCard';
import { AppRadius } from '../../../styles/sharedstyles';

const DEFAULT_AUTO_SLIDE_INTERVAL = 5000;
const DEFAULT_AUTOPLAY_DELAY = 500;
const DEFAULT_SKELETON_COUNT = 3;

const HorizontalCourseSliderSkeletonCard = React.memo(() => {
  const { scale, verticalScale, responsiveRadius, responsiveSpacing } =
    useResponsive();

  const avatarSize = scale(IS_TABLET ? 32 : 26);
  const padding = responsiveSpacing(IS_TABLET ? 12 : 10);
  const fixedHeight = verticalScale(IS_TABLET ? 168 : 140);
  const imageSize = fixedHeight - padding * 2;
  const buttonHeight = verticalScale(IS_TABLET ? 44 : 40);
  const actionButtonRadius = responsiveRadius(AppRadius.pill);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardContainer: {
          flexDirection: 'row',
          alignItems: 'stretch',
          backgroundColor: AppColors.cardBackground,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.md),
          padding,
          gap: scale(IS_TABLET ? 20 : 16),
          height: fixedHeight,
        },
        cover: {
          flexShrink: 0,
          width: imageSize,
          height: imageSize,
          borderRadius: responsiveRadius(AppRadius.sm),
          backgroundColor: AppColors.surfaceSubtle,
          borderWidth: 1,
          borderColor: AppColors.borderStrong,
        },
        infoContainer: {
          flex: 1,
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          minWidth: 0,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
        },
        titleBlock: {
          flex: 1,
          minWidth: 0,
          gap: verticalScale(6),
        },
        titleLineLong: {
          width: '92%',
          height: verticalScale(IS_TABLET ? 18 : 14),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
        },
        titleLineShort: {
          width: '62%',
          height: verticalScale(IS_TABLET ? 18 : 14),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
        },
        sideIcon: {
          width: scale(IS_TABLET ? 32 : 28),
          height: scale(IS_TABLET ? 32 : 28),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
          marginLeft: scale(IS_TABLET ? 10 : 8),
        },
        teacherRow: {
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          gap: scale(6),
          minHeight: verticalScale(IS_TABLET ? 28 : 24),
        },
        teacherAvatar: {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          borderWidth: 1,
          borderColor: AppColors.borderStrong,
          backgroundColor: AppColors.surfaceStrong,
        },
        teacherName: {
          width: '36%',
          height: verticalScale(IS_TABLET ? 14 : 12),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
        },
        teacherBadge: {
          width: scale(IS_TABLET ? 34 : 28),
          height: verticalScale(IS_TABLET ? 24 : 20),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
        },
        actionButton: {
          width: '60%',
          alignSelf: 'flex-end',
          height: buttonHeight,
          borderRadius: actionButtonRadius,
          backgroundColor: AppColors.backgroundInteractive,
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
      actionButtonRadius,
      avatarSize,
      buttonHeight,
      fixedHeight,
      imageSize,
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

const HorizontalCourseSlider: React.FC<HorizontalCourseSliderProps> =
  React.memo(
    ({
      data,
      itemWidth,
      gap,
      containerStyle,
      autoSlideInterval = DEFAULT_AUTO_SLIDE_INTERVAL,
      autoplayDelayMs = DEFAULT_AUTOPLAY_DELAY,
      onReachEnd,
      hasMore = false,
      loadingMore = false,
      reachEndThreshold = 2,
      loading = false,
      skeletonCount = DEFAULT_SKELETON_COUNT,
    }) => {
      const { scale } = useResponsive();
      const { width: screenWidth } = useWindowDimensions();

      type SliderItem = HorizontalCourseSliderProps['data'][number];
      type SkeletonItem = { id: string };

      const carouselRef = useRef<Carousel<SliderItem | SkeletonItem>>(null);
      const lastTriggeredLengthRef = useRef(0);

      const [containerWidth, setContainerWidth] = useState<number | null>(null);
      const [cardHeight, setCardHeight] = useState<number | null>(null);
      const didMeasureHeightRef = useRef(false);

      const sliderGap = gap ?? scale(12);

      const shouldLoop = !!data && data.length > 1 && !hasMore;

      const handleRootLayout = useCallback((e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        setContainerWidth(prev => (w > 0 && w !== prev ? w : prev));
      }, []);

      const widthForCarousel = containerWidth ?? 0;
      const baseWidth = widthForCarousel > 0 ? widthForCarousel : screenWidth;
      const carouselItemWidth = baseWidth;

      const cardWidth = useMemo(() => {
        const resolved = itemWidth ?? baseWidth - sliderGap;
        return Math.max(Math.min(resolved, baseWidth), 0);
      }, [itemWidth, baseWidth, sliderGap]);

      const handleCardLayout = useCallback((e: LayoutChangeEvent) => {
        if (didMeasureHeightRef.current) return;

        const h = e.nativeEvent.layout.height;
        if (h > 0) {
          didMeasureHeightRef.current = true;
          setCardHeight(h);
        }
      }, []);

      const handleSnapToItem = useCallback(
        (index: number) => {
          carouselRef.current?.startAutoplay();

          if (!onReachEnd || !hasMore || loadingMore || data.length === 0) {
            return;
          }

          const isNearEnd =
            data.length - 1 - index <= Math.max(reachEndThreshold, 0);

          if (!isNearEnd) return;

          if (lastTriggeredLengthRef.current === data.length) return;

          lastTriggeredLengthRef.current = data.length;
          onReachEnd();
        },
        [data.length, hasMore, loadingMore, onReachEnd, reachEndThreshold],
      );

      const sliderHeight = cardHeight ?? scale(220);
      const clonesPerSide = Math.min(2, data?.length ?? 0);

      const skeletonData = useMemo(
        () =>
          Array.from({ length: Math.max(1, skeletonCount) }, (_, index) => ({
            id: `horizontal-skeleton-${index}`,
          })),
        [skeletonCount],
      );

      const styles = useMemo(
        () =>
          StyleSheet.create({
            root: {
              width: '100%',
              height: sliderHeight,
            } as ViewStyle,
            slideOuter: {
              width: carouselItemWidth,
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            } as ViewStyle,
            cardContainer: {
              width: cardWidth,
            } as ViewStyle,
          }),
        [sliderHeight, carouselItemWidth, cardWidth],
      );

      const renderItem = useCallback(
        ({ item }: { item: SliderItem }) => (
          <View style={styles.slideOuter}>
            <View style={styles.cardContainer} onLayout={handleCardLayout}>
              <CourseHorizontalCard {...item} />
            </View>
          </View>
        ),
        [styles, handleCardLayout],
      );

      const renderSkeletonItem = useCallback(
        ({ item }: { item: SkeletonItem }) => (
          <View style={styles.slideOuter}>
            <View style={styles.cardContainer} onLayout={handleCardLayout}>
              <HorizontalCourseSliderSkeletonCard key={item.id} />
            </View>
          </View>
        ),
        [styles, handleCardLayout],
      );

      if (loading) {
        const shouldLoopSkeleton = skeletonData.length > 1;

        return (
          <View
            style={[styles.root, containerStyle]}
            onLayout={handleRootLayout}
          >
            {widthForCarousel > 0 && cardWidth > 0 ? (
              <Carousel<SkeletonItem>
                data={skeletonData}
                renderItem={renderSkeletonItem}
                sliderWidth={widthForCarousel}
                itemWidth={carouselItemWidth}
                activeSlideAlignment="center"
                loop={shouldLoopSkeleton}
                loopClonesPerSide={Math.min(2, skeletonData.length)}
                autoplay={false}
                inactiveSlideOpacity={1}
                inactiveSlideScale={1}
                vertical={false}
              />
            ) : null}
          </View>
        );
      }

      if (!data || data.length === 0) return null;

      return (
        <View style={[styles.root, containerStyle]} onLayout={handleRootLayout}>
          {widthForCarousel > 0 && cardWidth > 0 ? (
            <Carousel<SliderItem>
              ref={carouselRef as React.RefObject<Carousel<SliderItem>>}
              data={data}
              renderItem={renderItem}
              sliderWidth={widthForCarousel}
              itemWidth={carouselItemWidth}
              activeSlideAlignment="center"
              loop={shouldLoop}
              loopClonesPerSide={clonesPerSide}
              autoplay={shouldLoop}
              autoplayInterval={autoSlideInterval}
              autoplayDelay={autoplayDelayMs}
              inactiveSlideOpacity={1}
              inactiveSlideScale={1}
              vertical={false}
              onSnapToItem={handleSnapToItem}
            />
          ) : null}
        </View>
      );
    },
  );

export default HorizontalCourseSlider;
