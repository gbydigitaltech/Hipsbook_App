import { ReactNode } from 'react';
import { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { FontWeightType } from '../../../helpers/fontFamilyHelper';

/** Props for reusable app text input component */
export interface AppTextInputProps extends TextInputProps {
  /** Optional field label shown above input */
  label?: string;

  /** Label font size in pixels */
  labelFontSize?: number;

  /** Input value (controlled) */
  value: string;

  /** Callback fired when text changes */
  onChangeText?: (text: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Wrapper/container style override */
  style?: StyleProp<ViewStyle>;

  /** TextInput style override */
  inputStyle?: StyleProp<TextStyle>;

  /** Input wrapper style (border/background container) */
  inputWrapperStyle?: StyleProp<ViewStyle>;

  /** Input background color */
  backgroundColor?: string;

  /** Input border radius in pixels */
  radius?: number;

  /** Input text color */
  textColor?: string;

  /** Input font size in pixels */
  fontSize?: number;

  /** Semantic font weight */
  fontWeight?: FontWeightType;

  /** Hide text for password-like input */
  secureTextEntry?: boolean;

  /** Disable interaction */
  disabled?: boolean;

  /** Error state for styling/feedback */
  hasError?: boolean;

  /** Border color when input is focused */
  focusBorderColor?: string;

  /** Text color when input is focused */
  focusTextColor?: string;

  /** Optional left-side icon element */
  leftIcon?: ReactNode;

  /** Optional right-side icon element */
  rightIcon?: ReactNode;

  /** Press handler for left icon */
  onPressLeftIcon?: () => void;

  /** Press handler for right icon */
  onPressRightIcon?: () => void;

  /** Spacing between icon and text area */
  iconSpacing?: number;

  /** Hit slop size for icon press area */
  iconHitSlop?: number;
}
