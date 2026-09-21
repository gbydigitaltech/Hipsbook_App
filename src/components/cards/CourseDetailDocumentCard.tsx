import { BlurView } from '@react-native-community/blur';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import AudioIcon from '../../assets/icons/course/AudioIcon';
import ListenIcon from '../../assets/icons/course/ListenIcon';
import DownloadIcon from '../../assets/icons/DownloadIcon';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import AppButton from '../buttons/AppButton';
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

const normalizeFlag = (value: unknown) =>
  value === true || value === 1 || value === '1';

const normalizePrice = (value: unknown) => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

type DocumentType = 'pdf' | 'audio';

type Props = {
  type: DocumentType;
  title: string;
  size?: string;
  length?: string;
  format?: string;
  price: number;
  is_free?: boolean;
  library?: boolean;
  activate?: boolean | number | string;
  onPressBuy?: () => void;
  onPressStart?: () => void;
  isActive?: boolean;
  pdfUrl?: string;
};

const CourseDetailDocumentCard: React.FC<Props> = ({
  type,
  title,
  size = '—',
  length,
  format,
  price,
  is_free,
  activate,
  onPressBuy,
  onPressStart,
  isActive,
}) => {
  const { scale, responsiveRadius, verticalScale, responsiveSpacing } =
    useResponsive();

  const normalizedPrice = normalizePrice(price);
  const isFreeDoc = normalizedPrice === 0 || normalizeFlag(is_free);
  const isActivated = normalizeFlag(activate);

  const canStart = isFreeDoc || isActivated;

  const paidPriceLabel = `ซื้อ ฿${formatNumberTH(normalizedPrice)}`;
  const padding = responsiveSpacing(10);
  const fixedHeight = verticalScale(IS_TABLET ? 140 : 120);

  const actionButtonWidth = scale(IS_TABLET ? 148 : 120);
  const actionButtonHeight = verticalScale(IS_TABLET ? 48 : 38);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardContainer: {
          flexDirection: 'row',
          alignItems: 'stretch',
          backgroundColor: AppColors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.md),
          padding: padding,
          gap: scale(16),
          height: fixedHeight,
        },
        isActive: {
          backgroundColor: AppColors.cardActive,
          borderColor: AppColors.primary,
        },
        metaText: {
          color: AppColors.textSecondary,
        },
        audioImage: {
          flexShrink: 0,
          height: fixedHeight - padding * 2,
          aspectRatio: 0.85,
          borderRadius: responsiveRadius(AppRadius.sm),
          overflow: 'hidden',
          backgroundColor: AppColors.backgroundInteractive,
          justifyContent: 'center',
          alignItems: 'center',
        },
        coverImageWrapper: {
          flexShrink: 0,
          height: fixedHeight - padding * 2,
          aspectRatio: 0.85,
          borderRadius: responsiveRadius(AppRadius.sm),
          overflow: 'hidden',
          backgroundColor: AppColors.backgroundInteractive,
          justifyContent: 'center',
          alignItems: 'center',
        },
        pdfBadgeText: {
          color: AppColors.primary,
        },
        infoContainer: {
          flex: 1,
          justifyContent: 'space-between',
        },
        textGroup: {
          flex: 1,
          justifyContent: 'center',
        },
        fileInfo: {
          flexDirection: 'row',
          gap: scale(10),
          flexWrap: 'wrap',
          marginTop: verticalScale(2),
        },
        buttonRightContainer: {
          alignItems: 'flex-end',
          marginTop: verticalScale(IS_TABLET ? 6 : 4),
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
      padding,
      fixedHeight,
      scale,
      verticalScale,
      actionButtonWidth,
      actionButtonHeight,
    ],
  );

  const renderThumbnail = () =>
    type === 'audio' ? (
      <View style={styles.audioImage}>
        <AudioIcon />
        {!canStart && (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={4}
          />
        )}
      </View>
    ) : (
      <View style={styles.coverImageWrapper}>
        <AppText style={styles.pdfBadgeText} fontSize={AppFontSize.caption}>
          PDF
        </AppText>

        {!canStart && (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={2}
          />
        )}
      </View>
    );

  return (
    <View style={[styles.cardContainer, isActive && styles.isActive]}>
      {renderThumbnail()}

      <View style={styles.infoContainer}>
        <View style={styles.textGroup}>
          <AppText
            numberOfLines={1}
            ellipsizeMode="tail"
            fontSize={AppFontSize.subtitle}
            fontWeight="medium"
          >
            {title}
          </AppText>

          <View style={styles.fileInfo}>
            {!!size && (
              <AppText fontSize={AppFontSize.caption} style={styles.metaText}>
                {size}
              </AppText>
            )}
            {!!length && (
              <AppText fontSize={AppFontSize.caption} style={styles.metaText}>
                {length}
              </AppText>
            )}
            {!!format && (
              <AppText fontSize={AppFontSize.caption} style={styles.metaText}>
                {format}
              </AppText>
            )}
          </View>
        </View>

        <View style={styles.buttonRightContainer}>
          <View style={styles.actionButtonWrapper}>
            {canStart ? (
              <TouchableOpacity
                activeOpacity={PRESSED_OPACITY}
                onPress={onPressStart}
                style={styles.startButtonTouchable}
              >
                <View style={styles.startLearn}>
                  {type === 'audio' ? (
                    <ListenIcon
                      size={IS_TABLET ? 28 : 24}
                      color={AppColors.primary}
                    />
                  ) : (
                    <DownloadIcon
                      size={IS_TABLET ? 22 : 18}
                      color={AppColors.primary}
                    />
                  )}
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
  );
};

export default CourseDetailDocumentCard;
