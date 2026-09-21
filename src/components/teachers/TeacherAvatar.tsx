import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import type { TeacherAvatarProps } from '../../types/ui/teachers/teacher-avatar.props';

const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  //id, // Teacher id (reserved for tracking/future use)
  source, // Avatar image source
  size = 94, // Base avatar size
  borderColor, // Optional border color
  borderWidth = 0, // Optional border width
}) => {
  const { scale, verticalScale } = useResponsive();

  // Average horizontal/vertical scaling to keep circle balanced
  const avatarSize = (scale(size) + verticalScale(size)) / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          ...(borderColor && borderWidth ? { borderColor, borderWidth } : {}),
        },
      ]}
    >
      <Image source={source} style={styles.image} resizeMode="cover" />
    </View>
  );
};

export default TeacherAvatar;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundInteractive,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
