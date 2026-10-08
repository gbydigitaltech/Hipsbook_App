import React from 'react';
import { StyleSheet, View } from 'react-native';
import LockCircleIcon from '../../assets/icons/course/LockCircleIcon';
import { AppColors } from '../../styles/colors';

type Props = {
  /**
   * Icon size before scaling. Pass the same value as the card's
   * PlayCircleIcon so the locked and playable states look like a pair.
   */
  size?: number;
};

/**
 * Not bought yet: dark tint over the (sharp) thumbnail + a lock badge in the
 * same style as PlayCircleIcon (white circle, glyph cut out).
 */
const LockedThumbOverlay: React.FC<Props> = ({ size = 28 }) => (
  <View
    style={styles.overlay}
    pointerEvents="none"
    accessible
    accessibilityLabel="ยังไม่ได้ซื้อ"
  >
    <LockCircleIcon size={size} />
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(LockedThumbOverlay);
