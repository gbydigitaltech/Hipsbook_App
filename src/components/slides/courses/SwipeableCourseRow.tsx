import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import AppText from '../../../components/texts/AppText';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';
import { AppRadius } from '../../../styles/sharedstyles';

type SwipeableCourseRowProps = {
  children: React.ReactNode;
  onHide: () => void;
};

type RightActionProps = {
  progress: any;
  onPress: () => void;
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  responsiveRadius: (size: number) => number;
};

const RightAction = ({
  progress,
  onPress,
  scale,
  verticalScale,
  responsiveRadius,
}: RightActionProps) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        actionWrap: {
          width: scale(100),
          height: '100%',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingLeft: scale(8),
        },
        action: {
          width: scale(92),
          height: '100%',
          backgroundColor: AppColors.cardBackground,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: responsiveRadius(AppRadius.md),
          paddingHorizontal: scale(12),
          paddingVertical: verticalScale(8),
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.15, 1],
      [0, 0.7, 1],
      Extrapolation.CLAMP,
    );

    const scaleValue = interpolate(
      progress.value,
      [0, 1],
      [0.98, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale: scaleValue }],
    };
  });

  return (
    <View style={styles.actionWrap}>
      <Animated.View style={animatedStyle}>
        <Pressable style={styles.action} onPress={onPress}>
          <AppText fontWeight="semiBold">ซ่อน</AppText>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const SwipeableCourseRow = ({ children, onHide }: SwipeableCourseRowProps) => {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        cardWrapper: {
          borderRadius: responsiveRadius(AppRadius.md),
          overflow: 'hidden',
        },
      }),
    [responsiveRadius],
  );

  const renderRightActions = useCallback(
    (progress: any) => (
      <RightAction
        progress={progress}
        scale={scale}
        verticalScale={verticalScale}
        responsiveRadius={responsiveRadius}
        onPress={() => {
          swipeableRef.current?.close();
          onHide();
        }}
      />
    ),
    [onHide, responsiveRadius, scale, verticalScale],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={scale(40)}
      friction={1.8}
    >
      <View style={dynamicStyles.cardWrapper}>{children}</View>
    </Swipeable>
  );
};

export default SwipeableCourseRow;
