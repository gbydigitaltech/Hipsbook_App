import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  PRESSED_OPACITY,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import AppText from '../texts/AppText';
import LiveViewer from './LiveViewer';
import StreamPublisher from './StreamPublisher';
import liveStreamService, { LiveStreamSession } from './liveStreamService';
import { logError } from '../../helpers/logger';

const LIVE_LIST_REFRESH_MS = 15000;

const StreamSection = () => {
  const { scale, verticalScale } = useResponsive();

  const [showViewer, setShowViewer] = useState(false);
  const [showPublisher, setShowPublisher] = useState(false);
  const [selectedStream, setSelectedStream] =
    useState<LiveStreamSession | null>(null);
  const [liveStreams, setLiveStreams] = useState<LiveStreamSession[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);

  const loadStreams = useCallback(async (silent: boolean) => {
    if (!silent) setLoadingStreams(true);
    try {
      // ให้ API กรองเฉพาะที่ Live (เหมือนหน้าเว็บ /live) แทนการดึง 10 รายการล่าสุดแล้วกรองเอง
      // ไม่งั้นไลฟ์ที่สร้างไว้นานกว่า 10 session ล่าสุดจะหลุดไปหน้าอื่นและไม่แสดง
      const list = await liveStreamService.list({
        status: 'Live',
        pageSize: 50,
      });
      setLiveStreams(list.filter(s => s.status === 'Live'));
    } catch (e) {
      // API ล่มชั่วคราว: คงรายการเดิมไว้ ไม่ล้างจนดูเหมือนไม่มีไลฟ์
      logError('Stream', '[StreamSection] fetch live list', e);
    } finally {
      if (!silent) setLoadingStreams(false);
    }
  }, []);

  // ใช้กับ onPress/onRefresh (ห้ามส่ง event เข้า loadStreams ตรง ๆ)
  const fetchStreams = useCallback(() => loadStreams(false), [loadStreams]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  // รีเฟรชรายการอัตโนมัติ (เงียบ ๆ) ระหว่างอยู่หน้านี้ และไม่ได้เปิดดู/ไลฟ์อยู่
  useEffect(() => {
    if (showViewer || showPublisher) return;
    const t = setInterval(() => loadStreams(true), LIVE_LIST_REFRESH_MS);
    return () => clearInterval(t);
  }, [loadStreams, showViewer, showPublisher]);

  const handleWatchStream = useCallback((stream: LiveStreamSession) => {
    setSelectedStream(stream);
    setShowViewer(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setShowViewer(false);
    setSelectedStream(null);
    fetchStreams();
  }, [fetchStreams]);

  const handleOpenPublisher = useCallback(() => {
    setShowPublisher(true);
  }, []);

  const handleClosePublisher = useCallback(() => {
    setShowPublisher(false);
    fetchStreams();
  }, [fetchStreams]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: scale(sharedPaddingHorizontal),
          gap: verticalScale(12),
        },
        sectionTitle: {
          marginBottom: verticalScale(2),
        },
        row: {
          flexDirection: 'row',
          gap: scale(12),
        },
        card: {
          flex: 1,
          borderRadius: scale(14),
          overflow: 'hidden',
        },
        cardGradient: {
          paddingVertical: verticalScale(18),
          paddingHorizontal: scale(16),
          alignItems: 'center',
          gap: verticalScale(8),
        },
        iconCircle: {
          width: scale(IS_TABLET ? 56 : 44),
          height: scale(IS_TABLET ? 56 : 44),
          borderRadius: scale(IS_TABLET ? 28 : 22),
          backgroundColor: AppColors.surfaceStrong,
          justifyContent: 'center',
          alignItems: 'center',
        },
        liveListTitle: {
          marginTop: verticalScale(4),
        },
        liveItem: {
          backgroundColor: AppColors.cardBackground,
          borderRadius: scale(10),
          paddingVertical: verticalScale(12),
          paddingHorizontal: scale(14),
          marginBottom: verticalScale(8),
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(12),
        },
        liveItemInfo: {
          flex: 1,
        },
        liveItemTitle: {
          marginBottom: verticalScale(2),
        },
        liveDot: {
          width: scale(6),
          height: scale(6),
          borderRadius: scale(3),
          backgroundColor: AppColors.danger,
        },
        liveItemRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
        },
        playBtn: {
          backgroundColor: AppColors.primary,
          width: scale(IS_TABLET ? 44 : 36),
          height: scale(IS_TABLET ? 44 : 36),
          borderRadius: scale(IS_TABLET ? 22 : 18),
          justifyContent: 'center',
          alignItems: 'center',
        },
        emptyText: {
          textAlign: 'center',
          color: AppColors.grayLight,
          paddingVertical: verticalScale(8),
        },
        loadingRow: {
          paddingVertical: verticalScale(8),
          alignItems: 'center',
        },
      }),
    [scale, verticalScale],
  );

  const renderLiveItem = useCallback(
    ({ item }: { item: LiveStreamSession }) => (
      <TouchableOpacity
        style={styles.liveItem}
        onPress={() => handleWatchStream(item)}
        activeOpacity={PRESSED_OPACITY}
      >
        <View style={styles.liveItemInfo}>
          <AppText
            fontWeight="medium"
            fontSize={AppFontSize.body}
            numberOfLines={1}
            style={styles.liveItemTitle}
          >
            {item.title}
          </AppText>
          <View style={styles.liveItemRow}>
            <View style={styles.liveDot} />
            <AppText
              fontSize={AppFontSize.overline}
              style={{ color: AppColors.danger }}
            >
              LIVE
            </AppText>
            {(item.currentViewers ?? 0) > 0 && (
              <>
                <Ionicons
                  name="eye"
                  size={IS_TABLET ? 12 : 10}
                  color={AppColors.grayLight}
                />
                <AppText
                  fontSize={AppFontSize.overline}
                  style={{ color: AppColors.grayLight }}
                >
                  {item.currentViewers}
                </AppText>
              </>
            )}
          </View>
        </View>
        <View style={styles.playBtn}>
          <Ionicons name="play" size={IS_TABLET ? 22 : 16} color="white" />
        </View>
      </TouchableOpacity>
    ),
    [styles, handleWatchStream],
  );

  return (
    <View style={styles.container}>
      <AppText
        fontWeight="medium"
        fontSize={AppFontSize.subtitle}
        style={styles.sectionTitle}
      >
        Live Stream
      </AppText>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.card}
          onPress={fetchStreams}
          activeOpacity={PRESSED_OPACITY}
        >
          <LinearGradient
            colors={['#1a6b6b', '#0a3d3d']}
            style={styles.cardGradient}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="play-circle"
                size={IS_TABLET ? 28 : 22}
                color="white"
              />
            </View>
            <AppText fontWeight="medium" fontSize={AppFontSize.body}>
              ดู Live
            </AppText>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={handleOpenPublisher}
          activeOpacity={PRESSED_OPACITY}
        >
          <LinearGradient
            colors={['#6b1a1a', '#3d0a0a']}
            style={styles.cardGradient}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="videocam"
                size={IS_TABLET ? 28 : 22}
                color="white"
              />
            </View>
            <AppText fontWeight="medium" fontSize={AppFontSize.body}>
              Stream Live
            </AppText>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {loadingStreams ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={AppColors.primary} />
        </View>
      ) : liveStreams.length > 0 ? (
        <>
          <AppText
            fontWeight="medium"
            fontSize={AppFontSize.body}
            style={styles.liveListTitle}
          >
            กำลัง Live อยู่ตอนนี้
          </AppText>
          <FlatList
            data={liveStreams}
            renderItem={renderLiveItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={loadingStreams}
                onRefresh={fetchStreams}
              />
            }
          />
        </>
      ) : null}

      <LiveViewer
        visible={showViewer}
        onClose={handleCloseViewer}
        streamId={selectedStream?.id}
        streamKey={selectedStream?.streamKey}
        title={selectedStream?.title}
      />

      <StreamPublisher visible={showPublisher} onClose={handleClosePublisher} />
    </View>
  );
};

export default StreamSection;
