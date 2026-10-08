import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

/** Clip length in the bottom-right corner of a video thumbnail */
const DurationBadge: React.FC<{ text: string }> = ({ text }) => {
  const { scale } = useResponsive();
  if (!text) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.badge,
        {
          right: scale(6),
          bottom: scale(6),
          paddingHorizontal: scale(5),
          borderRadius: scale(4),
        },
      ]}
    >
      <AppText fontSize={AppFontSize.overline} style={styles.text}>
        {text}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  text: { color: AppColors.white, fontVariant: ['tabular-nums'] },
});

export default React.memo(DurationBadge);
