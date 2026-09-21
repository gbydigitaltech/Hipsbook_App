import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppLoadingOverlayProps } from '../../types/ui/loading/app-loading-overlay.props';

const AppLoadingOverlay: React.FC<AppLoadingOverlayProps> = ({
  visible, // Controls modal visibility
  message = 'กำลังโหลดข้อมูล...', // Optional loading message
}) => {
  const { scale, verticalScale, moderateScale } = useResponsive();

  // Memoize styles to avoid re-creating style objects every render
  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: AppColors.scrim, // Dim background
        },
        box: {
          backgroundColor: AppColors.sheet,
          borderRadius: moderateScale(14),
          paddingVertical: verticalScale(20),
          paddingHorizontal: scale(24),
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          maxWidth: scale(200),
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10, // Android shadow
        },
        text: {
          marginTop: verticalScale(10),
          color: AppColors.white,
          fontSize: moderateScale(14),
          textAlign: 'center',
          lineHeight: moderateScale(20),
        },
      }),
    [scale, verticalScale, moderateScale],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={() => {}}
      hardwareAccelerated
    >
      {/* Prevent touches from passing through while loading */}
      <TouchableWithoutFeedback>
        <View style={styles.backdrop}>
          <View style={styles.box}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text
              style={styles.text}
              maxFontSizeMultiplier={1.2}
              allowFontScaling={false}
            >
              {message}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default AppLoadingOverlay;
