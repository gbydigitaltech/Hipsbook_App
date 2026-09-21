import { IS_TABLET } from '../constants/platform';

/**
 * Left/right screen padding (px) applied to every screen.
 *
 * Was 12px on phones — too tight against the edge, especially for Thai text
 * with stacked vowel marks. Bumped to 16px (24px on tablets) to give content
 * room to breathe; every screen referencing this shifts together.
 */
export const sharedPaddingHorizontal = IS_TABLET ? 24 : 16;

/** Default vertical padding used across shared layouts (px) */
export const sharedPaddingVertical = 12;

export const sharedBottomSpace = 30;

/** Safe top spacing for Android screens (px) */
// Gap from the status bar to the header — fixed (not scaled) so it matches across devices.
export const sharedTopSpace = 12;

export const androidSafeTop = 12;

/** Safe top spacing for iOS screens (px) */
export const iosSafeTop = 12;

/* -------------------------------------------------------------------------- */
/* ============================ Border radius ============================ */
/* -------------------------------------------------------------------------- */

/**
 * App's central corner-radius scale.
 *
 * Corner-radius values were scattered across 10 values (8,10,12,14,16,18,20,30,50,999),
 * so cards placed side by side looked unevenly rounded. Collapsed to 4 levels,
 * choosing the closest match — most spots move by no more than 2px.
 *
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
/* ============================= Font sizes ============================= */
/* -------------------------------------------------------------------------- */

/**
 * App's central font-size scale (values already chosen per device).
 *
 * Size pairs were scattered across 22 variants, so same-level headings differed
 * between screens. Collapsed to 7 levels using the most common pairs from the old code
 * (16/20, 12/14, 24/28, 14/16, 18/22 cover almost all previous usage).
 *
 * Use instead of writing fontSize={IS_TABLET ? 20 : 16}, e.g.
 *   <AppText fontSize={AppFontSize.subtitle}>
 */
export const AppFontSize = {
  /** Very small labels, e.g. numeric badges. */
  overline: IS_TABLET ? 13 : 11,
  /** Supporting text, captions under a heading. */
  caption: IS_TABLET ? 14 : 12,
  /** General body text. */
  body: IS_TABLET ? 16 : 14,
  /** Primary text in a row/card, buttons. */
  subtitle: IS_TABLET ? 20 : 16,
  /** Section heading. */
  title: IS_TABLET ? 22 : 18,
  /** Secondary heading. */
  h2: IS_TABLET ? 24 : 20,
  /** Screen heading. */
  h1: IS_TABLET ? 28 : 24,
} as const;

/**
 * Line-height multiplier.
 *
 * Thai can stack an upper vowel and a tone mark two levels high; too tight a
 * line height makes glyphs collide. 1.45 leaves room for upper/lower marks.
 */
export const LINE_HEIGHT_RATIO = 1.45;

/* -------------------------------------------------------------------------- */
/* =========================== Press feedback =========================== */
/* -------------------------------------------------------------------------- */

/**
 * Opacity while pressing a button/card.
 *
 * Was scattered across 6 values (0.7-0.97), so presses felt inconsistent.
 * One value app-wide — clear enough to register a press without feeling jumpy.
 */
export const PRESSED_OPACITY = 0.8;
