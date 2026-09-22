import { BlurView } from '@react-native-community/blur';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import PlayCircleIcon from '../../assets/icons/course/PlayCircleIcon';
import VideoIcon from '../../assets/icons/course/VideoIcon';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { getVideoThumbnailUrl } from '../../helpers/videoThumbnail';
import AppImage from '../images/AppImage';
import { IMAGES } from '../../constants/images-paths';
import { AppColors } from '../../styles/colors';
import AppButton from '../buttons/AppButton';
import AppText from '../texts/AppText';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';

const stripHtml = (html?: string) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
};

const formatNumberTH = (n: number) => {
  try {
    return new Intl.NumberFormat('th-TH').format(n);
  } catch {
    return (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

const normalizeFlag = (value: unknown) =>
  value === true || value === 1 || value === '1';

const normalizePrice = (value: unknown) => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

type LessonCardProps = {
  title: string;
  description?: string;
  price: number;
  mediaId?: string;
  is_free?: boolean;
  activate?: boolean | number | string;
  onPressBuy?: () => void;
  onPressStart?: () => void;
};

const CourseDetailLessonCard: React.FC<LessonCardProps> = ({
  title,
  description,
  price,
  mediaId,
  is_free,
  activate,
  onPressBuy,
  onPressStart,
}) => {
  const { scale, responsiveRadius, verticalScale } = useResponsive();

  const normalizedPrice = normalizePrice(price);
  const isFreeCourse = normalizedPrice === 0 || normalizeFlag(is_free);
  const isActivated = normalizeFlag(activate);
  const canStart = isFreeCourse || isActivated;

  const cleanDescription = useMemo(() => stripHtml(description), [description]);

  const paidPriceLabel = `ซื้อ ฿${formatNumberTH(normalizedPrice)}`;
  const cardHeight = IS_TABLET ? 140 : 116;
  const imageWidth = cardHeight * (4 / 3);
  const thumbnailUrl = getVideoThumbnailUrl(mediaId, IS_TABLET ? 720 : 480);

  const actionButtonWidth = scale(IS_TABLET ? 148 : 120);
  const actionButtonHeight = verticalScale(IS_TABLET ? 48 : 42);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        outerContainer: {
          flexDirection: 'row',
          backgroundColor: AppColors.cardBackground,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.md),
          overflow: 'hidden',
          height: verticalScale(cardHeight),
        },
        coverImageWrapper: {
          width: scale(imageWidth),
          height: verticalScale(cardHeight),
          overflow: 'hidden',
          borderRadius: responsiveRadius(AppRadius.sm),
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
          paddingVertical: verticalScale(10),
          paddingHorizontal: scale(IS_TABLET ? 12 : 10),
          justifyContent: 'center',
        },
        contentArea: {
          flex: 1,
          justifyContent: 'space-between',
        },
        textGroup: {
          flex: 1,
        },
        descriptionText: {
          color: AppColors.white,
          opacity: 0.7,
          marginTop: verticalScale(IS_TABLET ? 3 : 2),
        },
        buttonRightContainer: {
          alignItems: 'flex-end',
          marginTop: verticalScale(4),
        },
        actionButtonWrapper: {
          width: actionButtonWidth,
          height: actionButtonHeight,
        },
        startButtonTouchable: {
          width: '100%',
          height: '100%',
        },
        startLearn: {
          width: '100%',
          height: '100%',
          backgroundColor: AppColors.backgroundInteractive,
          borderRadius: responsiveRadius(AppRadius.pill),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: scale(8),
          paddingHorizontal: scale(12),
        },
        startLearnText: {
          color: AppColors.primary,
        },
        buyButtonContent: {
          height: actionButtonHeight,
          paddingVertical: 0,
          paddingHorizontal: scale(20),
        },
      }),
    [
      responsiveRadius,
      cardHeight,
      imageWidth,
      verticalScale,
      scale,
      actionButtonWidth,
      actionButtonHeight,
    ],
  );

  return (
    <View style={styles.outerContainer}>
      <View style={styles.coverImageWrapper}>
        <View style={styles.coverContent}>
          <AppImage
            uri={thumbnailUrl}
            style={styles.coverImage}
            placeholderIcon={IMAGES.appLogoFull}
          />
          <View style={styles.playIconOverlay}>
            <PlayCircleIcon size={IS_TABLET ? 34 : 28} />
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

      <View style={styles.cardContainer}>
        <View style={styles.contentArea}>
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
                numberOfLines={1}
                ellipsizeMode="tail"
                fontSize={AppFontSize.caption}
                style={styles.descriptionText}
              >
                {cleanDescription}
              </AppText>
            )}
          </View>

          <View style={styles.buttonRightContainer}>
            <View style={styles.actionButtonWrapper}>
              {canStart ? (
                <TouchableOpacity
                  onPress={onPressStart}
                  activeOpacity={PRESSED_OPACITY}
                  style={styles.startButtonTouchable}
                >
                  <View style={styles.startLearn}>
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
                </TouchableOpacity>
              ) : (
                <AppButton
                  title={paidPriceLabel}
                  onPress={onPressBuy ?? (() => {})}
                  fontSize={AppFontSize.caption}
                  fullWidth
                  contentStyle={styles.buyButtonContent}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CourseDetailLessonCard;
