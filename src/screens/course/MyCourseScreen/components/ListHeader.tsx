import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import RoundProfileImage from '../../../../components/profiles/RoundProfileImage';
import AppText from '../../../../components/texts/AppText';
import { IS_TABLET } from '../../../../constants/platform';
import { AppFontSize } from '../../../../styles/sharedstyles';
import { ProfileResponse } from '../../../../types/data/profile/profile.types';

type Props = {
  profile: ProfileResponse | null;
  courseCount?: number;
  styles: ReturnType<typeof StyleSheet.create>;
  showSkeleton?: boolean;
  onPressAvatar?: () => void;
};

export const MY_COURSE_AVATAR_SIZE = IS_TABLET ? 100 : 88;

const ListHeader = ({
  profile,
  courseCount,
  styles,
  showSkeleton = false,
  onPressAvatar,
}: Props) => {
  const initialsNameSource = (
    profile?.first_name ??
    profile?.email ??
    ''
  ).trim();

  const subtitle =
    typeof courseCount === 'number' && courseCount > 0
      ? `กำลังเรียน ${courseCount} คอร์ส`
      : 'ยังไม่มีคอร์สในคลัง';

  return (
    <View style={styles.profileHeader}>
      {showSkeleton ? (
        <>
          <View style={styles.skeletonTextGroup}>
            <View style={styles.skeletonName} />
            <View style={styles.skeletonEmail} />
          </View>
          <View style={styles.skeletonAvatar} />
        </>
      ) : (
        <>
          <View style={styles.profileInfo}>
            <AppText
              style={styles.nameText}
              fontSize={AppFontSize.h1}
              fontWeight="semiBold"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              คอร์สของฉัน
            </AppText>

            <AppText
              style={styles.emailText}
              fontSize={AppFontSize.caption}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </AppText>
          </View>

          <Pressable
            onPress={onPressAvatar}
            disabled={!onPressAvatar}
            accessibilityRole={onPressAvatar ? 'button' : undefined}
            accessibilityLabel="ไปหน้าโปรไฟล์"
          >
            <RoundProfileImage
              name={initialsNameSource || undefined}
              imageUrl={
                typeof profile?.profile_image === 'string'
                  ? profile.profile_image
                  : undefined
              }
              disabled
              size={MY_COURSE_AVATAR_SIZE}
            />
          </Pressable>
        </>
      )}
    </View>
  );
};

export default React.memo(ListHeader);
