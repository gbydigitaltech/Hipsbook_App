import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  /** Current checked state */
  value: boolean;
  /** Called with the next state when pressed */
  onValueChange?: (next: boolean) => void;
  /** Disable interaction */
  disabled?: boolean;
  /** Base box size (before responsive scale) */
  size?: number;
  testID?: string;
};

const AppCheckbox: React.FC<Props> = ({
  value,
  onValueChange,
  disabled = false,
  size = 22,
  testID,
}) => {
  const { scale, responsiveRadius, MIN_TAP } = useResponsive();

  const box = scale(size);
  const pad = Math.max(0, (MIN_TAP - box) / 2);
  const check = box * 0.62;

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      hitSlop={{ top: pad, bottom: pad, left: pad, right: pad }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      style={({ pressed }) => [
        styles.box,
        {
          width: box,
          height: box,
          borderRadius: responsiveRadius(6),
          backgroundColor: value ? AppColors.primary : 'transparent',
          borderColor: value ? AppColors.primary : AppColors.borderStrong,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {value ? (
        <Svg width={check} height={check} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 13l4 4L19 7"
            stroke={AppColors.white}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppCheckbox;
