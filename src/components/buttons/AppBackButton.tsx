import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import BackChevronIcon from '../../assets/icons/BackChevronIcon';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppBackButtonProps } from '../../types/ui/buttons/app-back-button.props';
import { PRESSED_OPACITY } from '../../styles/sharedstyles';

/* =========================================================
 * AppBackButton
 * ======================================================= */
const AppBackButton: React.FC<AppBackButtonProps> = ({
  // --- Appearance ---
  color = AppColors.primary, // Icon color
  style, // Optional wrapper style override
  size, // Optional custom button size

  // --- Behavior ---
  onPress, // Custom handler (fallback: navigation.goBack)
}) => {
  const navigation = useNavigation();
  const { scale, MIN_TAP } = useResponsive();

  /* -------------------------
   * Size calculation
   * ----------------------- */
  const buttonSize = size ?? MIN_TAP; // fallback to minimum tap size
  const scaledSize = scale(buttonSize);

  const baseIcon = 18;
  const scaleRatio = buttonSize / MIN_TAP;
  const iconSize = scale(baseIcon * scaleRatio);

  /* -------------------------
   * Actions
   * ----------------------- */
  const handlePress = () => {
    if (onPress) onPress();
    else navigation.goBack();
  };

  /* -------------------------
   * Render
   * ----------------------- */
  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.base,
        style,
        {
          opacity: pressed ? PRESSED_OPACITY : 1,
          width: scaledSize,
          height: scaledSize,
          borderRadius: scaledSize / 2, // circular shape
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <BackChevronIcon size={iconSize} color={color} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
  },
});

export default AppBackButton;
