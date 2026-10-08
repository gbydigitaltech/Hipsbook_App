import React from 'react';
import { StyleSheet, View } from 'react-native';

import AppBackground from '../../components/background/AppBackground';
import StreamSection from '../../components/stream/StreamSection';

/** Live tab: same gradient background as the other tabs, content lives in StreamSection */
const LiveScreen = () => (
  <View style={styles.rootView}>
    <AppBackground pointerEvents="none" />
    <StreamSection />
  </View>
);

const styles = StyleSheet.create({
  rootView: { flex: 1 },
});

export default LiveScreen;
