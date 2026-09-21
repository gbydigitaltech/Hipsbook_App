import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import AppSafeView from '../../components/views/AppSafeView';

import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { sharedPaddingHorizontal } from '../../styles/sharedstyles';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

const TERMS_URL = 'https://hipsbook.gbydigitaltech.co.th/TermsOfService';

const TermOfServiceScreen = () => {
  const { scale, verticalScale } = useResponsive();
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => {
    return StyleSheet.create({
      root: { flex: 1 },
      background: {
        backgroundColor: AppColors.secondary,
        ...StyleSheet.absoluteFill,
      },
      container: {
        flex: 1,
        width: '100%',
        paddingHorizontal: scale(sharedPaddingHorizontal),
      },
      webWrap: {
        flex: 1,
        marginTop: verticalScale(12),
        borderRadius: scale(12),
        overflow: 'hidden',
      },
      loader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      },
      webview: {
        flex: 1,
        backgroundColor: 'transparent',
      },
    });
  }, [scale, verticalScale]);

  return (
    <View style={styles.root}>
      <View style={styles.background} pointerEvents="none" />

      <AppSafeView style={styles.container}>
        <AppScreenHeader title="ข้อตกลงผู้ใช้" />

        <View style={styles.webWrap}>
          {loading && (
            <View style={styles.loader} pointerEvents="none">
              <ActivityIndicator size="large" color={AppColors.primary} />
            </View>
          )}

          <WebView
            source={{ uri: TERMS_URL }}
            onLoadEnd={() => setLoading(false)}
            startInLoadingState
            style={styles.webview}
            userAgent="AppWebView"
          />
        </View>
      </AppSafeView>
    </View>
  );
};

export default TermOfServiceScreen;
