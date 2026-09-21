import React, { useCallback, useMemo } from 'react';
import { Controller, FieldValues } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppTextInputControllerProps } from '../../types/ui/inputs/app-text-input-controller.props';
import AppText from '../texts/AppText';
import AppTextInput from './AppTextInput';

function AppTextInputController<TFieldValues extends FieldValues>({
  control,
  name,
  rules,
  label,
  labelFontSize,
  fontSize,
  fontWeight,
  errorFontSize = 12,
  placeholder,
  defaultValue,
  disabled,
  focusBorderColor,
  inputProps,
  showErrorText = true,
  formatValue,
  containerStyle,
  errorBlockStyle,
  errorTextStyle,
}: AppTextInputControllerProps<TFieldValues>) {
  const { verticalScale, responsiveSpacing } = useResponsive();

  const styles = useMemo(() => {
    const errorLineHeight = errorFontSize * 1.4;

    return StyleSheet.create({
      container: { width: '100%' },
      errorBlock: {
        minHeight: verticalScale(errorLineHeight),
        marginTop: responsiveSpacing(6),
        justifyContent: 'flex-start',
      },
      errorText: {
        color: AppColors.danger,
      },
    });
  }, [verticalScale, responsiveSpacing, errorFontSize]);

  const toDisplayString = useCallback(
    (v: unknown) => {
      if (formatValue) return formatValue(v);
      if (v == null) return '';
      return typeof v === 'string' ? v : String(v);
    },
    [formatValue],
  );

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      defaultValue={defaultValue as any}
      render={({
        field: { onChange, onBlur, value, ref },
        fieldState: { error },
      }) => {
        const hasError = Boolean(error);

        const effectiveFocusBorderColor = hasError
          ? AppColors.danger
          : focusBorderColor;

        return (
          <View style={[styles.container, containerStyle]}>
            <AppTextInput
              ref={ref}
              label={label}
              placeholder={placeholder}
              {...inputProps}
              value={toDisplayString(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={disabled}
              focusBorderColor={effectiveFocusBorderColor}
              hasError={hasError}
              labelFontSize={labelFontSize}
              fontSize={fontSize}
              fontWeight={fontWeight}
            />

            {showErrorText && (
              <View style={[styles.errorBlock, errorBlockStyle]}>
                <AppText
                  fontSize={errorFontSize}
                  style={[
                    styles.errorText,
                    !hasError && { opacity: 0 },
                    errorTextStyle,
                  ]}
                >
                  {hasError ? (error?.message as string) : ' '}
                </AppText>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

export default AppTextInputController;
