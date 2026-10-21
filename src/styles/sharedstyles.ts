import { IS_IOS, IS_TABLET } from '../constants/platform';

/* -------------------------------------------------------------------------- */
/* ========================== Tablet size rule ========================== */
/* -------------------------------------------------------------------------- */

/** Tablet sizes are this much larger than phone sizes. */
export const TABLET_SIZE_RATIO = 1.2;

/**
 * Central rule for any size that differs between phone and tablet
 * (spacing, icons, small dimensions). Pass the PHONE value:
 * phone gets it unchanged, tablet gets it x1.2 (rounded to an even number
 * from 10 up, so sizes stay on a clean grid).
 *
 * Use instead of IS_TABLET ? 24 : 20, e.g.
 *   gap: scale(adaptiveSize(12))   // phone 12, tablet 14
 *   marginTop: verticalScale(adaptiveSize(20)) // phone 20, tablet 24
 *
 * Only write IS_TABLET ? a : b for sizes that are intentionally different
 * on tablet (e.g. a bigger avatar or wider card).
 */
export const adaptiveSize = (phone: number): number => {
  if (!IS_TABLET) return phone;
  const value = phone * TABLET_SIZE_RATIO;
  return phone < 10 ? Math.round(value) : Math.round(value / 2) * 2;
};

/** Left/right screen padding (px), applied on every screen. */
export const sharedPaddingHorizontal = IS_TABLET ? 24 : 16;

/** Default vertical padding used across shared layouts (px) */
export const sharedPaddingVertical = 12;

export const sharedBottomSpace = 30;

/** Gap from status bar to header (px), fixed so it matches across devices. */
export const sharedTopSpace = 12;

export const androidSafeTop = 12;

/** Safe top spacing for iOS screens (px) */
export const iosSafeTop = 12;

/* -------------------------------------------------------------------------- */
/* ============================ Border radius ============================ */
/* -------------------------------------------------------------------------- */

/**
 * Central corner-radius scale.
 * Always use with responsiveRadius(), e.g. responsiveRadius(AppRadius.md).
 */
export const AppRadius = {
  /** Small chips, thumbnails, square icons. */
  sm: 10,
  /** Cards, content panels, input fields. */
  md: 16,
  /** Large cards, bottom sheets, list rows. */
  lg: 20,
  /** Top corners of a bottom sheet. */
  sheet: 24,
  /** Capsule buttons, circular avatar badges. */
  pill: 999,
} as const;

/* -------------------------------------------------------------------------- */
/* =========================== Button heights =========================== */
/* -------------------------------------------------------------------------- */

/**
 * Central button heights (before verticalScale), e.g.
 *   height: verticalScale(AppButtonHeight.card)
 */
export const AppButtonHeight = {
  /** Action button inside course cards (buy / start / continue): 40 / 48 */
  card: adaptiveSize(40),
} as const;

/* -------------------------------------------------------------------------- */
/* ============================= Icon sizes ============================= */
/* -------------------------------------------------------------------------- */

/**
 * Central icon-size scale (phone / tablet).
 * Use instead of size={IS_TABLET ? 24 : 20}, e.g. <SearchIcon size={AppIconSize.lg} />
 * For other sizes use adaptiveSize(phoneSize).
 */
export const AppIconSize = {
  /** 14 / 16 - inline with caption text */
  xs: adaptiveSize(14),
  /** 16 / 20 - inline with body text */
  sm: adaptiveSize(16),
  /** 18 / 22 - list rows, card actions */
  md: adaptiveSize(18),
  /** 20 / 24 - default UI icon */
  lg: adaptiveSize(20),
  /** 24 / 28 - header / prominent actions */
  xl: adaptiveSize(24),
  /** 28 / 34 - large header actions */
  xxl: adaptiveSize(28),
} as const;

/* -------------------------------------------------------------------------- */
/* ============================= Font sizes ============================= */
/* -------------------------------------------------------------------------- */

/**
 * Central font-size scale (values chosen per device).
 * Use instead of fontSize={IS_TABLET ? 20 : 16}, e.g.
 *   <AppText fontSize={AppFontSize.subtitle}>
 */
export const AppFontSize = {
  /** Very small labels, e.g. numeric badges. */
  overline: IS_TABLET ? 13 : 11,
  /** Supporting text, captions under a heading. */
  caption: IS_TABLET ? 14 : 12,
  /** General body text. */
  body: IS_TABLET ? 17 : 14,
  /** Primary text in a row/card, buttons. */
  subtitle: IS_TABLET ? 19 : 16,
  /** Section heading. */
  title: IS_TABLET ? 22 : 18,
  /** Secondary heading. */
  h2: IS_TABLET ? 24 : 20,
  /** Screen heading. */
  h1: IS_TABLET ? 28 : 24,
} as const;

/** Line-height multiplier. 1.45 leaves room for Thai upper vowels + tone marks. */
export const LINE_HEIGHT_RATIO = 1.45;

/** Line-height multiplier for single-line text (buttons, chips, labels). */
export const SINGLE_LINE_HEIGHT_RATIO = 1.2;

/* -------------------------------------------------------------------------- */
/* =========================== Press feedback =========================== */
/* -------------------------------------------------------------------------- */

/** Opacity while pressing a button/card. */
export const PRESSED_OPACITY = 0.8;

/**
 * Thai-safe cross-platform line height.
 *
 * On iOS, forcing lineHeight clips upper vowels/tone marks, so return undefined
 * there (use the font's natural metrics) and the given value on Android. Use for
 * any text style where you'd otherwise set lineHeight.
 */
export const thaiSafeLineHeight = (value?: number): number | undefined =>
  IS_IOS ? undefined : value;
