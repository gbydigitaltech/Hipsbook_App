import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import AppBackground from '../../components/background/AppBackground';
import StreamSection from '../../components/stream/StreamSection';
import AppText from '../../components/texts/AppText';
import AppScrollView from '../../components/views/AppScrollView';
import { useResponsive } from '../../helpers/responsive';
import {
  AppFontSize,
  sharedPaddingHorizontal,
  sharedTopSpace,
} from '../../styles/sharedstyles';

const LiveScreen = () => {
  const { scale, verticalScale } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: {
          flex: 1,
        },
        header: {
          marginTop: sharedTopSpace,
          alignItems: 'center',
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },
        content: {
          flex: 1,
          paddingHorizontal: scale(sharedPaddingHorizontal),
          paddingTop: verticalScale(24),
        },
      }),
    [scale, verticalScale],
  );

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppScrollView
        keyboardShouldPersistTaps="handled"
        withHorizontalPadding={false}
      >
        <View style={styles.header}>
          <AppText fontSize={AppFontSize.h1} fontWeight="semiBold">
            ไลฟ์สด
          </AppText>
        </View>

        <View style={styles.content}>
          <StreamSection />
        </View>
      </AppScrollView>
    </View>
  );
};

export default LiveScreen;
