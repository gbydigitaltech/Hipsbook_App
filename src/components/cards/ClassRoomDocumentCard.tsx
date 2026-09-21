import React, { useMemo } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import AudioIcon from '../../assets/icons/course/AudioIcon';
import ListenIcon from '../../assets/icons/course/ListenIcon';
import DownloadIcon from '../../assets/icons/DownloadIcon';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';
import AppButton from '../buttons/AppButton';
import AppText from '../texts/AppText';

const formatNumberTH = (n: number) => {
  try {
    return new Intl.NumberFormat('th-TH').format(n);
  } catch {
    return (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

const normalizeFlag = (v: unknown) => v === true || v === 1 || v === '1';

export type DocumentType = 'pdf' | 'audio' | 'word' | 'excel' | 'text';

export const normalizeDocumentType = (value: unknown): DocumentType => {
  const type = String(value ?? '')
    .trim()
    .toLowerCase();

  if (type === 'audio') return 'audio';
  if (type === 'pdf') return 'pdf';
  if (['word', 'doc', 'docx'].includes(type)) return 'word';
  if (['excel', 'xls', 'xlsx', 'csv'].includes(type)) return 'excel';
  if (['text', 'txt', 'md'].includes(type)) return 'text';

  return 'pdf';
};

export const getDocumentFormatLabel = (type: DocumentType): string => {
  switch (type) {
    case 'audio':
      return 'Audio';
    case 'word':
      return 'DOC';
    case 'excel':
      return 'XLS';
    case 'text':
      return 'TXT';
    case 'pdf':
    default:
      return 'PDF';
  }
};

const getDocumentBadgeLabel = (type: DocumentType) => {
  switch (type) {
    case 'pdf':
      return 'PDF';
    case 'word':
      return 'DOC';
    case 'excel':
      return 'XLS';
    case 'text':
      return 'TXT';
    default:
      return '';
  }
};

type Props = {
  type: DocumentType;
  title: string;
  size?: string;
  length?: string;
  format?: string;
  price: number;
  is_free?: boolean;
  activate?: boolean | number | string;
  onPressBuy?: () => void;
  onPressStart?: () => void;
  onPressDownload?: () => void;
  isActive?: boolean;
  previewUrl?: string;
};

const ClassRoomDocumentCard: React.FC<Props> = ({
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
  onPressDownload,
  isActive,
}) => {
  const { scale, responsiveRadius, verticalScale, responsiveSpacing } =
    useResponsive();

  const isFreeDoc = Number(price) === 0 || !!is_free;
  const isActivated = normalizeFlag(activate);
  const canStart = isFreeDoc || isActivated;

  const paidPriceLabel = `ซื้อ ฿${formatNumberTH(Number(price) || 0)}`;
  const badgeLabel = getDocumentBadgeLabel(type);
  const isAudio = type === 'audio';

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
          padding,
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
        thumbBox: {
          flexShrink: 0,
          height: fixedHeight - padding * 2,
          aspectRatio: 0.85,
          borderRadius: responsiveRadius(AppRadius.sm),
          overflow: 'hidden',
          backgroundColor: AppColors.backgroundInteractive,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: scale(8),
        },
        fileBadgeText: {
          color: AppColors.primary,
          textAlign: 'center',
        },
        infoContainer: {
          flex: 1,
          justifyContent: 'space-around',
        },
        fileInfo: {
          flexDirection: 'row',
          gap: scale(10),
          flexWrap: 'wrap',
        },
        actionRow: {
          flexDirection: 'row',
          gap: scale(10),
          alignSelf: 'flex-end',
        },
        buyButtonContainer: {
          width: actionButtonWidth,
          height: actionButtonHeight,
        },
        buyButtonContent: {
          height: '100%',
          paddingVertical: 0,
          paddingHorizontal: scale(14),
        },
        startLearnButton: {
          width: actionButtonWidth,
          height: actionButtonHeight,
          backgroundColor: AppColors.backgroundInteractive,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: responsiveRadius(AppRadius.pill),
        },
        iconWrapper: {
          width: scale(20),
          height: verticalScale(20),
          justifyContent: 'center',
          alignItems: 'center',
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

  const handleTouchLesson = () => {
    if (canStart && onPressStart) onPressStart();
  };

  const handleIconButtonPress = (e: GestureResponderEvent) => {
    e.stopPropagation();

    if (isAudio) {
      onPressStart?.();
    } else if (onPressDownload) {
      onPressDownload?.();
    } else {
      onPressStart?.();
    }
  };

  return (
    <TouchableOpacity
      onPress={canStart ? handleTouchLesson : undefined}
      activeOpacity={canStart ? 0.8 : 1}
    >
      <View style={[styles.cardContainer, isActive && styles.isActive]}>
        <View style={styles.thumbBox}>
          {isAudio ? (
            <AudioIcon />
          ) : (
            <AppText
              style={styles.fileBadgeText}
              fontSize={AppFontSize.subtitle}
              fontWeight="semiBold"
              numberOfLines={1}
            >
              {badgeLabel}
            </AppText>
          )}

          {!canStart && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                },
              ]}
            />
          )}
        </View>

        <View style={styles.infoContainer}>
          <AppText
            numberOfLines={1}
            ellipsizeMode="tail"
            fontSize={AppFontSize.subtitle}
            fontWeight="medium"
          >
            {title}
          </AppText>

          <View style={styles.fileInfo}>
            {size ? (
              <AppText fontSize={AppFontSize.caption} style={styles.metaText}>
                {size}
              </AppText>
            ) : null}

            {length && isAudio ? (
              <AppText fontSize={AppFontSize.caption} style={styles.metaText}>
                {length}
              </AppText>
            ) : null}

            {format ? (
              <AppText fontSize={AppFontSize.caption} style={styles.metaText}>
                {format}
              </AppText>
            ) : null}
          </View>

          {!canStart ? (
            <View style={styles.actionRow}>
              <View style={styles.buyButtonContainer}>
                <AppButton
                  title={paidPriceLabel}
                  onPress={onPressBuy ?? (() => {})}
                  fontSize={AppFontSize.caption}
                  fullWidth
                  containerStyle={{
                    width: '100%',
                    height: actionButtonHeight,
                    borderRadius: responsiveRadius(AppRadius.pill),
                  }}
                  contentStyle={styles.buyButtonContent}
                />
              </View>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleIconButtonPress}
                activeOpacity={PRESSED_OPACITY}
                style={styles.startLearnButton}
              >
                <View style={styles.iconWrapper}>
                  {isAudio ? (
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
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ClassRoomDocumentCard;
