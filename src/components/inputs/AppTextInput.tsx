import React, { forwardRef, useMemo, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
  type TextInputProps,
} from 'react-native';
import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppRadius } from '../../styles/sharedstyles';
import { AppTextInputProps } from '../../types/ui/inputs/app-text-input.props';
import AppText from '../texts/AppText';

const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  (
    {
      label, // Optional field label
      labelFontSize, // Label font size override
      value, // Input value
      onChangeText, // Primary change callback
      placeholder, // Placeholder text
      style, // Outer container style override
      inputStyle, // TextInput style override
      inputWrapperStyle, // Wrapper style override
      backgroundColor = AppColors.backgroundInteractive, // Input background color
      radius = AppRadius.md, // Wrapper corner radius
      textColor = AppColors.white, // Default text color
      fontSize = 16, // Base text size
      fontWeight = 'regular', // Font weight key for getFontFamily
      secureTextEntry = false, // Password mode
      disabled = false, // Disable input/editing
      focusBorderColor, // Border color when focused
      focusTextColor, // Text color when focused
      hasError = false, // Error state (danger border)
      leftIcon, // Optional left icon node
      rightIcon, // Optional right icon node
      onPressLeftIcon, // Left icon press callback
      onPressRightIcon, // Right icon press callback
      iconSpacing = 8, // Spacing between icon and input
      iconHitSlop = 6, // Extra touch area for icon presses
      allowFontScaling = false, // Accessibility font scaling
      maxFontSizeMultiplier = 1.2, // Max scaling multiplier
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false); // Local focus state

    // Extract handlers from extra TextInput props
    const {
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      onChangeText: onChangeTextProp,
      ...restProps
    } = props as Pick<TextInputProps, 'onFocus' | 'onBlur' | 'onChangeText'>;

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocusProp?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlurProp?.(e);
    };

    const handleChangeText = (text: string) => {
      onChangeText?.(text);
      onChangeTextProp?.(text); // keep compatibility with forwarded props
    };

    const {
      scale,
      verticalScale,
      moderateScale,
      responsiveRadius,
      responsiveSpacing,
      hairlineWidth,
      MIN_TAP,
    } = useResponsive();

    // Build responsive + state-based styles
    const dynamicStyles = useMemo(() => {
      const focusedBorder = focusBorderColor ?? AppColors.primary;
      const focusedText = focusTextColor ?? AppColors.white;

      return {
        wrapperDynamic: {
          backgroundColor,
          borderRadius: responsiveRadius(radius),
          borderColor: disabled
            ? 'transparent'
            : hasError
            ? AppColors.danger
            : isFocused
            ? focusedBorder
            : AppColors.border,
          borderWidth: hairlineWidth,
          opacity: disabled ? 0.6 : 1,
          minHeight: Math.max(MIN_TAP, verticalScale(48)),
          paddingHorizontal: responsiveSpacing(16),
          paddingVertical: 0, // keep vertical centering consistent
        } as StyleProp<ViewStyle>,

        inputDynamic: {
          color: disabled
            ? AppColors.disabled
            : isFocused
            ? focusedText
            : textColor,
          fontSize: moderateScale(fontSize, 0.5),
          fontFamily: getFontFamily(fontWeight),

          paddingVertical: 0,
          paddingHorizontal: 0,

          textAlignVertical: 'center' as const,
        },

        leftIconMargin: { marginRight: responsiveSpacing(iconSpacing) },
        rightIconMargin: { marginLeft: responsiveSpacing(iconSpacing) },

        iconSize: {
          minWidth: Math.min(MIN_TAP, scale(22)),
          minHeight: Math.min(MIN_TAP, scale(22)),
        },

        // Enlarged touch area for icon taps
        hitSlopVal: {
          top: Math.max(MIN_TAP / 2, iconHitSlop),
          bottom: Math.max(MIN_TAP / 2, iconHitSlop),
          left: Math.max(MIN_TAP / 2, iconHitSlop),
          right: Math.max(MIN_TAP / 2, iconHitSlop),
        } as const,

        labelFontSize: moderateScale(labelFontSize ?? 16, 0.5),
        labelSpacing: responsiveSpacing(6),
      };
    }, [
      backgroundColor,
      radius,
      disabled,
      isFocused,
      hasError,
      focusBorderColor,
      focusTextColor,
      textColor,
      fontSize,
      fontWeight,
      iconSpacing,
      iconHitSlop,
      labelFontSize,
      scale,
      verticalScale,
      moderateScale,
      responsiveRadius,
      responsiveSpacing,
      hairlineWidth,
      MIN_TAP,
    ]);

    const Left = leftIcon ? (
      <Pressable
        disabled={!onPressLeftIcon || disabled}
        onPress={onPressLeftIcon}
        hitSlop={dynamicStyles.hitSlopVal}
        style={[
          styles.icon,
          dynamicStyles.leftIconMargin,
          dynamicStyles.iconSize,
        ]}
      >
        {leftIcon}
      </Pressable>
    ) : null;

    const Right = rightIcon ? (
      <Pressable
        disabled={!onPressRightIcon || disabled}
        onPress={onPressRightIcon}
        hitSlop={dynamicStyles.hitSlopVal}
        style={[
          styles.icon,
          dynamicStyles.rightIconMargin,
          dynamicStyles.iconSize,
        ]}
      >
        {rightIcon}
      </Pressable>
    ) : null;

    return (
      <View style={[styles.container, style]}>
        {label && (
          <AppText
            fontSize={dynamicStyles.labelFontSize}
            fontWeight="medium"
            style={[styles.label, { marginBottom: dynamicStyles.labelSpacing }]}
          >
            {label}
          </AppText>
        )}

        <View
          style={[
            styles.inputWrapper,
            dynamicStyles.wrapperDynamic,
            inputWrapperStyle,
          ]}
        >
          {Left}
          <TextInput
            ref={ref}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={AppColors.textTertiary}
            editable={!disabled}
            secureTextEntry={secureTextEntry}
            numberOfLines={1}
            {...restProps}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[styles.input, dynamicStyles.inputDynamic, inputStyle]}
            allowFontScaling={allowFontScaling}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
          />
          {Right}
        </View>
      </View>
    );
  },
);

AppTextInput.displayName = 'AppTextInput';

export default AppTextInput;

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: { color: AppColors.white },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1 },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
