import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Modal,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ApiVideoLiveStreamMethods,
  ApiVideoLiveStreamView,
} from '@api.video/react-native-livestream';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_TABLET } from '../../constants/platform';
import { logError } from '../../helpers/logger';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize } from '../../styles/sharedstyles';
import AppButton from '../buttons/AppButton';
import AppTextInput from '../inputs/AppTextInput';
import AppText from '../texts/AppText';
import liveStreamService, { LiveStreamSession } from './liveStreamService';
import { STREAM_CONFIG } from './streamConfig';
import LiveChat from './LiveChat';
import KeepAwake from '@sayem314/react-native-keep-awake';

type StreamPublisherProps = {
  visible: boolean;
  onClose: () => void;
};

type StreamStatus =
  | 'idle'
  | 'creating'
  | 'connecting'
  | 'live'
  | 'stopping'
  | 'error';

const SYNC_INTERVAL_MS = 4000;
const SYNC_MAX_BACKOFF_MS = 30000;

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** เรียกซ้ำสูงสุด `attempts` ครั้ง (หน่วง 1s, 2s, ...) ถ้ายัง fail คืน null แทน throw */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  attempts = 3,
): Promise<T | null> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      logError('Stream', `${label} (attempt ${i}/${attempts})`, e);
      if (i < attempts) await sleep(1000 * i);
    }
  }
  return null;
}

async function requestPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      return (
        granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted' &&
        granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted'
      );
    }
    const cam = await request(PERMISSIONS.IOS.CAMERA);
    const mic = await request(PERMISSIONS.IOS.MICROPHONE);
    return cam === RESULTS.GRANTED && mic === RESULTS.GRANTED;
  } catch {
    return false;
  }
}

const StreamPublisher = ({ visible, onClose }: StreamPublisherProps) => {
  const insets = useSafeAreaInsets();
  const { scale, verticalScale } = useResponsive();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility] = useState<'Public' | 'Private'>('Public');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [controlsHeight, setControlsHeight] = useState(0);

  const sessionRef = useRef<LiveStreamSession | null>(null);
  const liveRef = useRef<ApiVideoLiveStreamMethods>(null);
  const startedRef = useRef(false);
  const connectedRef = useRef(false); // RTMP ต่ออยู่จริงหรือไม่
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, [isStreaming]);

  /** Sync with backend: reflect Live status + poll viewer count. */
  useEffect(() => {
    if (!isStreaming) return;
    const id = sessionRef.current?.id;
    if (!id) return;

    // ใช้ setTimeout ต่อกันแทน setInterval: รอบถัดไปเริ่มหลังรอบนี้จบเท่านั้น
    // (request ไม่ซ้อนกันตอนเซิร์ฟเวอร์ช้า) + backoff เมื่อ fail ติดกัน
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let failStreak = 0;

    const sync = async () => {
      let ok = true;
      try {
        const s = await liveStreamService.getById(id);
        if (!cancelled && s.status === 'Live') {
          setStreamStatus(prev => (prev === 'live' ? prev : 'live'));
        }
      } catch {
        ok = false;
      }
      if (cancelled) return;
      try {
        const h = await liveStreamService.getHealth(id);
        if (!cancelled) setViewerCount(h.currentViewers ?? 0);
      } catch {
        ok = false;
      }
      if (cancelled) return;
      failStreak = ok ? 0 : failStreak + 1;
      // 4s ปกติ -> 8s -> 16s -> สูงสุด 30s ระหว่างที่ API มีปัญหา
      const delay = Math.min(SYNC_INTERVAL_MS * 2 ** failStreak, SYNC_MAX_BACKOFF_MS);
      timer = setTimeout(sync, delay);
    };

    sync();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isStreaming]);

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
  };

  const cleanup = useCallback(() => {
    startedRef.current = false;
    setIsStreaming(false);
    setStreamStatus('idle');
    setDuration(0);
    setViewerCount(0);
    setSessionId(null);
    connectedRef.current = false;
    setIsMuted(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isStreaming) {
      Alert.alert('กำลัง Stream อยู่', 'หยุด Stream ก่อนปิดหน้าจอ');
      return;
    }
    cleanup();
    sessionRef.current = null;
    setTitle('');
    setDescription('');
    onClose();
  }, [cleanup, onClose, isStreaming]);

  const handleStartStream = useCallback(async () => {
    if (!title.trim()) return;

    const ok = await requestPermissions();
    if (!ok) {
      Alert.alert('ไม่มีสิทธิ์', 'กรุณาอนุญาตกล้องและไมค์ในการตั้งค่า');
      return;
    }

    setStreamStatus('creating');
    try {
      const session = await liveStreamService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        recordingEnabled: true,
      });
      sessionRef.current = session;
      setSessionId(session.id);
      await liveStreamService.start(session.id);

      if (!session.streamKey?.trim()) {
        throw new Error('ไม่ได้รับ streamKey จากเซิร์ฟเวอร์');
      }

      startedRef.current = false;
      setStreamStatus('connecting');
      setIsStreaming(true);
    } catch (err: any) {
      logError('Stream', '[StreamPublisher]', err);
      const msg =
        err?.response?.data?.message || err?.message || 'ลองใหม่อีกครั้ง';
      setStreamStatus('error');
      cleanup();
      Alert.alert('เริ่ม Stream ไม่สำเร็จ', msg);
    }
  }, [title, description, visibility, cleanup]);

  // Begin RTMP publish once the live view is mounted.
  useEffect(() => {
    if (!isStreaming || startedRef.current) return;
    const session = sessionRef.current;
    if (!session?.streamKey || !STREAM_CONFIG.rtmpServer) return;
    startedRef.current = true;
    const t = setTimeout(async () => {
      try {
        await liveRef.current?.startStreaming(
          session.streamKey,
          STREAM_CONFIG.rtmpServer,
        );
      } catch (e) {
        logError('Stream', '[StreamPublisher] startStreaming', e);
        setStreamStatus('error');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [isStreaming]);

  /**
   * ต่อ RTMP ใหม่ (ใช้ตอนกลับมา foreground หลัง lock จอ/สลับแอป)
   * lock จอ -> ระบบตัด publish -> media server ไม่มีสัญญาณ -> เว็บมองไม่เห็นไลฟ์
   * แก้: กลับมา active แล้วปลุก session (ถ้าโดนปิด) + start RTMP ใหม่ด้วย key เดิม
   */
  const reconnectStream = useCallback(async () => {
    const session = sessionRef.current;
    if (!session?.streamKey || !STREAM_CONFIG.rtmpServer) return;
    setStreamStatus('connecting');
    try {
      // ปลุก session ฝั่ง backend ถ้าโดนปิดตอนหลุด (retry เผื่อ API ล่มชั่วคราว)
      const s = await withRetry(
        () => liveStreamService.getById(session.id),
        '[StreamPublisher] reconnect status check',
      );
      if (sessionRef.current?.id !== session.id) return; // ปิดไลฟ์ไปแล้วระหว่างรอ
      if (s && (s.status === 'Ended' || s.status === 'Error')) {
        await withRetry(
          () => liveStreamService.start(session.id),
          '[StreamPublisher] reconnect start session',
        );
        if (sessionRef.current?.id !== session.id) return;
      }
      // รีเซ็ตแล้วต่อใหม่ด้วย key เดิม (streamId เดิม เว็บกลับมาเห็น)
      try {
        liveRef.current?.stopStreaming();
      } catch {}
      startedRef.current = true;
      await liveRef.current?.startStreaming(
        session.streamKey,
        STREAM_CONFIG.rtmpServer,
      );
    } catch (e) {
      logError('Stream', '[StreamPublisher] reconnect failed', e);
      startedRef.current = false;
      setStreamStatus('error');
    }
  }, []);

  useEffect(() => {
    const handleChange = (state: AppStateStatus) => {
      if (state === 'background') {
        // ถูกพักไว้ -> publish หลุดแน่ ๆ mark ให้ตอนกลับมาต่อใหม่
        connectedRef.current = false;
        startedRef.current = false;
      } else if (state === 'active' && isStreaming && !connectedRef.current) {
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        // หน่วงให้กล้อง/หน้าจอ resume ก่อนค่อยต่อ RTMP
        reconnectTimerRef.current = setTimeout(() => {
          reconnectStream();
        }, 800);
      }
    };
    const sub = AppState.addEventListener('change', handleChange);
    return () => {
      sub.remove();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [isStreaming, reconnectStream]);

  const handleStopStream = useCallback(async () => {
    Alert.alert('หยุด Stream?', `คุณ Stream มาแล้ว ${formatDuration(duration)}`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'หยุด',
        style: 'destructive',
        onPress: async () => {
          setStreamStatus('stopping');
          try {
            liveRef.current?.stopStreaming();
          } catch {}
          startedRef.current = false;
          setIsStreaming(false);
          setStreamStatus('idle');
          setDuration(0);
          setViewerCount(0);
          if (sessionRef.current) {
            try {
              await liveStreamService.stop(sessionRef.current.id);
            } catch (e) {
              logError('Stream', '[StreamPublisher] stop error', e);
            }
          }
          sessionRef.current = null;
        },
      },
    ]);
  }, [duration]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const statusColor = useMemo(() => {
    switch (streamStatus) {
      case 'live':
        return AppColors.success;
      case 'creating':
      case 'connecting':
      case 'stopping':
        return AppColors.warning;
      case 'error':
        return AppColors.danger;
      default:
        return AppColors.grayLight;
    }
  }, [streamStatus]);

  const statusText = useMemo(() => {
    switch (streamStatus) {
      case 'creating':
        return 'กำลังสร้าง...';
      case 'connecting':
        return 'เชื่อมต่อ...';
      case 'live':
        return 'LIVE';
      case 'stopping':
        return 'หยุด...';
      case 'error':
        return 'ผิดพลาด';
      default:
        return 'พร้อม';
    }
  }, [streamStatus]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: AppColors.secondary },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top + verticalScale(4),
          paddingHorizontal: scale(16),
          paddingBottom: verticalScale(8),
          backgroundColor: AppColors.scrimStrong,
          zIndex: 10,
        },
        closeBtn: { padding: scale(8) },
        headerTitle: { flex: 1, marginLeft: scale(8) },
        statusBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          backgroundColor: AppColors.surface,
          paddingHorizontal: scale(12),
          paddingVertical: verticalScale(4),
          borderRadius: scale(12),
        },
        statusDot: { width: scale(8), height: scale(8), borderRadius: scale(4) },
        setupContainer: {
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: scale(24),
          gap: verticalScale(16),
        },
        setupTitle: { textAlign: 'center', marginBottom: verticalScale(4) },
        creatingOverlay: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: verticalScale(12),
        },
        previewContainer: { flex: 1, backgroundColor: '#000' },
        chatOverlay: { ...StyleSheet.absoluteFillObject },
        overlayTop: {
          position: 'absolute',
          top: verticalScale(10),
          left: scale(12),
          right: scale(12),
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2,
        },
        liveBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          backgroundColor: AppColors.danger,
          paddingHorizontal: scale(10),
          paddingVertical: verticalScale(4),
          borderRadius: scale(6),
        },
        connectingBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
          backgroundColor: AppColors.scrim,
          paddingHorizontal: scale(10),
          paddingVertical: verticalScale(4),
          borderRadius: scale(6),
        },
        liveDot: {
          width: scale(7),
          height: scale(7),
          borderRadius: scale(4),
          backgroundColor: '#fff',
        },
        statsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
          backgroundColor: AppColors.scrim,
          paddingHorizontal: scale(12),
          paddingVertical: verticalScale(6),
          borderRadius: scale(20),
        },
        overlayControls: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: scale(16),
          paddingTop: verticalScale(12),
          paddingBottom: insets.bottom + verticalScale(16),
          backgroundColor: AppColors.scrim,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(12),
          zIndex: 2,
        },
        stopBtn: { flex: 1 },
        flipBtn: {
          backgroundColor: AppColors.surfaceStrong,
          padding: scale(12),
          borderRadius: scale(28),
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [insets.top, insets.bottom, scale, verticalScale],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      supportedOrientations={['portrait']}
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      {/* กันจอดับระหว่างไลฟ์ (unmount = ปล่อยให้ดับได้ตามปกติ) */}
      {isStreaming && <KeepAwake />}
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons
              name="arrow-back"
              size={IS_TABLET ? 32 : 24}
              color={AppColors.white}
            />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <AppText fontWeight="medium" fontSize={AppFontSize.subtitle}>
              {isStreaming ? sessionRef.current?.title ?? title : 'เริ่ม Stream'}
            </AppText>
          </View>
          {(isStreaming || streamStatus === 'creating') && (
            <View style={styles.statusBadge}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <AppText fontSize={AppFontSize.caption}>{statusText}</AppText>
            </View>
          )}
        </View>

        {streamStatus === 'creating' ? (
          <View style={styles.creatingOverlay}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <AppText
              fontSize={AppFontSize.body}
              style={{ color: AppColors.grayLight }}
            >
              กำลังสร้าง Live Session...
            </AppText>
          </View>
        ) : !isStreaming ? (
          <View style={styles.setupContainer}>
            <AppText
              fontWeight="medium"
              fontSize={AppFontSize.h1}
              style={styles.setupTitle}
            >
              สร้าง Live Stream
            </AppText>

            <AppTextInput
              label="ชื่อ Live Stream *"
              placeholder="เช่น สอนเขียน React Native"
              value={title}
              onChangeText={setTitle}
            />
            <AppTextInput
              label="รายละเอียด"
              placeholder="อธิบายเกี่ยวกับ Live Stream..."
              value={description}
              onChangeText={setDescription}
            />

            <AppButton
              title="เริ่มถ่ายทอดสด"
              onPress={handleStartStream}
              disabled={!title.trim()}
            />
          </View>
        ) : (
          <View style={styles.previewContainer} collapsable={false}>
            <ApiVideoLiveStreamView
              ref={liveRef}
              style={StyleSheet.absoluteFill}
              camera={isFrontCamera ? 'front' : 'back'}
              isMuted={isMuted}
              enablePinchedZoom
              video={{ bitrate: 2_000_000, fps: 30, resolution: '720p' }}
              audio={{ bitrate: 128_000, sampleRate: 44100, isStereo: false }}
              onConnectionSuccess={() => {
                connectedRef.current = true;
                setStreamStatus('live');
              }}
              onConnectionFailed={code => {
                connectedRef.current = false;
                logError('Stream', '[StreamPublisher] RTMP connect failed', code);
                setStreamStatus('error');
              }}
              onDisconnect={() => {
                startedRef.current = false;
                connectedRef.current = false;
              }}
            />

            <View style={styles.overlayTop} pointerEvents="box-none">
              {streamStatus === 'live' ? (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <AppText
                    fontWeight="bold"
                    fontSize={AppFontSize.caption}
                    style={{ color: AppColors.white }}
                  >
                    LIVE
                  </AppText>
                </View>
              ) : streamStatus === 'connecting' ? (
                <View style={styles.connectingBadge}>
                  <ActivityIndicator size="small" color={AppColors.white} />
                  <AppText
                    fontSize={AppFontSize.overline}
                    style={{ color: AppColors.white }}
                  >
                    รอสัญญาณ...
                  </AppText>
                </View>
              ) : (
                <View />
              )}
              <View style={styles.statsRow}>
                <Ionicons
                  name="eye"
                  size={IS_TABLET ? 18 : 15}
                  color={AppColors.white}
                />
                <AppText
                  fontWeight="medium"
                  fontSize={AppFontSize.body}
                  style={{ color: AppColors.white }}
                >
                  {viewerCount}
                </AppText>
                <AppText
                  fontWeight="medium"
                  fontSize={AppFontSize.body}
                  style={{ color: AppColors.white }}
                >
                  {formatDuration(duration)}
                </AppText>
              </View>
            </View>

            <View style={styles.chatOverlay} pointerEvents="box-none">
              <LiveChat
                streamId={sessionId ?? undefined}
                ephemeral
                bottomInset={controlsHeight}
              />
            </View>

            <View
              style={styles.overlayControls}
              onLayout={e => setControlsHeight(e.nativeEvent.layout.height)}
            >
              <TouchableOpacity
                onPress={() => setIsFrontCamera(v => !v)}
                style={styles.flipBtn}
              >
                <Ionicons
                  name="camera-reverse"
                  size={IS_TABLET ? 30 : 24}
                  color={AppColors.white}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsMuted(v => !v)}
                style={styles.flipBtn}
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={IS_TABLET ? 30 : 24}
                  color={isMuted ? AppColors.danger : AppColors.white}
                />
              </TouchableOpacity>

              <View style={styles.stopBtn}>
                <AppButton
                  title="หยุดถ่ายทอดสด"
                  onPress={handleStopStream}
                  useGradient={false}
                  backgroundColor={AppColors.danger}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default StreamPublisher;
