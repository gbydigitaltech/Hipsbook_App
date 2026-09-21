import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputKeyPressEvent,
  View,
  ViewStyle,
} from 'react-native';
import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppRadius } from '../../styles/sharedstyles';
import {
  AppOtpInputProps,
  AppOtpInputRef,
} from '../../types/ui/inputs/app-otp-input.props';
import AppText from '../texts/AppText';

// Base UI defaults
const BASE_RADIUS = AppRadius.md;
const BASE_FONT_SIZE = 18;
const BASE_GAP = 10;

const AppOtpInput = forwardRef<AppOtpInputRef, AppOtpInputProps>(
  (
    {
      length = 6, // Number of OTP cells
      value, // Controlled OTP value
      onChangeCode, // Called on any code change
      onCodeFilled, // Called when all cells are filled
      secure = false, // Show bullets instead of digits
      disabled = false, // Disable editing/interactions
      error = false, // Error state (danger border)
      autoFocus = true, // Auto focus first cell on mount
      gap, // Optional fixed gap between cells
      containerStyle, // External row style override
      cellStyle, // External per-cell style override
    },
    ref,
  ) => {
    const {
      scale,
      verticalScale,
      moderateScale,
      responsiveRadius,
      hairlineWidth,
      MIN_TAP,
    } = useResponsive();

    // Per-cell values + focus state
    const [codeChars, setCodeChars] = useState<string[]>(
      Array.from({ length }, (_, i) => value?.[i] ?? ''),
    );
    const inputRefs = useRef<Array<TextInput | null>>([]);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const [containerWidth, setContainerWidth] = useState<number>(0); // Used for auto gap

    // Sync local state when controlled value changes
    useEffect(() => {
      if (typeof value === 'string') {
        const next = Array.from({ length }, (_, i) => value[i] ?? '');
        setCodeChars(next);
      }
    }, [value, length]);

    // Focus first cell on mount (optional)
    useEffect(() => {
      if (autoFocus) inputRefs.current[0]?.focus();
    }, [autoFocus]);

    // Expose imperative API
    useImperativeHandle(
      ref,
      () => ({
        focus: (index = 0) => inputRefs.current[index]?.focus(),
        clear: () => {
          const cleared = Array.from({ length }, () => '');
          setCodeChars(cleared);
          onChangeCode?.(cleared.join(''));
          inputRefs.current[0]?.focus();
        },
        getValue: () => codeChars.join(''),
        setValue: (code: string) => {
          const next = Array.from({ length }, (_, i) => code[i] ?? '');
          setCodeChars(next);
          onChangeCode?.(next.join(''));
          if (next.every(c => c)) onCodeFilled?.(next.join(''));
        },
      }),
      [codeChars, length, onChangeCode, onCodeFilled],
    );

    // Build responsive UI values/styles
    const ui = useMemo(() => {
      const cellWidth = Math.max(MIN_TAP, scale(50));
      const cellHeight = Math.max(MIN_TAP, verticalScale(50));

      const baseFont = BASE_FONT_SIZE;
      const fontSize = moderateScale(baseFont, 0.5);

      const radius = responsiveRadius(BASE_RADIUS);

      // Use provided gap, otherwise responsive default
      const baseGap = typeof gap === 'number' ? gap : scale(BASE_GAP);

      // Auto-adjust gap to fit container width (without exceeding baseGap)
      let autoGap = baseGap;
      if (containerWidth > 0 && length > 1) {
        const totalCellWidth = length * cellWidth;
        const available = containerWidth - totalCellWidth;
        const computed = available / (length - 1);

        if (computed > 0) {
          autoGap = Math.min(computed, baseGap);
        }
      }

      const cellBase: ViewStyle = {
        backgroundColor: AppColors.backgroundInteractive,
        borderRadius: radius,
        borderWidth: hairlineWidth,
        width: cellWidth,
        height: cellHeight,
        justifyContent: 'center',
        alignItems: 'center',
      };

      return {
        gapSpacing: autoGap,
        fontSize,
        cellBase,
        textStyle: {
          color: AppColors.white,
          fontSize,
          fontFamily: getFontFamily('semiBold'),
        } as const,
      };
    }, [
      gap,
      containerWidth,
      length,
      MIN_TAP,
      scale,
      verticalScale,
      moderateScale,
      responsiveRadius,
      hairlineWidth,
    ]);

    // Resolve border color by state
    const borderColorFor = useCallback(
      (index: number) => {
        if (disabled) return 'transparent';
        if (error) return AppColors.danger;
        if (focusedIndex === index) return AppColors.primary;
        return 'transparent';
      },
      [disabled, error, focusedIndex],
    );

    // Precompute per-cell dynamic styles
    const cellDynamicStyles = useMemo(
      () =>
        Array.from({ length }).map((_, i) => ({
          borderColor: borderColorFor(i),
          marginRight: i < length - 1 ? ui.gapSpacing : 0,
        })),
      [length, borderColorFor, ui.gapSpacing],
    );

    const emitChange = (arr: string[]) => {
      const code = arr.join('');
      onChangeCode?.(code);
      if (arr.every(c => c)) onCodeFilled?.(code);
    };

    const handleTextChange = (raw: string, idx: number) => {
      if (disabled) return;

      // Keep digits only (supports paste)
      const digits = raw.replace(/[^0-9]+/g, '');

      if (!digits) {
        const next = [...codeChars];
        next[idx] = '';
        setCodeChars(next);
        emitChange(next);
        return;
      }

      // Fill current and next cells when multiple digits are pasted
      const next = [...codeChars];
      let cursor = idx;
      for (const d of digits) {
        if (cursor >= length) break;
        next[cursor] = d;
        cursor++;
      }
      setCodeChars(next);
      emitChange(next);

      // Move focus forward
      const nextFocus = Math.min(cursor, length - 1);
      inputRefs.current[nextFocus]?.focus();
    };

    const handleKeyPress = (e: TextInputKeyPressEvent, idx: number) => {
      if (disabled) return;

      if (e.nativeEvent.key === 'Backspace') {
        if (codeChars[idx]) {
          // Clear current cell first
          const next = [...codeChars];
          next[idx] = '';
          setCodeChars(next);
          emitChange(next);
        } else if (idx > 0) {
          // Move back and clear previous cell
          inputRefs.current[idx - 1]?.focus();
          const next = [...codeChars];
          next[idx - 1] = '';
          setCodeChars(next);
          emitChange(next);
        }
      }
    };

    return (
      <View
        style={[styles.row, containerStyle]}
        onLayout={e => setContainerWidth(e.nativeEvent.layout.width)} // Capture width for auto gap calculation
      >
        {Array.from({ length }).map((_, i) => {
          const val = codeChars[i];
          const show = secure && val ? '•' : val;

          return (
            <Pressable
              key={i}
              onPress={() => inputRefs.current[i]?.focus()}
              accessibilityRole="button"
              accessibilityLabel={`OTP cell ${i + 1}`}
              disabled={disabled}
            >
              <View
                style={[
                  ui.cellBase,
                  cellDynamicStyles[i],
                  disabled && styles.disabledCell,
                  cellStyle,
                ]}
              >
                <TextInput
                  ref={r => {
                    inputRefs.current[i] = r;
                  }}
                  value={val}
                  onChangeText={t => handleTextChange(t, i)}
                  onKeyPress={e => handleKeyPress(e, i)}
                  onFocus={() => setFocusedIndex(i)}
                  onBlur={() => setFocusedIndex(-1)}
                  style={styles.hiddenInput}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={1}
                  editable={!disabled}
                  importantForAutofill="yes"
                  returnKeyType="done"
                  inputMode="numeric"
                  maxFontSizeMultiplier={1.2}
                  allowFontScaling={false}
                />
                <AppText style={ui.textStyle}>{show}</AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  },
);

AppOtpInput.displayName = 'AppOtpInput';

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  hiddenInput: {
    position: 'absolute', // Keep native input for keyboard/autofill
    width: '100%',
    height: '100%',
    opacity: 0, // Hide actual input, render value via AppText
  },
  disabledCell: {
    opacity: 0.6,
  },
});

export default AppOtpInput;
