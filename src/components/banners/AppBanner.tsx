import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Carousel from 'react-native-snap-carousel';

import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppBannerProps } from '../../types/ui/banner/app-banner.props';
import { AppColors } from '../../styles/colors';

const { width: screenWidth } = Dimensions.get('window');

type BannerSlide = {
  image: ImageSourcePropType;
  link?: string;
};

const extractCourseId = (link?: string) => {
  if (!link) return null;

  const parts = link.split('/course/');
  if (parts.length < 2) return null;

  return parts[1].split(/[/?#]/)[0];
};

type RootStackParamList = {
  CourseDetail: { id: string };
};

const AppBanner: React.FC<AppBannerProps> = ({
  source,
  sources,
  links,
  aspectRatio,
  style,
  autoSlideInterval = 7000,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { verticalScale, responsiveRadius, clamp, scale } = useResponsive();

  const [containerWidth, setContainerWidth] = useState(screenWidth);
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setContainerWidth(prev => (prev === w ? prev : w));
    }
  }, []);

  const slides: BannerSlide[] = useMemo(() => {
    if (sources?.length) {
      return sources.map((img, i) => ({
        image: img,
        link: links?.[i],
      }));
    }

    if (source) {
      return [{ image: source, link: links?.[0] }];
    }

    return [];
  }, [sources, source, links]);

  const baseRatio = useMemo(() => {
    if (aspectRatio) return aspectRatio;

    const baseSource = slides[0]?.image;
    if (!baseSource) return 16 / 9;

    if (typeof baseSource === 'number') {
      const resolved = Image.resolveAssetSource(baseSource);
      if (resolved?.width && resolved?.height) {
        return resolved.width / resolved.height;
      }
    }

    return 16 / 9;
  }, [aspectRatio, slides]);

  const sidePeek = scale(IS_TABLET ? 72 : 52);
  const itemWidth = Math.max(1, containerWidth - sidePeek * 2);

  const minH = IS_TABLET ? verticalScale(150) : verticalScale(110);
  const maxH = IS_TABLET ? verticalScale(260) : verticalScale(180);
  const bannerHeight = clamp(itemWidth / baseRatio, minH, maxH);

  const gap = scale(IS_TABLET ? 14 : 10);
  const slideInnerPadding = gap / 2;

  const markLoaded = useCallback((index: number) => {
    setLoadedMap(prev => {
      if (prev[index]) return prev;
      return { ...prev, [index]: true };
    });
  }, []);

  const onPressLink = useCallback(
    (link?: string) => {
      const courseId = extractCourseId(link);
      if (!courseId) return;

      navigation.navigate('CourseDetail', { id: courseId });
    },
    [navigation],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
          height: bannerHeight,
        },
        slideOuter: {
          paddingHorizontal: slideInnerPadding,
          height: '100%',
        },
        card: {
          width: '100%',
          height: '100%',
          borderRadius: responsiveRadius(IS_TABLET ? 14 : 10),
          overflow: 'hidden',
          backgroundColor: AppColors.sheetDeep,
        },
        image: {
          width: '100%',
          height: '100%',
        },
        placeholder: {
          ...StyleSheet.absoluteFill,
          backgroundColor: AppColors.sheetRaised,
        },
      }),
    [bannerHeight, responsiveRadius, slideInnerPadding],
  );

  if (!slides.length) return null;

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <Carousel<BannerSlide>
        data={slides}
        renderItem={({ item, index }: { item: BannerSlide; index: number }) => {
          const isLoaded = !!loadedMap[index];

          return (
            <View style={styles.slideOuter}>
              <Pressable
                style={styles.card}
                onPress={() => onPressLink(item.link)}
                disabled={!item.link}
              >
                {!isLoaded && <View style={styles.placeholder} />}

                <Image
                  source={item.image}
                  style={styles.image}
                  resizeMode="cover"
                  onLoadEnd={() => markLoaded(index)}
                />
              </Pressable>
            </View>
          );
        }}
        sliderWidth={containerWidth}
        itemWidth={itemWidth}
        vertical={false}
        activeSlideAlignment="center"
        inactiveSlideScale={IS_TABLET ? 0.95 : 0.9}
        inactiveSlideOpacity={0.7}
        loop={slides.length > 1}
        loopClonesPerSide={slides.length > 1 ? slides.length : 0}
        autoplay={slides.length > 1 && autoSlideInterval > 0}
        autoplayInterval={autoSlideInterval}
        scrollEnabled={slides.length > 1}
        enableSnap
      />
    </View>
  );
};

export default AppBanner;
