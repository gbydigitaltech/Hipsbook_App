import React, { useMemo } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import AppBackground from '../../components/background/AppBackground';
import AppEmptyState from '../../components/states/AppEmptyState';
import AppText from '../../components/texts/AppText';
import AppSafeView from '../../components/views/AppSafeView';
import { IS_IOS } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import {
  AppFontSize,
  sharedPaddingHorizontal,
  sharedTopSpace,
} from '../../styles/sharedstyles';

const NotificationScreen = () => {
  const { scale } = useResponsive();

  // Responsive styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: { flex: 1 }, // full-screen wrapper
        keyboardView: { flex: 1 },
        container: {
          flex: 1,
          width: '100%',
          paddingHorizontal: scale(sharedPaddingHorizontal), // shared horizontal spacing
        },
        header: {
          marginTop: sharedTopSpace,
          alignItems: 'center',
        },
        content: {
          flex: 1,
          justifyContent: 'center', // vertical center
          alignItems: 'center', // horizontal center
        },
      }),
    [scale],
  );

  return (
    <View style={styles.rootView}>
      {/* Background gradient layer */}
      <AppBackground pointerEvents="none" />

      {/* Prevent UI overlap with keyboard (iOS) */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={IS_IOS ? 'padding' : undefined}
      >
        <AppSafeView style={styles.container}>
          <View style={styles.header}>
            <AppText fontWeight="semiBold" fontSize={AppFontSize.h1}>
              การแจ้งเตือน
            </AppText>
          </View>

          <View style={styles.content}>
            <AppEmptyState
              icon="notifications-outline"
              title="ยังไม่มีการแจ้งเตือน"
              description="เมื่อมีคอร์สใหม่ หรือความเคลื่อนไหวในคอร์สที่คุณเรียนอยู่ เราจะแจ้งให้ทราบที่นี่"
            />
          </View>
        </AppSafeView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default NotificationScreen;
