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
  const [duration, setDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);

  const sessionRef = useRef<LiveStreamSession | null>(null);
  const liveRef = useRef<ApiVideoLiveStreamMethods>(null);
  const startedRef = useRef(false);

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

    let cancelled = false;
    const sync = async () => {
      try {
        const s = await liveStreamService.getById(id);
        if (!cancelled && s.status === 'Live') {
          setStreamStatus(prev => (prev === 'live' ? prev : 'live'));
        }
      } catch {}
      try {
        const h = await liveStreamService.getHealth(id);
        if (!cancelled) setViewerCount(h.currentViewers ?? 0);
      } catch {}
    };

    sync();
    const t = setInterval(sync, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
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
              enablePinchedZoom
              video={{ bitrate: 2_000_000, fps: 30, resolution: '720p' }}
              audio={{ bitrate: 128_000, sampleRate: 44100, isStereo: false }}
              onConnectionSuccess={() => setStreamStatus('live')}
              onConnectionFailed={code => {
                logError('Stream', '[StreamPublisher] RTMP connect failed', code);
                setStreamStatus('error');
              }}
              onDisconnect={() => {
                startedRef.current = false;
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

            <View style={styles.overlayControls}>
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
