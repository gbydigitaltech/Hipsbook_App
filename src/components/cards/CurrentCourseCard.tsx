// components/cards/CurrentCourseCard.tsx
import React, { useMemo } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { CurrentCourseCardProps } from '../../types/ui/cards/current-course-card.props';
import AppText from '../texts/AppText';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';

const CurrentCourseCard: React.FC<CurrentCourseCardProps> = ({
  // id,
  label, // Course title
  progress, // Progress value (expected 0..1)
  cover_image, // Cover image (URL or image source)
  teacher, // Teacher list
}) => {
  const { scale, verticalScale, responsiveRadius, responsiveSpacing } =
    useResponsive();

  // Normalize cover image source
  const coverImageSource = useMemo<ImageSourcePropType | undefined>(() => {
    if (!cover_image) return undefined;

    if (typeof cover_image === 'string') {
      return { uri: cover_image };
    }
    return cover_image;
  }, [cover_image]);

  // Build teacher avatar source list
  const avatarList = useMemo<ImageSourcePropType[]>(() => {
    if (!teacher) return [];
    return teacher
      .map(t => {
        const src = t.profile_image;
        if (!src) return null;
        if (typeof src === 'string') return { uri: src };
        return src;
      })
      .filter((v): v is ImageSourcePropType => v != null);
  }, [teacher]);

  // Build teacher display name list
  const nameList = useMemo<string[]>(() => {
    if (!teacher) return [];
    return teacher.map(t =>
      `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim(),
    );
  }, [teacher]);

  // Show first teacher + remaining count badge
  const firstAvatar = avatarList[0];
  const firstName = nameList[0] ?? '';
  const remainingCount = Math.max(
    avatarList.length - 1,
    nameList.length - 1,
    0,
  );

  // Responsive dimensions (aligned with CourseHorizontalCard scale)
  const avatarSize = scale(26);
  const padding = responsiveSpacing(10);
  const fixedHeight = verticalScale(138);
  const imageSize = fixedHeight - padding * 2;

  // Memoize styles to avoid re-creating style objects every render
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'stretch',
          backgroundColor: AppColors.cardBackground,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.md),
          padding: padding,
          gap: scale(16),
          height: fixedHeight,
        },
        coverImageWrapper: {
          flexShrink: 0,
          height: imageSize,
          width: imageSize,
          borderRadius: responsiveRadius(AppRadius.sm),
          overflow: 'hidden',
        },
        coverImage: {
          width: '100%',
          height: '100%',
        },
        coverImagePlaceholder: {
          width: '100%',
          height: '100%',
          backgroundColor: AppColors.surfaceSubtle,
          borderWidth: 1,
          borderColor: AppColors.borderStrong,
          borderRadius: responsiveRadius(AppRadius.sm),
        },
        info: {
          flex: 1,
          justifyContent: 'space-around',
          gap: verticalScale(4),
        },
        teacherRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          flexWrap: 'nowrap',
          minHeight: verticalScale(22),
        },
        avatar: {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          borderWidth: 1,
          borderColor: AppColors.secondary,
          backgroundColor: AppColors.surfaceStrong,
          overflow: 'hidden',
        },
        teacherNameText: {
          flexShrink: 1,
          minWidth: 0,
        },
        remainingBadge: {
          paddingHorizontal: scale(8),
          height: verticalScale(20),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surfaceStrong,
          alignItems: 'center',
          justifyContent: 'center',
        },
        progressBar: {
          height: verticalScale(6),
          borderRadius: 3,
          backgroundColor: AppColors.progressTrack,
          overflow: 'hidden',
          marginTop: verticalScale(5),
        },
        progressFill: {
          height: '100%',
          backgroundColor: AppColors.primary,
          width: `${Math.min(progress, 1) * 100}%`, // clamp upper bound to 100%
        },
      }),
    [
      scale,
      verticalScale,
      responsiveRadius,
      progress,
      avatarSize,
      fixedHeight,
      imageSize,
      padding,
    ],
  );

  return (
    <View style={styles.container}>
      <View style={styles.coverImageWrapper}>
        {coverImageSource ? (
          <Image
            source={coverImageSource}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverImagePlaceholder} />
        )}
      </View>

      <View style={styles.info}>
        <AppText
          numberOfLines={2}
          ellipsizeMode="tail"
          fontSize={AppFontSize.body}
          fontWeight="medium"
        >
          {label}
        </AppText>

        <View style={styles.teacherRow}>
          {firstAvatar ? (
            <Image
              source={firstAvatar}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatar} />
          )}

          {!!firstName && (
            <AppText
              fontSize={AppFontSize.caption}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.teacherNameText}
            >
              {firstName}
            </AppText>
          )}

          {remainingCount > 0 && (
            <View style={styles.remainingBadge}>
              <AppText fontSize={AppFontSize.caption}>
                +{remainingCount}
              </AppText>
            </View>
          )}
        </View>

        <View>
          <AppText fontSize={AppFontSize.caption}>เรียนต่อ</AppText>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default CurrentCourseCard;
