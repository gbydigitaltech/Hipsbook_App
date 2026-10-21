import React, { useMemo } from 'react';
import {
  DimensionValue,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import LibraryIcon from '../../assets/icons/course/LibraryIcon';
import VideoIcon from '../../assets/icons/course/VideoIcon';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { buyLabel, isFreeItem } from '../../helpers/access';
import { AppColors } from '../../styles/colors';
import type { CourseCardProps } from '../../types/ui/cards/course-card.props';
import AppButton from '../buttons/AppButton';
import AppImage from '../images/AppImage';
// import AppCartButton from '../buttons/AppCartButton'; //
import WhitelistButton from '../buttons/WhitelistButton';
import AppText from '../texts/AppText';
import {
  AppButtonHeight,
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
  AppIconSize,
  adaptiveSize,
} from '../../styles/sharedstyles';

/**
 * Minimum action-button width (% of the info column); the button grows
 * past it when the label is longer. Shared with
 * HorizontalCourseSlider's skeleton. Tablet uses a smaller share because the
 * card is much wider, so 60% would make the button a long bar.
 */
export const COURSE_HORIZONTAL_ACTION_WIDTH: DimensionValue = IS_TABLET
  ? '40%'
  : '60%';

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

  const inLibrary = !!library || !!library_id;
  const isFreeCourse = isFreeItem(price, is_free);
  const priceLabel = buyLabel(price);
  const learnLabel = startLabel?.trim() || 'เริ่มเรียน';
  const actionLabel = inLibrary ? 'เรียนต่อ' : learnLabel;

  const avatarSize = scale(adaptiveSize(26));
  const padding = responsiveSpacing(adaptiveSize(10));
  const fixedHeight = verticalScale(adaptiveSize(140));
  const imageSize = fixedHeight - padding * 2;
  const buttonHeight = verticalScale(AppButtonHeight.card);
  // Minimum width; the button grows for longer labels (e.g. ฿12,990)
  const actionWidth = COURSE_HORIZONTAL_ACTION_WIDTH;
  const actionPaddingH = scale(adaptiveSize(16));
  const actionButtonRadius = responsiveRadius(AppRadius.pill);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          borderRadius: responsiveRadius(AppRadius.md),
          padding,
          gap: scale(adaptiveSize(16)),
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
        <AppImage
          uri={cover_image}
          style={styles.fullSize}
          accessibilityLabel="ภาพหน้าปกคอร์ส"
        />
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
                  marginLeft: scale(adaptiveSize(8)),
                  alignSelf: inLibrary ? 'flex-start' : 'center',
                },
              ]}
            >
              {inLibrary ? (
                <LibraryIcon size={AppIconSize.xxl} color={AppColors.primary} />
              ) : (
                <WhitelistButton
                  isWhitelisted={isWhitelisted}
                  onToggle={next => {
                    onToggleWhitelist?.(next);
                  }}
                  buttonHeight={adaptiveSize(28)}
                  buttonWidth={adaptiveSize(28)}
                  iconSize={AppIconSize.md}
                />
              )}
            </View>
          )}
        </View>

        <View
          style={[
            styles.teacherRow,
            { gap: scale(6), minHeight: verticalScale(adaptiveSize(24)) },
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
                  paddingHorizontal: scale(adaptiveSize(8)),
                  height: verticalScale(adaptiveSize(20)),
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
                minWidth: actionWidth,
                paddingHorizontal: actionPaddingH,
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
            <VideoIcon size={AppIconSize.md} color={AppColors.primary} />
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
            <View
              style={[styles.buyButtonContainer, { minWidth: actionWidth }]}
            >
              <AppButton
                title={priceLabel}
                onPress={() => {
                  onPressBuy?.();
                }}
                fontSize={AppFontSize.caption}
                fullWidth
                containerStyle={{
                  borderRadius: actionButtonRadius,
                }}
                contentStyle={[
                  styles.buyButtonContent,
                  {
                    // Width follows the label (long prices grow the button)
                    width: 'auto',
                    height: buttonHeight,
                    minHeight: buttonHeight,
                    paddingHorizontal: actionPaddingH,
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
    alignSelf: 'flex-end',
    maxWidth: '100%',
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
    alignSelf: 'flex-end',
    maxWidth: '100%',
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
