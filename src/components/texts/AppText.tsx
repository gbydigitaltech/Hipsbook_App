import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { IS_IOS } from '../../constants/platform';
import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { LINE_HEIGHT_RATIO } from '../../styles/sharedstyles';
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

  // Thai can stack an upper vowel + tone mark (e.g. ื + ้ in "ซื้อ"),
  // so a single line must be tall enough or the top mark gets clipped.
  const singleLineRatio = 1.4;

  return (
    <Text
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        styles.text,
        {
          fontFamily: getFontFamily(fontWeight),
          fontSize: scaledFontSize,
          // iOS clips tone marks when lineHeight is forced, so let it use the
          // font's natural metrics; Android keeps lineHeight to control spacing.
          ...(IS_IOS
            ? null
            : {
                lineHeight: Math.round(
                  scaledFontSize *
                    (isSingleLine ? singleLineRatio : LINE_HEIGHT_RATIO),
                ),
              }),
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
