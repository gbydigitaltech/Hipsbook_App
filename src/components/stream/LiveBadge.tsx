import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

type Props = {
  /** sm = list thumbnails, md = featured preview / player header */
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

/** The one red "Live" badge used across the live screens */
const LiveBadge: React.FC<Props> = ({ size = 'sm', style }) => {
  const { scale } = useResponsive();
  const md = size === 'md';

  return (
    <View
      style={[
        styles.badge,
        {
          height: scale(md ? 22 : 18),
          paddingHorizontal: scale(md ? 9 : 7),
          gap: scale(4),
        },
        style,
      ]}
    >
      <View
        style={[
          styles.dot,
          { width: scale(md ? 6 : 5), height: scale(md ? 6 : 5) },
        ]}
      />
      <AppText
        fontSize={md ? AppFontSize.caption : AppFontSize.overline}
        fontWeight="medium"
        style={styles.text}
      >
        Live
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.danger,
  },
  dot: { borderRadius: AppRadius.pill, backgroundColor: AppColors.white },
  text: { color: AppColors.white },
});

export default React.memo(LiveBadge);
