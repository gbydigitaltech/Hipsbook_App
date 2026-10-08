import { Ionicons } from '@react-native-vector-icons/ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

type Props = {
  title: string;
  /** Not bought yet: show a lock in front of the title */
  locked?: boolean;
};

/** Title row of document cards (optional lock before the title). */
const LessonCardTitle: React.FC<Props> = ({ title, locked = false }) => {
  const { scale } = useResponsive();

  return (
    <View style={[styles.row, { gap: scale(6) }]}>
      {locked && (
        <Ionicons
          name="lock-closed"
          size={scale(14)}
          color={AppColors.textTertiary}
          accessibilityLabel="ยังไม่ได้ซื้อ"
        />
      )}
      <AppText
        numberOfLines={1}
        ellipsizeMode="tail"
        fontSize={AppFontSize.subtitle}
        fontWeight="medium"
        style={styles.text}
      >
        {title}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flexShrink: 1 },
});

export default React.memo(LessonCardTitle);
