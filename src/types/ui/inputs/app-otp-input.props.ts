import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

/** Supported semantic font weights for OTP text */
export type FontWeightType = 'regular' | 'medium' | 'semiBold' | 'bold';

/** Imperative ref methods exposed by OTP input component */
export type AppOtpInputRef = {
  /** Focus OTP input (optionally at a specific cell index) */
  focus: (index?: number) => void;

  /** Clear all OTP cells */
  clear: () => void;

  /** Get current OTP value */
  getValue: () => string;

  /** Set OTP value programmatically */
  setValue: (code: string) => void;
};

/** Props for reusable OTP input component */
export type AppOtpInputProps = {
  /** Number of OTP cells */
  length?: number;

  /** Controlled OTP value */
  value?: string;

  /** Callback on any OTP value change */
  onChangeCode?: (code: string) => void;

  /** Callback when OTP reaches full length */
  onCodeFilled?: (code: string) => void;

  /** Mask typed characters */
  secure?: boolean;

  /** Disable interaction */
  disabled?: boolean;

  /** Error state flag (for styling/feedback) */
  error?: boolean;

  /** Border color for focused cell */
  focusBorderColor?: string;

  /** Text color inside cells */
  textColor?: string;

  /** Cell background color */
  backgroundColor?: string;

  /** Cell border radius in pixels */
  radius?: number;

  /** Cell text size in pixels */
  fontSize?: number;

  /** Semantic font weight for cell text */
  fontWeight?: FontWeightType;

  /** Allow system font scaling */
  allowFontScaling?: boolean;

  /** Max font scale multiplier */
  maxFontSizeMultiplier?: number;

  /** Auto-focus first cell on mount */
  autoFocus?: boolean;

  /** Wrapper/container style override */
  containerStyle?: StyleProp<ViewStyle>;

  /** Per-cell style override */
  cellStyle?: StyleProp<ViewStyle>;

  /** Per-cell text style override */
  cellTextStyle?: StyleProp<TextStyle>;

  /** Space between cells in pixels */
  gap?: number;

  /** Keyboard type for OTP input */
  keyboardType?: 'number-pad' | 'numeric' | 'default';

  /** Enable iOS/Android one-time-code autofill hints */
  enableOneTimeCode?: boolean;

  /** Prefix for generated test IDs */
  testIDPrefix?: string;
};
