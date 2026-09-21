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
// import AppCartButton from '../buttons/AppCartButton'; // <-- not used (commented)
import { IS_TABLET } from '../../constants/platform';
import WhitelistButton from '../buttons/WhitelistButton';
import AppText from '../texts/AppText';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';

// Format number using Thai locale, with fallback formatter
const formatNumberTH = (n: number) => {
  try {
    return new Intl.NumberFormat('th-TH').format(n);
  } catch {
    return (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

const CourseVerticalCard: React.FC<CourseCardProps> = ({
  label, // Course title
  cover_image, // Cover image URL
  teacher, // Teacher list
  is_free, // Free flag
  price, // Course price
  onPress, // Card press action
  onPressBuy, // Buy button action
  onPressStartLearn, // Start learning action
  onPressGoToLibrary, // Go to library action
  whitelist, // Whitelist state (optional)
  onToggleWhitelist, // Whitelist toggle callback
  // cartToggleDefault = false, // Initial cart toggle state (commented - not used)
  // onToggleCart, // Cart toggle callback (commented - not used)
  containerStyle, // External style override for card container
  library_id, // Library id (if owned)
  library, // Library ownership flag
  startLabel, // Custom label for start/continue action
}) => {
  const { scale, verticalScale, responsiveRadius, responsiveSpacing } =
    useResponsive();

  // Whitelist state
  const hasWhitelistProp = typeof whitelist === 'boolean';
  const isWhitelisted = !!whitelist;

  // Cover image source
  const hasCover = !!(cover_image && cover_image.trim().length > 0);
  const coverImageSource: ImageSourcePropType | null = hasCover
    ? { uri: cover_image }
    : null;

  // Teacher summary (show first teacher + remaining count)
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

  // Price / library states
  const normalizedPrice =
    typeof price === 'number' && !Number.isNaN(price) ? price : 0;
  const inLibrary = !!library || !!library_id;
  const isFreeCourse = normalizedPrice === 0 || !!is_free;
  const priceLabel = `ซื้อ ฿${formatNumberTH(normalizedPrice)}`;
  const learnLabel = startLabel?.trim() || 'เริ่มเรียน';
  const actionLabel = inLibrary ? 'เรียนต่อ' : learnLabel;

  // Responsive dimensions
  const avatarSize = scale(IS_TABLET ? 30 : 26);
  const padding = responsiveSpacing(IS_TABLET ? 12 : 10);
  const fixedHeight = verticalScale(IS_TABLET ? 372 : 310);
  const cardWidth = scale(IS_TABLET ? 264 : 220);
  const imageAspectRatio = 4 / 3;
  const cardRadius = responsiveRadius(AppRadius.md);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          borderRadius: cardRadius,
          height: fixedHeight,
          width: cardWidth,
          opacity: pressed ? PRESSED_OPACITY : 1,
        },
        containerStyle as ViewStyle,
      ]}
    >
      <View
        style={[
          styles.coverImageWrapper,
          {
            aspectRatio: imageAspectRatio,
            borderTopLeftRadius: cardRadius,
            borderTopRightRadius: cardRadius,
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
              {
                borderTopLeftRadius: cardRadius,
                borderTopRightRadius: cardRadius,
              },
            ]}
          />
        )}
      </View>

      <View
        style={[
          styles.infoContainer,
          {
            paddingHorizontal: padding,
            paddingTop: verticalScale(4),
            paddingBottom: padding,
            gap: verticalScale(6),
          },
        ]}
      >
        <View style={styles.headerRow}>
          <AppText
            numberOfLines={2}
            ellipsizeMode="tail"
            accessibilityLabel={`ชื่อคอร์ส: ${label}`}
            style={styles.labeltext}
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
                  marginLeft: scale(8),
                  alignSelf: inLibrary ? 'flex-start' : 'center',
                  marginTop: inLibrary ? verticalScale(2) : 0,
                },
              ]}
            >
              {inLibrary ? (
                <LibraryIcon
                  size={IS_TABLET ? 34 : IS_TABLET ? 34 : 28}
                  color={AppColors.primary}
                />
              ) : (
                <WhitelistButton
                  isWhitelisted={isWhitelisted}
                  onToggle={next => {
                    onToggleWhitelist?.(next);
                  }}
                  buttonHeight={IS_TABLET ? 34 : 28}
                  buttonWidth={IS_TABLET ? 34 : 28}
                  iconSize={IS_TABLET ? 22 : 18}
                />
              )}
            </View>
          )}
        </View>

        <View
          style={[
            styles.teacherRow,
            { gap: scale(6), minHeight: verticalScale(IS_TABLET ? 26 : 22) },
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
                  paddingHorizontal: scale(8),
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

        {inLibrary ? (
          <TouchableOpacity
            style={[
              styles.startLearn,
              {
                paddingVertical: verticalScale(10),
                borderRadius: responsiveRadius(AppRadius.pill),
                gap: scale(8),
              },
            ]}
            activeOpacity={PRESSED_OPACITY}
            onPress={e => {
              e.stopPropagation?.();
              (onPressGoToLibrary ?? onPressStartLearn ?? onPress)?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <VideoIcon size={18} color={AppColors.primary} />
            <AppText
              style={[styles.startLearnText]}
              fontSize={AppFontSize.caption}
            >
              {actionLabel}
            </AppText>
          </TouchableOpacity>
        ) : isFreeCourse ? (
          <TouchableOpacity
            style={[
              styles.startLearn,
              {
                paddingVertical: verticalScale(10),
                borderRadius: responsiveRadius(AppRadius.pill),
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
            <VideoIcon size={18} color={AppColors.primary} />
            <AppText
              style={[styles.startLearnText]}
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
                onPress={onPressBuy ?? (() => {})}
                fontSize={AppFontSize.caption}
                fullWidth
                contentStyle={{
                  paddingVertical: verticalScale(10),
                }}
              />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: AppColors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  coverImageWrapper: {
    flexShrink: 0,
    width: '100%',
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labeltext: {
    flex: 1,
    textAlignVertical: 'center',
  },
  headerRightIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignSelf: 'flex-end',
  },
  buyButtonContainer: {
    flex: 1,
  },
  startLearn: {
    backgroundColor: AppColors.backgroundInteractive,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLearnText: {
    color: AppColors.primary,
  },
  libraryStatusContainer: {
    alignSelf: 'flex-start',
  },
});

export default React.memo(CourseVerticalCard);
