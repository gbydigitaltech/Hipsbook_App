/** Supported font weights in this project */
export type FontWeightType = 'regular' | 'medium' | 'semiBold' | 'bold';

/** Map app-level weight keys to actual font family names */
const FONT_MAP: Record<FontWeightType, string> = {
  regular: 'IBMPlexSansThai-Regular',
  medium: 'IBMPlexSansThai-Medium',
  semiBold: 'IBMPlexSansThai-SemiBold',
  bold: 'IBMPlexSansThai-Bold',
};

/**
 * Get font family by weight key.
 * Falls back to "regular" when weight is missing/unknown.
 */
export function getFontFamily(weight: FontWeightType = 'regular'): string {
  return FONT_MAP[weight] ?? FONT_MAP.regular;
}

/**
 * Build a reusable text style object.
 * Use this for consistent font family/size/color across components.
 */
export function makeFontStyle(opts: {
  weight?: FontWeightType;
  fontSize?: number;
  color?: string;
}) {
  const { weight = 'regular', fontSize = 16, color } = opts;

  return {
    fontFamily: getFontFamily(weight),
    fontSize,
    ...(color ? { color } : {}),
  } as const;
}
