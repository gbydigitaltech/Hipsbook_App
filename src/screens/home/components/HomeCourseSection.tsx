import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import AppSectionHeader from '../../../components/sections/AppSectionHeader';
import HorizontalCourseSlider from '../../../components/slides/courses/HorizontalCourseSlider';
import VerticalCourseSlider from '../../../components/slides/courses/VerticalCourseSlider';
import AppText from '../../../components/texts/AppText';
import { IS_TABLET } from '../../../constants/platform';
import { useResponsive } from '../../../helpers/responsive';
import {
  AppFontSize,
  sharedPaddingHorizontal,
} from '../../../styles/sharedstyles';
import { SliderCourseItem } from '../../../types/ui/slides/course/course-slider.props';

const { width: screenWidth } = Dimensions.get('window');

/** Home section heading sizes (larger on tablet) */
export const HOME_SECTION_TITLE_FONT = IS_TABLET
  ? AppFontSize.h1
  : AppFontSize.title;
export const HOME_SECTION_SEE_ALL_FONT = IS_TABLET
  ? AppFontSize.body
  : AppFontSize.caption;

type HomeCourseSectionProps = {
  title: string;
  data: SliderCourseItem[];
  variant?: 'vertical' | 'horizontal';
  useSectionHeader?: boolean;
  onPressSeeAll?: () => void;
  seeAllLabel?: string;
  autoSlideInterval?: number;
  loading?: boolean;
  skeletonCount?: number;
};

const HomeCourseSection: React.FC<HomeCourseSectionProps> = ({
  title,
  data,
  variant = 'vertical',
  useSectionHeader = false,
  onPressSeeAll,
  seeAllLabel = 'ดูทั้งหมด',
  autoSlideInterval = 5000,
  loading = false,
  skeletonCount = 3,
}) => {
  const { scale, verticalScale } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: verticalScale(12),
        },
        header: {
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },
        sliderContainer: {
          width: screenWidth,
          alignSelf: 'center',
        },
      }),
    [scale, verticalScale],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {useSectionHeader ? (
          <AppSectionHeader
            title={title}
            titleFontSize={HOME_SECTION_TITLE_FONT}
            seeAllFontSize={HOME_SECTION_SEE_ALL_FONT}
            onPressSeeAll={onPressSeeAll}
            seeAllLabel={seeAllLabel}
          />
        ) : (
          <AppText fontWeight="medium" fontSize={AppFontSize.title}>
            {title}
          </AppText>
        )}
      </View>

      <View style={styles.sliderContainer}>
        {variant === 'horizontal' ? (
          <HorizontalCourseSlider
            data={data}
            autoSlideInterval={autoSlideInterval}
            loading={loading}
            skeletonCount={1}
          />
        ) : (
          <VerticalCourseSlider
            data={data}
            autoSlideInterval={autoSlideInterval}
            loading={loading}
            skeletonCount={skeletonCount}
          />
        )}
      </View>
    </View>
  );
};

export default React.memo(HomeCourseSection);
