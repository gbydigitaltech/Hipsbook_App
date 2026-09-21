import React, { useMemo } from 'react';
import { Controller, FieldValues } from 'react-hook-form';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppSelectControllerProps,
  SelectItem,
} from '../../types/ui/selects/select.props';
import AppText from '../texts/AppText';
import AppSelect from './AppSelect';

function AppSelectController<
  TFieldValues extends FieldValues,
  V extends string | number = string | number,
>({
  control,
  name,
  rules,
  label,
  placeholder,
  items,
  defaultValue = null,
  disabled,
  showErrorText = true,
  errorFontSize = 12,
  containerStyle,
  errorBlockStyle,
  errorTextStyle,
  style,
  inputWrapperStyle,
  backgroundColor,
  radius,
  sheetHeightRatio,
  maxSheetHeightBase,
  searchable,
  labelFontSize,
  fontSize,
  textColor,
  placeholderColor,
  fontWeight,
  textStyle,
}: AppSelectControllerProps<TFieldValues, V>) {
  const { verticalScale, responsiveSpacing } = useResponsive();

  const styles = useMemo(() => {
    const errorLineHeight = errorFontSize * 1.4;

    return StyleSheet.create({
      container: {
        width: '100%',
      },
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

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      defaultValue={defaultValue as any}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const hasError = Boolean(error);

        return (
          <View style={[styles.container, containerStyle]}>
            <AppSelect
              label={label}
              labelFontSize={labelFontSize}
              placeholder={placeholder}
              items={items as Array<SelectItem<V>>}
              value={(value as V | null) ?? null}
              onChange={v => onChange(v as V | null)}
              disabled={disabled}
              hasError={hasError}
              style={style as StyleProp<ViewStyle>}
              inputWrapperStyle={inputWrapperStyle}
              backgroundColor={backgroundColor}
              radius={radius}
              sheetHeightRatio={sheetHeightRatio}
              maxSheetHeightBase={maxSheetHeightBase}
              searchable={searchable}
              fontSize={fontSize}
              textColor={textColor}
              placeholderColor={placeholderColor}
              fontWeight={fontWeight}
              textStyle={textStyle}
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

export default AppSelectController;
