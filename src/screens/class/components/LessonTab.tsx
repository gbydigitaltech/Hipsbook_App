import React, { memo, useCallback, useMemo, useState } from 'react';
import { log } from '../../../helpers/logger';
import { FlatList, StyleSheet, View } from 'react-native';

import ClassRoomDocumentCard from '../../../components/cards/ClassRoomDocumentCard';
import ClassRoomLibraryLessonCard from '../../../components/cards/ClassRoomLessonCard';
import AppSectionHeader from '../../../components/sections/AppSectionHeader';
import AppEmptyState from '../../../components/states/AppEmptyState';

import { IS_TABLET } from '../../../constants/platform';
import { useResponsive } from '../../../helpers/responsive';

type DocumentType = 'pdf' | 'audio' | 'word' | 'excel' | 'text';

type AttachmentItem = {
  url: string;
  description?: string;
  label?: string;
  file_type?: string | null;
  directory?: string | null;
};

type LessonItem = {
  id: string | number;
  label: string;
  description?: string;
  price: number;
  media_id?: string;
  is_free?: boolean;
  activate?: boolean | number | string;
  attachments?: AttachmentItem[];
  groupTitle?: string;
};

type LessonTabProps = {
  lessons: LessonItem[];
  isPlayingId?: string | number;
  onPressStart: (lesson: LessonItem) => void;
  onPressBuy?: (lesson: LessonItem) => void;
  contentStyle?: any;
  onOpenPdf?: (url: string) => void;
  onDownloadPdf?: (url: string) => void;
};

const normalizeFlag = (v: unknown) => v === true || v === 1 || v === '1';

const canAccessLesson = (lesson: LessonItem) => {
  const isFree = Number(lesson.price) === 0 || !!lesson.is_free;
  const isActivated = normalizeFlag(lesson.activate);
  return isFree || isActivated;
};

const getFileExtension = (value?: string | null) => {
  if (!value) return '';
  const cleanValue = value.split('?')[0].split('#')[0];
  const parts = cleanValue.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? '' : '';
};

const getAttachmentType = (att: AttachmentItem): DocumentType => {
  const normalizedType = String(att.file_type ?? '')
    .trim()
    .toLowerCase();

  if (normalizedType === 'pdf') return 'pdf';
  if (['word', 'doc', 'docx'].includes(normalizedType)) return 'word';
  if (['excel', 'xls', 'xlsx', 'csv'].includes(normalizedType)) return 'excel';
  if (['text', 'txt', 'md'].includes(normalizedType)) return 'text';
  if (['audio', 'mp3', 'wav', 'm4a', 'aac'].includes(normalizedType)) {
    return 'audio';
  }

  const extension =
    getFileExtension(att.label) || getFileExtension(att.url) || '';

  if (extension === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'excel';
  if (['txt', 'md'].includes(extension)) return 'text';
  if (['mp3', 'wav', 'm4a', 'aac'].includes(extension)) return 'audio';

  return 'pdf';
};

const getAttachmentFormat = (att: AttachmentItem, type: DocumentType) => {
  const extension =
    getFileExtension(att.label) || getFileExtension(att.url) || '';

  if (extension) return extension.toUpperCase();

  switch (type) {
    case 'word':
      return 'DOC';
    case 'excel':
      return 'XLS';
    case 'text':
      return 'TXT';
    case 'audio':
      return 'AUDIO';
    case 'pdf':
    default:
      return 'PDF';
  }
};

type Row = {
  item: LessonItem;
  showHeader: boolean;
  currentTitle: string;
};

const LessonTab: React.FC<LessonTabProps> = ({
  lessons,
  isPlayingId,
  onPressStart,
  onPressBuy,
  contentStyle,
  onOpenPdf,
  onDownloadPdf,
}) => {
  const { verticalScale } = useResponsive();
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        listContent: {
          paddingBottom: verticalScale(IS_TABLET ? 18 : 14),
        },
        itemWrap: {
          marginBottom: verticalScale(IS_TABLET ? 18 : 14),
        },
        documentsLesson: {
          marginTop: verticalScale(IS_TABLET ? 14 : 12),
          gap: verticalScale(IS_TABLET ? 14 : 12),
        },
        sectionHeader: {
          marginBottom: verticalScale(IS_TABLET ? 12 : 10),
        },
        emptyState: {
          paddingVertical: verticalScale(48),
        },
      }),
    [verticalScale],
  );

  const openAttachment = useCallback(
    (url: string) => {
      if (onOpenPdf) onOpenPdf(url);
      else log('Class', 'open attachment:', url);
    },
    [onOpenPdf],
  );

  const toggleAttachments = useCallback((lessonId: string) => {
    setExpandedLessonId(prev => (prev === lessonId ? null : lessonId));
  }, []);

  const data: Row[] = useMemo(() => {
    return lessons.map((item, index) => {
      const currentTitle = item.groupTitle?.trim() ?? '';
      const prevTitle = lessons[index - 1]?.groupTitle?.trim() ?? '';
      const showHeader = !!currentTitle && currentTitle !== prevTitle;
      return { item, showHeader, currentTitle };
    });
  }, [lessons]);

  const keyExtractor = useCallback((row: Row) => String(row.item.id), []);

  const renderItem = useCallback(
    ({ item: row }: { item: Row }) => {
      const item = row.item;
      const lessonId = String(item.id);
      const canAccess = canAccessLesson(item);

      const attachments = item.attachments ?? [];
      const hasAttachments = attachments.length > 0;

      const isPlaying = String(isPlayingId) === lessonId;
      const isExpanded = expandedLessonId === lessonId;
      const priceNum = Number(item.price) || 0;

      return (
        <View style={styles.itemWrap}>
          {row.showHeader && (
            <AppSectionHeader
              title={row.currentTitle}
              containerStyle={styles.sectionHeader}
            />
          )}

          <ClassRoomLibraryLessonCard
            title={item.label}
            description={item.description}
            price={priceNum}
            mediaId={item.media_id}
            is_free={item.is_free}
            activate={item.activate}
            isPlaying={isPlaying}
            onPressStart={() => onPressStart(item)}
            onPressBuy={onPressBuy ? () => onPressBuy(item) : undefined}
            hasAttachments={hasAttachments}
            onPressAttachments={() => toggleAttachments(lessonId)}
            isAttachmentsExpanded={isExpanded}
          />

          {canAccess && hasAttachments && isExpanded && (
            <View style={styles.documentsLesson}>
              {attachments.map((att, idx) => {
                const attachmentType = getAttachmentType(att);
                const attachmentFormat = getAttachmentFormat(
                  att,
                  attachmentType,
                );
                const title = att.description || att.label || item.label;

                return (
                  <ClassRoomDocumentCard
                    key={`${lessonId}-${att.url}-${idx}`}
                    type={attachmentType}
                    title={title}
                    size=""
                    length=""
                    format={attachmentFormat}
                    price={priceNum}
                    is_free={item.is_free}
                    activate={item.activate}
                    onPressStart={() => openAttachment(att.url)}
                    onPressDownload={() => onDownloadPdf?.(att.url)}
                    onPressBuy={onPressBuy ? () => onPressBuy(item) : undefined}
                  />
                );
              })}
            </View>
          )}
        </View>
      );
    },
    [
      expandedLessonId,
      isPlayingId,
      onDownloadPdf,
      onPressBuy,
      onPressStart,
      openAttachment,
      styles,
      toggleAttachments,
    ],
  );

  return (
    <View style={contentStyle}>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        ListEmptyComponent={
          <AppEmptyState
            containerStyle={styles.emptyState}
            icon="videocam-outline"
            title="ยังไม่มีบทเรียนในหมวดนี้"
            description="ลองเลือกหมวดอื่นด้านบน เพื่อดูบทเรียนที่เปิดให้เรียนได้"
          />
        }
      />
    </View>
  );
};

export default memo(LessonTab);
