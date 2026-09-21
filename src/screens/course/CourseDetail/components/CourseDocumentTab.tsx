import React, { useMemo } from 'react';
import { log } from '../../../../helpers/logger';
import { StyleSheet, View } from 'react-native';

import DocumentIcon from '../../../../assets/icons/DocumentIcon';
import CourseDetailDocumentCard from '../../../../components/cards/CourseDetailDocumentCard';
import AppText from '../../../../components/texts/AppText';

import { useResponsive } from '../../../../helpers/responsive';
import { AppColors } from '../../../../styles/colors';

import {
  CourseAudioItem,
  CourseDocumentItem,
  CourseDocumentUnion,
} from '../types/document.types';

import { IS_TABLET } from '../../../../constants/platform';
import { DocumentGroup } from '../types/group.types';

interface Props {
  groups: DocumentGroup[];
  currentMediaId?: string;
  onPressStartDocument?: (item: CourseDocumentUnion) => void;
}

const normalizeId = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const isAudio = (item: CourseDocumentUnion): item is CourseAudioItem => {
  return item.lesson_type === 'เสียง';
};

const isDocument = (item: CourseDocumentUnion): item is CourseDocumentItem => {
  return item.lesson_type === 'เอกสาร';
};

const CourseDocumentTab: React.FC<Props> = ({
  groups,
  currentMediaId,
  onPressStartDocument,
}) => {
  const { scale, verticalScale } = useResponsive();

  const normalizedCurrentMediaId = normalizeId(currentMediaId);

  const titleFontSize = IS_TABLET ? 22 : 18;
  const groupTitleFontSize = IS_TABLET ? 20 : 16;
  const emptyFontSize = IS_TABLET ? 20 : 16;
  const emptyIconSize = IS_TABLET ? 90 : 75;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingBottom: verticalScale(0),
        },
        title: {
          color: AppColors.primary,
          marginBottom: verticalScale(20),
        },

        group: {
          marginBottom: verticalScale(24),
        },

        groupTitle: {
          marginBottom: verticalScale(12),
        },

        cardList: {
          gap: verticalScale(16),
        },

        emptyContainer: {
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: verticalScale(40),
          paddingHorizontal: scale(16),
          gap: verticalScale(12),
        },

        emptyText: {
          textAlign: 'center',
          color: AppColors.white,
          opacity: 0.9,
        },
      }),
    [scale, verticalScale],
  );

  if (!groups.length) {
    return (
      <View style={styles.emptyContainer}>
        <DocumentIcon size={emptyIconSize} />

        <AppText fontSize={emptyFontSize} style={styles.emptyText}>
          ยังไม่มีเอกสาร
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppText
        style={styles.title}
        fontWeight="medium"
        fontSize={titleFontSize}
      >
        เอกสารที่เกี่ยวข้อง
      </AppText>

      {groups.map((group, index) => (
        <View key={index} style={styles.group}>
          <AppText
            style={styles.groupTitle}
            fontWeight="medium"
            fontSize={groupTitleFontSize}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {group.title}
          </AppText>

          <View style={styles.cardList}>
            {group.items.map(item => {
              if (isDocument(item)) {
                return (
                  <CourseDetailDocumentCard
                    key={item.id}
                    type="pdf"
                    title={item.label}
                    size=""
                    length=""
                    format="PDF"
                    price={item.price ?? 0}
                    is_free={item.is_free}
                    activate={item.activate}
                    pdfUrl={item.attachment?.[0]?.url}
                    onPressBuy={() => log('Course', 'Buy', item.id)}
                    onPressStart={() => onPressStartDocument?.(item)}
                  />
                );
              }

              if (isAudio(item)) {
                const normalizedItemMediaId = normalizeId(item.media_id);
                const isCurrentAudioActive =
                  !!normalizedItemMediaId &&
                  !!normalizedCurrentMediaId &&
                  normalizedItemMediaId === normalizedCurrentMediaId;

                return (
                  <CourseDetailDocumentCard
                    key={item.id}
                    type="audio"
                    title={item.label}
                    size=""
                    length={item.str_duration ?? ''}
                    format="Audio"
                    price={item.price ?? 0}
                    is_free={item.is_free}
                    activate={item.activate}
                    isActive={isCurrentAudioActive}
                    onPressBuy={() => log('Course', 'Buy', item.id)}
                    onPressStart={() => onPressStartDocument?.(item)}
                  />
                );
              }

              return null;
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

export default CourseDocumentTab;
