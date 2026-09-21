import type React from 'react';
import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import AppTextInput from '../../../components/inputs/AppTextInput';

/** Additional AppTextInput props allowed in controller wrapper */
export type AppTextInputExtraProps = Omit<
  React.ComponentProps<typeof AppTextInput>,
  'value' | 'onChangeText' | 'label'
>;

/** Value formatter for transforming form value to display string */
export type FormatValue = (value: unknown) => string;

/** Generic props for react-hook-form + AppTextInput controller */
export type AppTextInputControllerProps<TFieldValues extends FieldValues> = {
  /** react-hook-form control object */
  control: Control<TFieldValues>;

  /** Field path/name in form schema */
  name: Path<TFieldValues>;

  /** Validation rules for this field */
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;

  /** Input label text */
  label?: string;

  /** Label font size in pixels */
  labelFontSize?: number;

  /** Input font size in pixels */
  fontSize?: React.ComponentProps<typeof AppTextInput>['fontSize'];

  /** Input font weight */
  fontWeight?: React.ComponentProps<typeof AppTextInput>['fontWeight'];

  /** Error text font size in pixels */
  errorFontSize?: number;

  /** Placeholder text */
  placeholder?: string;

  /** Disable input interaction */
  disabled?: boolean;

  /** Border color when input is focused */
  focusBorderColor?: string;

  /** Show validation error text under input */
  showErrorText?: boolean;

  /** Wrapper/container style override */
  containerStyle?: StyleProp<ViewStyle>;

  /** Error message block style override */
  errorBlockStyle?: StyleProp<ViewStyle>;

  /** Error message text style override */
  errorTextStyle?: StyleProp<TextStyle>;

  /** Default field value (uncontrolled initialization) */
  defaultValue?: unknown;

  /** Explicit display value override */
  displayValue?: string;

  /** Optional value formatter before rendering */
  formatValue?: FormatValue;

  /** Additional props forwarded to AppTextInput */
  inputProps?: AppTextInputExtraProps;
};

/** Non-generic helper alias for broad usage */
export type AppTextInputControllerAnyProps =
  AppTextInputControllerProps<FieldValues>;
