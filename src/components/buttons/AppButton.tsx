import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import type { AppButtonProps } from '../../types/ui/buttons/app-button.props';
import AppText from '../texts/AppText';

type BackgroundContainerProps = {
  isSolid: boolean;
  disabledOrLoading: boolean;
  backgroundColor: string;
  gradientColors: ReadonlyArray<string | number>;
  gradientLocations?: number[];
  gradientAngle: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const BackgroundContainer: React.FC<BackgroundContainerProps> = ({
  isSolid,
  disabledOrLoading,
  backgroundColor,
  gradientColors,
  gradientLocations,
  gradientAngle,
  style,
  children,
}) => {
  if (isSolid) {
    return (
      <View
        style={[
          {
            backgroundColor: disabledOrLoading
              ? AppColors.disabled
              : backgroundColor,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[...gradientColors]}
      locations={gradientLocations}
      useAngle
      angle={gradientAngle}
      angleCenter={{ x: 0.5, y: 0.5 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
};

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,

  disabled = false,
  loading = false,
  fullWidth = true,

  containerStyle,
  contentStyle,
  textStyle,

  backgroundColor = AppColors.primary,
  radius = 100,
  opacity = 1,

  fontColor = AppColors.white,
  fontSize = 16,
  fontWeight = 'medium',

  activeOpacity = 0.8,

  useGradient = true,
  gradientColors = AppColors.appButtonGradient,
  gradientLocations,
  gradientAngle = 182.96,

  enforceMinTap = true,
  secondary = false,
}) => {
  const { verticalScale, scale, responsiveRadius, MIN_TAP } = useResponsive();

  const disabledOrLoading = disabled || loading;
  const isSolid = disabledOrLoading || secondary || !useGradient;

  // Secondary buttons use a subtle surface with a border to read lighter than the primary.
  const resolvedBackgroundColor = secondary
    ? AppColors.surface
    : backgroundColor;
  const resolvedFontColor = secondary ? AppColors.textSecondary : fontColor;

  const flattenedContainerStyle = StyleSheet.flatten(containerStyle) as
    | ViewStyle
    | undefined;

  const hasExplicitHeight =
    flattenedContainerStyle?.height != null ||
    flattenedContainerStyle?.minHeight != null;

  const baseContainer: ViewStyle = {
    borderRadius: responsiveRadius(radius),
    opacity,
    ...(secondary
      ? {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
        }
      : null),
    alignSelf: fullWidth ? 'stretch' : 'center',
    overflow: 'hidden',
  };

  const baseContent: ViewStyle = {
    flexDirection: 'row',
    gap: scale(8),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
    ...(hasExplicitHeight
      ? {
          height: '100%',
          paddingVertical: 0,
        }
      : {
          paddingVertical: verticalScale(14),
        }),
    ...(enforceMinTap && !hasExplicitHeight ? { minHeight: MIN_TAP } : null),
  };

  return (
    <BackgroundContainer
      isSolid={isSolid}
      disabledOrLoading={disabledOrLoading}
      backgroundColor={resolvedBackgroundColor}
      gradientColors={gradientColors}
      gradientLocations={gradientLocations}
      gradientAngle={gradientAngle}
      style={[baseContainer, containerStyle]}
    >
      <TouchableOpacity
        onPress={() => !disabledOrLoading && onPress?.()}
        activeOpacity={activeOpacity}
        disabled={disabledOrLoading}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabledOrLoading, busy: loading }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[baseContent, contentStyle]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={resolvedFontColor}
            accessibilityLabel="กำลังดำเนินการ"
          />
        ) : null}

        <AppText
          fontWeight={fontWeight}
          fontSize={fontSize}
          style={[styles.text, { color: resolvedFontColor }, textStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </AppText>
      </TouchableOpacity>
    </BackgroundContainer>
  );
};

export default AppButton;

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    flexShrink: 1,
    includeFontPadding: false,
  },
});
