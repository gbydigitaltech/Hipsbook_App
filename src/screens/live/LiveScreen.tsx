import React from 'react';
import { StyleSheet, View } from 'react-native';

import StreamSection from '../../components/stream/StreamSection';
import { AppColors } from '../../styles/colors';

/** Live tab: plain black page (Figma), content lives in StreamSection */
const LiveScreen = () => (
  <View style={styles.rootView}>
    <StreamSection />
  </View>
);

const styles = StyleSheet.create({
  rootView: { flex: 1, backgroundColor: AppColors.black },
});

export default LiveScreen;
