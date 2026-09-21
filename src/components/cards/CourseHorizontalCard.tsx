import React, { useMemo } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import LibraryIcon from '../../assets/icons/course/LibraryIcon';
import VideoIcon from '../../assets/icons/course/VideoIcon';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import type { CourseCardProps } from '../../types/ui/cards/course-card.props';
import AppButton from '../buttons/AppButton';
// import AppCartButton from '../buttons/AppCartButton'; //
import { IS_TABLET } from '../../constants/platform';
import WhitelistButton from '../buttons/WhitelistButton';
import AppText from '../texts/AppText';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';

const formatNumberTH = (n: number) => {
  try {
    return new Intl.NumberFormat('th-TH').format(n);
  } catch {
    return (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

const CourseHorizontalCard: React.FC<CourseCardProps> = ({
  label,
  cover_image,
  teacher,
  is_free,
  price,
  onPress,
  onPressBuy,
  onPressStartLearn,
  whitelist,
  onToggleWhitelist,
  containerStyle,
  library_id,
  library,
  startLabel = 'เริ่มเรียน',
}) => {
  const { scale, verticalScale, responsiveRadius, responsiveSpacing } =
    useResponsive();

  const hasWhitelistProp = typeof whitelist === 'boolean';
  const isWhitelisted = !!whitelist;
  const hasCover = !!(cover_image && cover_image.trim().length > 0);
  const coverImageSource: ImageSourcePropType | null = hasCover
    ? { uri: cover_image }
    : null;

  const teacherInfo = useMemo(() => {
    const firstJoin = teacher?.[0]?.join_Teacher ?? null;
    const firstAvatarUrl = firstJoin?.profile_image?.trim() || '';
    const firstName = `${(firstJoin?.first_name ?? '').trim()} ${(
      firstJoin?.last_name ?? ''
    ).trim()}`.trim();

    return {
      firstAvatar: firstAvatarUrl ? { uri: firstAvatarUrl } : null,
      firstName,
      hasTeacherName: firstName.length > 0,
      remainingCount: Math.max((teacher?.length ?? 0) - 1, 0),
    };
  }, [teacher]);

  const normalizedPrice =
    typeof price === 'number' && !Number.isNaN(price) ? price : 0;
  const inLibrary = !!library || !!library_id;
  const isFreeCourse = normalizedPrice === 0 || !!is_free;
  const priceLabel = `ซื้อ ฿${formatNumberTH(normalizedPrice)}`;
  const learnLabel = startLabel?.trim() || 'เริ่มเรียน';
  const actionLabel = inLibrary ? 'เรียนต่อ' : learnLabel;

  const avatarSize = scale(IS_TABLET ? 32 : 26);
  const padding = responsiveSpacing(IS_TABLET ? 12 : 10);
  const fixedHeight = verticalScale(IS_TABLET ? 168 : 140);
  const imageSize = fixedHeight - padding * 2;
  const buttonHeight = verticalScale(IS_TABLET ? 44 : 40);
  const actionButtonRadius = responsiveRadius(AppRadius.pill);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          borderRadius: responsiveRadius(AppRadius.md),
          padding,
          gap: scale(IS_TABLET ? 20 : 16),
          height: fixedHeight,
          opacity: pressed ? PRESSED_OPACITY : 1,
        },
        containerStyle as ViewStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`คอร์ส ${label}`}
    >
      <View
        style={[
          styles.coverImageWrapper,
          {
            height: imageSize,
            width: imageSize,
            borderRadius: responsiveRadius(AppRadius.sm),
          },
        ]}
      >
        {coverImageSource ? (
          <Image
            source={coverImageSource}
            style={styles.fullSize}
            resizeMode="cover"
            accessibilityLabel="ภาพหน้าปกคอร์ส"
          />
        ) : (
          <View
            style={[
              styles.fullSize,
              styles.coverImagePlaceholder,
              { borderRadius: responsiveRadius(AppRadius.sm) },
            ]}
          />
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <AppText
            numberOfLines={2}
            ellipsizeMode="tail"
            accessibilityLabel={`ชื่อคอร์ส: ${label}`}
            style={styles.labelText}
            fontSize={AppFontSize.body}
            fontWeight="medium"
          >
            {label}
          </AppText>

          {(inLibrary || hasWhitelistProp) && (
            <View
              style={[
                styles.headerRightIcon,
                {
                  marginLeft: scale(IS_TABLET ? 10 : 8),
                  alignSelf: inLibrary ? 'flex-start' : 'center',
                },
              ]}
            >
              {inLibrary ? (
                <LibraryIcon
                  size={IS_TABLET ? 32 : 28}
                  color={AppColors.primary}
                />
              ) : (
                <WhitelistButton
                  isWhitelisted={isWhitelisted}
                  onToggle={next => {
                    onToggleWhitelist?.(next);
                  }}
                  buttonHeight={IS_TABLET ? 32 : 28}
                  buttonWidth={IS_TABLET ? 32 : 28}
                  iconSize={IS_TABLET ? 22 : 18}
                />
              )}
            </View>
          )}
        </View>

        <View
          style={[
            styles.teacherRow,
            { gap: scale(6), minHeight: verticalScale(IS_TABLET ? 28 : 24) },
          ]}
        >
          {teacherInfo.firstAvatar ? (
            <Image
              source={teacherInfo.firstAvatar}
              style={[
                styles.teacherAvatar,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                },
              ]}
              resizeMode="cover"
              accessibilityLabel="ผู้สอน"
            />
          ) : (
            <View
              style={[
                styles.teacherAvatar,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                },
              ]}
            />
          )}

          {teacherInfo.hasTeacherName ? (
            <AppText
              fontSize={AppFontSize.caption}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.teacherNameText}
            >
              {teacherInfo.firstName}
            </AppText>
          ) : (
            <AppText
              fontSize={AppFontSize.caption}
              numberOfLines={1}
              style={[styles.teacherNameText, styles.noTeacherText]}
            >
              ไม่พบข้อมูลผู้สอน
            </AppText>
          )}

          {teacherInfo.remainingCount > 0 && (
            <View
              style={[
                styles.remainingBadge,
                {
                  paddingHorizontal: scale(IS_TABLET ? 10 : 8),
                  height: verticalScale(IS_TABLET ? 24 : 20),
                },
              ]}
            >
              <AppText fontSize={AppFontSize.caption}>
                +{teacherInfo.remainingCount}
              </AppText>
            </View>
          )}
        </View>

        {inLibrary || isFreeCourse ? (
          <TouchableOpacity
            style={[
              styles.startLearn,
              styles.halfInfoButton,
              {
                height: buttonHeight,
                borderRadius: actionButtonRadius,
                gap: scale(8),
              },
            ]}
            activeOpacity={PRESSED_OPACITY}
            onPress={e => {
              e.stopPropagation?.();
              (onPressStartLearn ?? onPress)?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <VideoIcon size={IS_TABLET ? 22 : 18} color={AppColors.primary} />
            <AppText
              style={styles.startLearnText}
              numberOfLines={1}
              ellipsizeMode="tail"
              fontSize={AppFontSize.caption}
            >
              {actionLabel}
            </AppText>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionRow, { gap: scale(10) }]}>
            <View style={styles.buyButtonContainer}>
              <AppButton
                title={priceLabel}
                onPress={() => {
                  onPressBuy?.();
                }}
                fontSize={AppFontSize.caption}
                containerStyle={{
                  width: '100%',
                  borderRadius: actionButtonRadius,
                }}
                contentStyle={[
                  styles.buyButtonContent,
                  {
                    height: buttonHeight,
                    minHeight: buttonHeight,
                    paddingHorizontal: 0,
                    paddingVertical: 0,
                  },
                ]}
              />
            </View>

            {/*
            <AppCartButton
              enableToggle
              defaultActive={cartToggleDefault}
              onToggle={onToggleCart}
              containerStyle={{
                paddingVertical: verticalScale(10),
                paddingHorizontal: scale(20),
              }}
            />
            */}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: AppColors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
  },
  coverImageWrapper: {
    flexShrink: 0,
    overflow: 'hidden',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    backgroundColor: AppColors.surfaceSubtle,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  infoContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  labelText: {
    flex: 1,
    minWidth: 0,
    textAlignVertical: 'center',
  },
  headerRightIcon: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  teacherNameText: {
    flexShrink: 1,
    minWidth: 0,
  },
  noTeacherText: {
    color: AppColors.textSecondary,
  },
  teacherAvatar: {
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
    backgroundColor: AppColors.surfaceStrong,
    overflow: 'hidden',
  },
  remainingBadge: {
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  buyButtonContainer: {
    width: '60%',
    alignSelf: 'flex-end',
  },
  buyButtonContent: {
    paddingVertical: 0,
    justifyContent: 'center',
  },
  startLearn: {
    backgroundColor: AppColors.backgroundInteractive,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfInfoButton: {
    width: '60%',
    alignSelf: 'flex-end',
  },
  startLearnText: {
    color: AppColors.primary,
    textAlign: 'center',
  },
  libraryStatusContainer: {
    alignSelf: 'flex-start',
  },
});

export default React.memo(CourseHorizontalCard);
