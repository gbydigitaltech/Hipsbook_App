import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity } from 'react-native';
import ChevronDownIcon from '../../assets/icons/ChevronDownIcon';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import AppText from '../texts/AppText';
import { AppRadius, PRESSED_OPACITY } from '../../styles/sharedstyles';

type Props = {
  label?: string; // Dropdown label text
  onPress?: () => void; // Called when dropdown is pressed
  fontSize?: number; // Label font size
  iconSize?: number; // Chevron icon size
};

const AppDropDown: React.FC<Props> = ({
  label = 'ประเภทคอร์ส',
  onPress,
  fontSize = 16,
  iconSize = 14,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const [open, setOpen] = useState(false); // Local open/closed state

  // Animated value for chevron rotation (0 = closed, 1 = open)
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleDropdown = () => {
    const newState = !open;
    setOpen(newState);

    // Rotate chevron on toggle
    Animated.timing(rotateAnim, {
      toValue: newState ? 1 : 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    onPress?.();
  };

  // Map animated value to degrees
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Memoize styles to avoid re-creating style objects every render
  const styles = useMemo(
    () =>
      StyleSheet.create({
        dropdownContainer: {
          height: verticalScale(IS_TABLET ? 75 : 60),
          backgroundColor: AppColors.backgroundInteractive,
          borderRadius: responsiveRadius(AppRadius.lg),
          paddingHorizontal: scale(26),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  return (
    <TouchableOpacity
      style={styles.dropdownContainer}
      activeOpacity={PRESSED_OPACITY}
      onPress={toggleDropdown}
    >
      <AppText
        fontWeight="medium"
        fontSize={fontSize}
        style={{ color: AppColors.primary }}
      >
        {label}
      </AppText>

      <Animated.View style={{ transform: [{ rotate }] }}>
        <ChevronDownIcon size={iconSize} color="#FFFFFF" />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AppDropDown;
