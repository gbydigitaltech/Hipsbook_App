import { BlurView } from '@react-native-community/blur';
import React, { memo, useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import ChevronDownIcon from '../../assets/icons/ChevronDownIcon';
import PlayCircleIcon from '../../assets/icons/course/PlayCircleIcon';
import VideoIcon from '../../assets/icons/course/VideoIcon';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { getVideoThumbnailUrl } from '../../helpers/videoThumbnail';
import { AppColors } from '../../styles/colors';
import AppButton from '../buttons/AppButton';
import AppText from '../texts/AppText';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';

// Strip HTML tags.
const stripHtml = (html?: string) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
};

// Format number using Thai locale
const formatNumberTH = (n: number) => {
  try {
    return new Intl.NumberFormat('th-TH').format(n);
  } catch {
    return (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

const normalizeFlag = (v: unknown) => v === true || v === 1 || v === '1';

type LessonCardProps = {
  title: string;
  description?: string;
  price: number;
  mediaId?: string;
  is_free?: boolean;
  activate?: boolean | number | string;
  isPlaying?: boolean;
  onPressBuy?: () => void;
  onPressStart?: () => void;
  hasAttachments?: boolean;
  onPressAttachments?: () => void;
  isAttachmentsExpanded?: boolean;
};

const ClassRoomLibraryLessonCard: React.FC<LessonCardProps> = ({
  title,
  description,
  price,
  mediaId,
  is_free,
  activate,
  onPressBuy,
  onPressStart,
  isPlaying = false,
  hasAttachments = false,
  onPressAttachments,
  isAttachmentsExpanded = false,
}) => {
  const { scale, responsiveRadius, verticalScale } = useResponsive();

  const isFreeCourse = Number(price) === 0 || !!is_free;
  const isActivated = normalizeFlag(activate);
  const canStart = isFreeCourse || isActivated;

  const cleanDescription = useMemo(() => stripHtml(description), [description]);
  const paidPriceLabel = `ซื้อ ฿${formatNumberTH(Number(price) || 0)}`;

  const cardHeight = IS_TABLET ? 156 : 116;
  const imageWidth = cardHeight * (4 / 3);
  const thumbnailUrl = getVideoThumbnailUrl(mediaId, 720);
  const showAttachmentButton =
    canStart && hasAttachments && !!onPressAttachments;

  const actionButtonWidth = scale(IS_TABLET ? 156 : 120);
  const actionButtonHeight = verticalScale(IS_TABLET ? 48 : 42);

  const handleTouchLesson = () => {
    if (canStart && onPressStart) onPressStart();
  };

  return (
    <Pressable
      onPress={handleTouchLesson}
      style={({ pressed }) => [
        styles.outerContainer,
        {
          height: verticalScale(cardHeight),
          borderRadius: responsiveRadius(AppRadius.md),
          opacity: pressed && canStart ? 0.85 : 1,
        },
        isPlaying && styles.isPlaying,
      ]}
    >
      <View
        style={[
          styles.coverImageWrapper,
          {
            width: scale(imageWidth),
            height: verticalScale(cardHeight),
            borderRadius: responsiveRadius(AppRadius.md),
          },
        ]}
      >
        <View style={styles.coverContent}>
          <Image
            source={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.playIconOverlay}>
            <PlayCircleIcon size={IS_TABLET ? 44 : 28} />
          </View>
        </View>

        {!canStart && (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={2}
          />
        )}
      </View>

      <View
        style={[
          styles.cardContainer,
          {
            paddingVertical: verticalScale(IS_TABLET ? 10 : 8),
            paddingHorizontal: scale(IS_TABLET ? 12 : 10),
          },
        ]}
      >
        <View style={styles.contentArea}>
          <View style={[styles.titleRow, { gap: scale(10) }]}>
            <View style={styles.textGroup}>
              <AppText
                numberOfLines={1}
                ellipsizeMode="tail"
                fontSize={AppFontSize.subtitle}
                fontWeight="medium"
              >
                {title}
              </AppText>

              {!!cleanDescription && (
                <AppText
                  numberOfLines={IS_TABLET ? 2 : 1}
                  ellipsizeMode="tail"
                  fontSize={AppFontSize.caption}
                  style={[
                    styles.descriptionText,
                    { marginTop: verticalScale(2) },
                  ]}
                >
                  {cleanDescription}
                </AppText>
              )}
            </View>

            {showAttachmentButton && (
              <TouchableOpacity
                activeOpacity={PRESSED_OPACITY}
                style={[
                  styles.attachmentBtn,
                  {
                    width: scale(IS_TABLET ? 38 : 32),
                    height: scale(IS_TABLET ? 38 : 32),
                    borderRadius: responsiveRadius(AppRadius.pill),
                  },
                ]}
                onPress={onPressAttachments}
              >
                <View
                  style={{
                    transform: [
                      { rotate: isAttachmentsExpanded ? '180deg' : '0deg' },
                    ],
                  }}
                >
                  <ChevronDownIcon
                    size={IS_TABLET ? 16 : 14}
                    color={AppColors.white}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.buttonRightContainer}>
            {canStart ? (
              <View
                style={[
                  styles.startLearn,
                  {
                    width: actionButtonWidth,
                    height: actionButtonHeight,
                    borderRadius: responsiveRadius(AppRadius.pill),
                    gap: scale(8),
                  },
                ]}
              >
                <VideoIcon
                  size={IS_TABLET ? 22 : 18}
                  color={AppColors.primary}
                />
                <AppText
                  style={styles.startLearnText}
                  fontSize={AppFontSize.caption}
                >
                  เริ่มเรียน
                </AppText>
              </View>
            ) : (
              <View style={[styles.actionRow, { gap: scale(10) }]}>
                <View
                  style={{
                    width: actionButtonWidth,
                    height: actionButtonHeight,
                  }}
                >
                  <AppButton
                    title={paidPriceLabel}
                    onPress={onPressBuy ?? (() => {})}
                    fontSize={AppFontSize.caption}
                    containerStyle={{
                      height: actionButtonHeight,
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  isPlaying: {
    backgroundColor: AppColors.cardActive,
    borderColor: AppColors.primary,
  },
  coverImageWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  coverContent: {
    ...StyleSheet.absoluteFill,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textGroup: {
    flex: 1,
  },
  descriptionText: {
    color: AppColors.textSecondary,
  },
  attachmentBtn: {
    backgroundColor: AppColors.backgroundInteractive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRightContainer: {
    alignItems: 'flex-end',
  },
  startLearn: {
    backgroundColor: AppColors.backgroundInteractive,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  startLearnText: {
    color: AppColors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
});

export default memo(ClassRoomLibraryLessonCard);
