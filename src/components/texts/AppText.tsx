import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { IS_Android } from '../../constants/platform';
import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  LINE_HEIGHT_RATIO,
  SINGLE_LINE_HEIGHT_RATIO,
} from '../../styles/sharedstyles';
import { AppTextProps } from '../../types/ui/texts/text.props';

const AppText: React.FC<AppTextProps> = ({
  children, // Text content
  fontWeight = 'regular', // Font weight key for getFontFamily
  fontSize = 16, // Base font size before responsive scaling
  style, // External style override
  allowFontScaling = false, // Accessibility text scaling
  maxFontSizeMultiplier = 1.2, // Limit accessibility scaling
  ...props // Forward other Text props
}) => {
  const { moderateScale } = useResponsive();

  const scaledFontSize = moderateScale(fontSize, 0.5);

  const isSingleLine = props.numberOfLines === 1;

  return (
    <Text
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        styles.text,
        {
          fontFamily: getFontFamily(fontWeight),
          fontSize: scaledFontSize,
          lineHeight: Math.round(
            scaledFontSize *
              (isSingleLine ? SINGLE_LINE_HEIGHT_RATIO : LINE_HEIGHT_RATIO),
          ),
          ...(IS_Android ? { includeFontPadding: false } : null), // Android vertical alignment fix
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: AppColors.white, // Default text color
  },
});

export default AppText;
