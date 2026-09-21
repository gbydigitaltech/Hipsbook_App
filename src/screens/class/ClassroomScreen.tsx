import { RouteProp, useRoute } from '@react-navigation/native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { log } from '../../helpers/logger';

import AppBackground from '../../components/background/AppBackground';
import PdfRender from '../../components/pdf/PdfRender';
import Player from '../../components/videos/Player';
import AppFlatList from '../../components/views/AppFlatList';
import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { useLibraryLesson } from '../../hooks/library/useLibaryLesson';
import { useLibraryInfo } from '../../hooks/library/useLibraryInfo';
import { useLibraryTeacherList } from '../../hooks/library/useLibraryTeacherList';

import {
  androidSafeTop,
  iosSafeTop,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import { AppStackParamList } from '../../types/data/navigation/navigation.types';
import ClassroomHeader, { ClassroomTabKey } from './components/ClassroomHeader';
import CourseAboutSheet from './components/CourseAboutSheet';
import LessonDetailSheet from './components/LessonDetailSheet';
import LessonTab from './components/LessonTab';
import RelatedDocumentsSheet from './components/RelatedDocumentsSheet';
import ClassroomCommentsSheet from './components/ClassroomCommentsSheet';

type ClassRoomRouteProp = RouteProp<AppStackParamList, 'ClassRoom'>;

type AttachmentItem = {
  url: string;
  description?: string;
  label?: string;
};

export type LessonItem = {
  id: string | number;
  label: string;
  price: number;
  media_id?: string;
  is_free?: boolean;
  activate?: boolean | number | string;
  attachments?: AttachmentItem[];
  groupTitle?: string;
  description?: string;
  duration?: number;
};

export type DocumentItem = {
  id: string | number;
  label: string;
  type: 'audio' | 'pdf';
  groupTitle?: string;
  media_id?: string;
  url?: string;
  price?: number;
  activate?: boolean | number | string;
  is_free?: boolean;
  duration?: number;
  str_duration?: string;
  description?: string;
  attachment?: any[];
};

export type DocumentGroup = {
  groupTitle: string;
  items: DocumentItem[];
};

const normalizeFlag = (v: unknown) => v === true || v === 1 || v === '1';

const extractVideoLessons = (groups: any[]): LessonItem[] => {
  const result: LessonItem[] = [];

  for (const group of groups ?? []) {
    const groupTitle =
      group?.title ??
      group?.label ??
      group?.lesson_group?.title ??
      group?.lesson_group?.label ??
      '';

    const videos = group?.lesson_group?.video ?? [];

    for (const v of videos) {
      result.push({
        id: v?.id ?? v?.media_id ?? `${groupTitle || 'group'}-${result.length}`,
        label: v?.label ?? '',
        price: Number(v?.price) || 0,
        media_id: v?.media_id,
        is_free: v?.is_free,
        activate: v?.activate,
        groupTitle: String(groupTitle ?? '').trim(),
        attachments: (v?.attachment ?? []).filter((a: any) => !!a?.url),
        description: v?.description ?? '',
        duration:
          typeof v?.duration === 'number'
            ? v.duration
            : Number(v?.duration) || 0,
      });
    }
  }

  return result;
};

const extractDocuments = (groups: any[]): DocumentGroup[] => {
  const result: DocumentGroup[] = [];
  for (const group of groups ?? []) {
    const groupTitle =
      group?.title ??
      group?.label ??
      group?.lesson_group?.title ??
      group?.lesson_group?.label ??
      '';
    const audios = group?.lesson_group?.audio ?? [];
    const documents = group?.lesson_group?.document ?? [];
    const items: DocumentItem[] = [];

    for (const audio of audios) {
      items.push({
        id: audio?.id ?? `audio-${items.length}`,
        label: audio?.label ?? '',
        type: 'audio',
        media_id: audio?.media_id || audio?.id,
        price: Number(audio?.price) || 0,
        activate: audio?.activate,
        is_free: audio?.is_free,
        str_duration: audio?.str_duration,
        groupTitle,
      });
    }

    for (const doc of documents) {
      const url = doc?.url ?? doc?.attachment?.[0]?.url ?? '';
      items.push({
        id: doc?.id ?? `doc-${items.length}`,
        label: doc?.label ?? '',
        type: 'pdf',
        url: url,
        price: Number(doc?.price) || 0,
        activate: doc?.activate,
        is_free: doc?.is_free,
        str_duration: doc?.str_duration,
        groupTitle,
      });
    }
    if (items.length > 0) {
      result.push({ groupTitle: String(groupTitle).trim(), items });
    }
  }
  return result;
};

const ClassroomScreen = () => {
  const route = useRoute<ClassRoomRouteProp>();
  const params = route.params;

  const { scale, verticalScale } = useResponsive();

  const libraryId = params?.id;
  const routeLessonId = params?.lessonId;
  const routeMediaId = params?.mediaId;
  const autoStart = params?.autoStart;
  const autoPickFirstActivated = params?.autoPickFirstActivated;
  const openPdfUrl = params?.openPdfUrl;

  const [activeTab, setActiveTab] = useState<ClassroomTabKey>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);

  const [playingMediaId, setPlayingMediaId] = useState<string | undefined>(
    routeMediaId ? String(routeMediaId) : undefined,
  );
  const [playingLessonId, setPlayingLessonId] = useState<string | undefined>(
    routeLessonId ? String(routeLessonId) : undefined,
  );

  const [lessonDetailVisible, setLessonDetailVisible] = useState(false);
  const [courseAboutVisible, setCourseAboutVisible] = useState(false);
  const [documentsVisible, setDocumentsVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [pendingPdfUrl, setPendingPdfUrl] = useState<string | null>(null);

  const autoStartedRef = useRef(false);
  const pdfAutoOpenedRef = useRef(false);

  const { data: detailData } = useLibraryInfo(libraryId);
  const { data, onChangeVideo } = useLibraryLesson(libraryId);

  const { teachers, isLoading: teachersLoading } = useLibraryTeacherList({
    libraryId: String(libraryId),
    enabled: !!libraryId,
  });

  // const { downloadDocument } = usePdfRender({ visible: false, pdfUrl: '' });

  const groups = useMemo(() => data?.data ?? [], [data?.data]);

  const lessons = useMemo<LessonItem[]>(
    () => extractVideoLessons(groups),
    [groups],
  );

  const relatedDocuments = useMemo(() => extractDocuments(groups), [groups]);

  const lessonsForTab = useMemo(() => {
    if (activeTab === 'LEARN')
      return lessons.filter(l => normalizeFlag(l.activate));
    if (activeTab === 'BUY_MORE')
      return lessons.filter(l => !normalizeFlag(l.activate));
    return lessons;
  }, [activeTab, lessons]);

  useEffect(() => {
    if (!routeMediaId) return;
    setPlayingMediaId(String(routeMediaId));
    if (routeLessonId) setPlayingLessonId(String(routeLessonId));
  }, [routeMediaId, routeLessonId]);

  // Auto open PDF
  useEffect(() => {
    if (!openPdfUrl) return;
    if (pdfAutoOpenedRef.current) return;

    pdfAutoOpenedRef.current = true;
    setPdfUrl(openPdfUrl);
    setPdfVisible(true);
  }, [openPdfUrl]);

  // Auto start specific lesson
  useEffect(() => {
    if (!autoStart) return;
    if (autoStartedRef.current) return;
    if (!lessons?.length) return;

    const target =
      lessons.find(l => String(l.id) === String(routeLessonId)) ||
      lessons.find(l => String(l.media_id) === String(routeMediaId));

    if (!target) return;

    autoStartedRef.current = true;

    setSelectedLesson(target);
    setPlayingMediaId(target.media_id ? String(target.media_id) : undefined);
    setPlayingLessonId(target.id != null ? String(target.id) : undefined);

    onChangeVideo?.({
      media_id: target.media_id,
      id: target.id != null ? String(target.id) : undefined,
      label: target.label,
    });
  }, [autoStart, lessons, routeLessonId, routeMediaId, onChangeVideo]);

  useEffect(() => {
    if (!openPdfUrl) return;

    setPdfUrl(openPdfUrl);
    setPdfVisible(true);
  }, [openPdfUrl]);

  // Auto pick first activated
  useEffect(() => {
    if (autoStart) return;
    if (!autoPickFirstActivated) return;
    if (selectedLesson) return;
    if (!lessons?.length) return;

    const firstActivated = lessons.find(l => normalizeFlag(l.activate));
    if (!firstActivated) return;

    setSelectedLesson(firstActivated);
    setPlayingMediaId(
      firstActivated.media_id ? String(firstActivated.media_id) : undefined,
    );
    setPlayingLessonId(
      firstActivated.id != null ? String(firstActivated.id) : undefined,
    );

    onChangeVideo?.({
      media_id: firstActivated.media_id,
      id: firstActivated.id != null ? String(firstActivated.id) : undefined,
      label: firstActivated.label,
    });
  }, [
    autoStart,
    autoPickFirstActivated,
    lessons,
    selectedLesson,
    onChangeVideo,
  ]);

  const coverUrl = useMemo(() => {
    const d: any = detailData;
    return (
      d?.cover_image_list?.IMAGE_16_9 ||
      d?.cover_image_list?.IMAGE_4_3 ||
      d?.cover_image ||
      ''
    );
  }, [detailData]);

  const onPressStart = useCallback(
    (lesson: LessonItem) => {
      if (!normalizeFlag(lesson.activate)) return;

      setSelectedLesson(lesson);
      setPlayingMediaId(lesson.media_id ? String(lesson.media_id) : undefined);
      setPlayingLessonId(lesson.id != null ? String(lesson.id) : undefined);

      onChangeVideo?.({
        media_id: lesson.media_id,
        id: lesson.id != null ? String(lesson.id) : undefined,
        label: lesson.label,
      });
    },
    [onChangeVideo],
  );

  const onPlayAudio = useCallback(
    (doc: DocumentItem) => {
      log('Class', 'Playing Audio Media ID:', doc.media_id);
      if (!normalizeFlag(doc.activate) || !doc.media_id) {
        log('Class', 'Cannot play: Not activated or No Media ID');
        return;
      }
      setPlayingMediaId(String(doc.media_id));
      setPlayingLessonId(doc.id != null ? String(doc.id) : undefined);

      onChangeVideo?.({
        media_id: doc.media_id,
        id: doc.id != null ? String(doc.id) : undefined,
        label: doc.label,
      });

      setDocumentsVisible(false);
    },
    [onChangeVideo],
  );

  const onPressBuy = useCallback((lesson: LessonItem) => {
    log('Class', 'buy lesson', lesson?.id);
  }, []);

  const onOpenPdf = useCallback((url: string) => {
    setPendingPdfUrl(url);
    setDocumentsVisible(false);
  }, []);

  const handleSheetClosed = useCallback(() => {
    if (pendingPdfUrl) {
      setPdfUrl(pendingPdfUrl);
      setPdfVisible(true);
      setPendingPdfUrl(null);
    }
  }, [pendingPdfUrl]);

  const onClosePdf = useCallback(() => {
    setPdfVisible(false);
    setPdfUrl('');
  }, []);

  const currentLesson = useMemo(() => {
    if (selectedLesson) return selectedLesson;
    if (!playingMediaId) return null;
    return (
      lessons.find(l => String(l.media_id) === String(playingMediaId)) ?? null
    );
  }, [selectedLesson, playingMediaId, lessons]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: { flex: 1, backgroundColor: '#000000' },
        fullscreenRoot: { flex: 1, backgroundColor: 'black' },
        contentTab: {
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },
      }),
    [scale],
  );

  if (isFullscreen) {
    return (
      <View style={styles.fullscreenRoot}>
        <Player
          key={String(playingMediaId ?? 'no-media')}
          mediaId={playingMediaId}
          lessonId={playingLessonId}
          onFullscreenChange={setIsFullscreen}
          initialFullscreen
        />
      </View>
    );
  }

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppFlatList
        withHorizontalPadding={false}
        staticHeader={
          <ClassroomHeader
            topInset={
              IS_IOS ? verticalScale(iosSafeTop) : verticalScale(androidSafeTop)
            }
            backSize={IS_TABLET ? 48 : 40}
            title={detailData?.label ?? ''}
            onPressLessonDetail={() => setLessonDetailVisible(true)}
            onPressCourseAbout={() => setCourseAboutVisible(true)}
            onPressDocuments={() => setDocumentsVisible(true)}
            onPressComments={() => setCommentsVisible(true)}
            playingMediaId={playingMediaId}
            playingLessonId={playingLessonId}
            coverUrl={coverUrl}
            onFullscreenChange={setIsFullscreen}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
          />
        }
        data={[activeTab]}
        keyExtractor={t => String(t)}
        renderItem={() => (
          <LessonTab
            contentStyle={styles.contentTab}
            lessons={lessonsForTab}
            isPlayingId={
              selectedLesson?.id ?? selectedLesson?.media_id ?? playingMediaId
            }
            onPressStart={onPressStart}
            onPressBuy={onPressBuy}
            onOpenPdf={onOpenPdf}
            onDownloadPdf={onOpenPdf}
            // onDownloadPdf={downloadDocument}
          />
        )}
      />

      <PdfRender visible={pdfVisible} onClose={onClosePdf} pdfUrl={pdfUrl} />

      <LessonDetailSheet
        visible={lessonDetailVisible}
        onClose={() => setLessonDetailVisible(false)}
        courseTitle={detailData?.label ?? ''}
        lesson={currentLesson}
        onOpenPdf={onOpenPdf}
      />

      <CourseAboutSheet
        visible={courseAboutVisible}
        onClose={() => setCourseAboutVisible(false)}
        course={detailData}
        teachers={teachers}
        teachersLoading={teachersLoading}
      />
      <ClassroomCommentsSheet
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        courseId={detailData?.id}
      />

      <RelatedDocumentsSheet
        visible={documentsVisible}
        onClose={() => setDocumentsVisible(false)}
        documents={relatedDocuments}
        onPlayAudio={onPlayAudio}
        onOpenPdf={onOpenPdf}
        onDownloadPdf={onOpenPdf}
        // onDownloadPdf={downloadDocument}
        onClosedComplete={handleSheetClosed}
      />
    </View>
  );
};

export default ClassroomScreen;
