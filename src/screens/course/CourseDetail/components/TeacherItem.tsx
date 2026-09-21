import React, { memo, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import PlayCircleSolidIcon from '../../../../assets/icons/teacher/PlayCircleSolidIcon';
import StarIcon from '../../../../assets/icons/teacher/StarIcon';
import RoundProfileImage from '../../../../components/profiles/RoundProfileImage';
import AppText from '../../../../components/texts/AppText';
import { IS_TABLET } from '../../../../constants/platform';
import { useResponsive } from '../../../../helpers/responsive';
import { AppColors } from '../../../../styles/colors';
import { Teacher } from '../../../../types/data/teachers/teacher.type';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../../../styles/sharedstyles';
// Props for one teacher card item

export interface TeacherItemProps {
  teacher: Teacher;
  onPress: () => void;
}

const TeacherItem: React.FC<TeacherItemProps> = ({ teacher, onPress }) => {
  const { scale, responsiveRadius } = useResponsive();

  // Memoized styles for responsive spacing
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(16),
          backgroundColor: AppColors.cardBackground,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.md),
          padding: scale(14),
        },
        details: {
          flex: 1,
          justifyContent: 'space-between',
          gap: scale(6),
        },
        row: {
          flexDirection: 'row',
          gap: scale(IS_TABLET ? 8 : 6),
          alignItems: 'center',
        },
      }),
    [scale, responsiveRadius],
  );

  return (
    // Entire teacher item is tappable
    <TouchableOpacity activeOpacity={PRESSED_OPACITY} onPress={onPress}>
      <View style={styles.container}>
        <RoundProfileImage
          disabled
          source={
            teacher.profile_image ? { uri: teacher.profile_image } : undefined
          }
          size={IS_TABLET ? 96 : 80}
        />

        <View style={styles.details}>
          <AppText
            numberOfLines={1}
            ellipsizeMode="tail"
            fontSize={AppFontSize.subtitle}
          >
            {teacher.first_name} {teacher.last_name}
          </AppText>

          <View style={styles.row}>
            <PlayCircleSolidIcon size={IS_TABLET ? 20 : 16} />
            <AppText fontSize={AppFontSize.caption}>
              {teacher.course_amount} คอร์ส
            </AppText>
          </View>

          <View style={styles.row}>
            <StarIcon size={IS_TABLET ? 20 : 16} />
            <AppText fontSize={AppFontSize.caption}>
              <AppText
                style={{ color: AppColors.primary }}
                fontSize={AppFontSize.caption}
              >
                {teacher.ratings_amount || 0}
              </AppText>{' '}
              ({teacher.review_amount} รีวิว)
            </AppText>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={IS_TABLET ? 22 : 18}
          color={AppColors.textTertiary}
        />
      </View>
    </TouchableOpacity>
  );
};

export default memo(TeacherItem);
