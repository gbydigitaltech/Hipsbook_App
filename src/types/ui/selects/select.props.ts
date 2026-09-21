import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

/** Primitive value types supported by select component */
export type SelectPrimitive = string | number;

/** Single selectable item */
export type SelectItem<T extends SelectPrimitive = SelectPrimitive> = {
  /** Display label */
  label: string;

  /** Actual value submitted/stored */
  value: T;
};

/** Props for standalone app select component */
export type AppSelectProps<T extends SelectPrimitive = SelectPrimitive> = {
  label?: string;
  labelFontSize?: number;
  value?: T | null;
  items: ReadonlyArray<SelectItem<T>>;
  onChange?: (value: T | null) => void;
  placeholder?: string;
  textColor?: string;
  placeholderColor?: string;
  fontSize?: number;
  fontWeight?: 'regular' | 'medium' | 'semiBold' | 'bold';
  disabled?: boolean;
  hasError?: boolean;
  style?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  backgroundColor?: string;
  radius?: number;
  sheetHeightRatio?: number;
  maxSheetHeightBase?: number;
  searchable?: boolean;
};

/** Props for react-hook-form controller + app select integration */
export type AppSelectControllerProps<
  TFieldValues extends FieldValues,
  V extends SelectPrimitive = SelectPrimitive,
> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showErrorText?: boolean;
  items: ReadonlyArray<SelectItem<V>>;
  defaultValue?: V | null;

  /** The four props below were added. */
  errorFontSize?: number;
  containerStyle?: StyleProp<ViewStyle>;
  errorBlockStyle?: StyleProp<ViewStyle>;
  errorTextStyle?: StyleProp<TextStyle>;

  style?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  radius?: number;
  sheetHeightRatio?: number;
  maxSheetHeightBase?: number;
  searchable?: boolean;
  labelFontSize?: number;
  fontSize?: number;
  textColor?: string;
  placeholderColor?: string;
  fontWeight?: 'regular' | 'medium' | 'semiBold' | 'bold';
  textStyle?: StyleProp<TextStyle>;
};
