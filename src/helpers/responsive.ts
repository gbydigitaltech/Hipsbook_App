import { PixelRatio, useWindowDimensions } from 'react-native';
import { IS_TABLET } from '../constants/platform';

const PHONE_BASE_WIDTH = 393;
const PHONE_BASE_HEIGHT = 852;

const TABLET_BASE_WIDTH = 768;
const TABLET_BASE_HEIGHT = 1024;

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const isLandscape = width > height;

  const BASE_WIDTH = IS_TABLET ? TABLET_BASE_WIDTH : PHONE_BASE_WIDTH;
  const BASE_HEIGHT = IS_TABLET ? TABLET_BASE_HEIGHT : PHONE_BASE_HEIGHT;

  // Use the short/long side so scaling stays stable across orientation changes.
  const rawWidthScale = clampValue(
    shortSide / BASE_WIDTH,
    0.9,
    IS_TABLET ? 1.3 : 1.2,
  );
  const rawHeightScale = clampValue(
    longSide / BASE_HEIGHT,
    0.9,
    IS_TABLET ? 1.25 : 1.2,
  );

  const scale = (size: number) => size * rawWidthScale;
  const verticalScale = (size: number) => size * rawHeightScale;
  const moderateScale = (size: number, factor = 0.5) =>
    size + (scale(size) - size) * factor;

  const wp = (percent: number) => (width * percent) / 100;
  const hp = (percent: number) => (height * percent) / 100;

  const hairlineWidth = Math.max(1, PixelRatio.roundToNearestPixel(0.5));
  const MIN_TAP = IS_TABLET ? 48 : 40;

  const responsiveRadius = (r: number) =>
    moderateScale(r, IS_TABLET ? 0.45 : 0.6);
  const responsiveSpacing = (s: number) =>
    moderateScale(s, IS_TABLET ? 0.45 : 0.6);

  const clamp = (value: number, min: number, max: number) =>
    clampValue(value, min, max);

  // Cap content width so it doesn't stretch full-width and get hard to read on tablets.
  const contentWidth = clampValue(width, 0, IS_TABLET ? 720 : width);

  // Screen edge spacing.
  const screenPadding = IS_TABLET
    ? responsiveSpacing(isLandscape ? 24 : 20)
    : responsiveSpacing(16);

  // Helpers for grid/list.
  const numColumns = IS_TABLET ? (isLandscape ? 3 : 2) : 1;

  return {
    width,
    height,
    shortSide,
    longSide,
    isTablet: IS_TABLET,
    isLandscape,

    scale,
    verticalScale,
    moderateScale,
    wp,
    hp,

    hairlineWidth,
    MIN_TAP,

    responsiveRadius,
    responsiveSpacing,
    clamp,

    contentWidth,
    screenPadding,
    numColumns,
  };
};
