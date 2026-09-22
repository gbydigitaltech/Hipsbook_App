import { NODEMEDIA_LICENSE } from '@env';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { log, logError } from '../../helpers/logger';
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
  Modal,
  PanResponder,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  NodeMediaClient,
  NodePublisher,
} from 'react-native-nodemediaclient';
import {
  PERMISSIONS,
  RESULTS,
  request,
} from 'react-native-permissions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import AppButton from '../buttons/AppButton';
import AppTextInput from '../inputs/AppTextInput';
import AppText from '../texts/AppText';
import liveStreamService, { LiveStreamSession } from './liveStreamService';
import { resolveRtmpIngestUrl } from './streamConfig';
import { AppFontSize } from '../../styles/sharedstyles';

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
    // iOS: request camera + microphone before the capture session starts
    const cam = await request(PERMISSIONS.IOS.CAMERA);
    const mic = await request(PERMISSIONS.IOS.MICROPHONE);
    return cam === RESULTS.GRANTED && mic === RESULTS.GRANTED;
  } catch {
    return false;
  }
}

const StreamPublisher = ({ visible, onClose }: StreamPublisherProps) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (NODEMEDIA_LICENSE) {
      NodeMediaClient.setLicense(NODEMEDIA_LICENSE);
    }
  }, []);
  const { scale, verticalScale } = useResponsive();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Private'>(
    'Public',
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [mountKey, setMountKey] = useState(0);
  const [zoom, setZoom] = useState(0);
  const zoomRef = useRef(0);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);
  const applyZoom = (v: number) => {
    const nv = Math.max(0, Math.min(1, v));
    zoomRef.current = nv;
    setZoom(nv);
  };
  const pinchResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: e => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: e => e.nativeEvent.touches.length === 2,
      onPanResponderMove: e => {
        const t = e.nativeEvent.touches;
        if (t.length !== 2) return;
        const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        if (!pinchStartRef.current) {
          pinchStartRef.current = { dist: d, zoom: zoomRef.current };
          return;
        }
        const ratio = d / pinchStartRef.current.dist;
        applyZoom(pinchStartRef.current.zoom + (ratio - 1));
      },
      onPanResponderRelease: () => {
        pinchStartRef.current = null;
      },
      onPanResponderTerminate: () => {
        pinchStartRef.current = null;
      },
    }),
  ).current;
  const [duration, setDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [rtmpUrl, setRtmpUrl] = useState<string | null>(null);

  const sessionRef = useRef<LiveStreamSession | null>(null);
  const cameraRef = useRef<InstanceType<typeof NodePublisher> | null>(null);

  useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, [isStreaming]);

  /** Sync with backend: show LIVE when the API says Live even if RTMP never fires event 2101; poll the viewer count periodically. */
  useEffect(() => {
    if (!isStreaming || !rtmpUrl) return;
    const id = sessionRef.current?.id;
    if (!id) return;

    let cancelled = false;
    const sync = async () => {
      try {
        const s = await liveStreamService.getById(id);
        if (cancelled) return;
        if (s.status === 'Live') {
          setStreamStatus(prev => (prev === 'live' ? prev : 'live'));
        }
      } catch {}

      try {
        const h = await liveStreamService.getHealth(id);
        if (!cancelled) {
          setViewerCount(h.currentViewers ?? 0);
        }
      } catch {}
    };

    sync();
    const t = setInterval(sync, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [isStreaming, rtmpUrl]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' && isStreaming && cameraRef.current) {
        cameraRef.current.stop();
      } else if (state === 'active' && isStreaming) {
        // Returning from lock/background: remount to re-open camera + preview
        setMountKey(k => k + 1);
      }
    });
    return () => sub.remove();
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
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch {}
    }
    setRtmpUrl(null);
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

      const url = resolveRtmpIngestUrl(session);
      log('Stream', '[StreamPublisher] RTMP ingest URL:', url);
      setRtmpUrl(url);
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

  useEffect(() => {
    if (!isStreaming || !rtmpUrl) return;
    const t = setTimeout(() => {
      try {
        cameraRef.current?.startPreview();
        cameraRef.current?.start();
      } catch (e) {
        logError('Stream', '[StreamPublisher] RTMP start', e);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [isStreaming, rtmpUrl, mountKey]);

  const handleStopStream = useCallback(async () => {
    Alert.alert(
      'หยุด Stream?',
      `คุณ Stream มาแล้ว ${formatDuration(duration)}`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'หยุด',
          style: 'destructive',
          onPress: async () => {
            setStreamStatus('stopping');
            try {
              cameraRef.current?.stop();
            } catch {}
            setRtmpUrl(null);
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
      ],
    );
  }, [duration]);

  const handleRtmpEvent = useCallback((code: number, msg: string) => {
    log('Stream', '[StreamPublisher] RTMP', code, msg);
    if (code === 2100 || code === 2101) {
      setStreamStatus('live');
    }
    if (code === 2102) {
      setStreamStatus('error');
      Alert.alert('ออกอากาศล้มเหลว', msg || 'ไม่สามารถ publish RTMP ได้');
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const videoParam = useMemo(
    () => ({
      codecid: NodePublisher.NMC_CODEC_ID_H264,
      profile: NodePublisher.NMC_PROFILE_H264_HIGH,
      width: 720,
      height: 1280,
      fps: 30,
      bitrate: 2_000_000,
    }),
    [],
  );

  const audioParam = useMemo(
    () => ({
      codecid: NodePublisher.NMC_CODEC_ID_AAC,
      profile: NodePublisher.NMC_PROFILE_AAC_LC,
      bitrate: 128_000,
      samplerate: 44100 as const,
      channels: 1 as const,
    }),
    [],
  );

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
        container: {
          flex: 1,
          backgroundColor: AppColors.secondary,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top + verticalScale(4),
          paddingHorizontal: scale(16),
          paddingBottom: verticalScale(8),
          backgroundColor: AppColors.scrimStrong,
          zIndex: 10,
        },
        closeBtn: {
          padding: scale(8),
        },
        headerTitle: {
          flex: 1,
          marginLeft: scale(8),
        },
        statusBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          backgroundColor: AppColors.surface,
          paddingHorizontal: scale(12),
          paddingVertical: verticalScale(4),
          borderRadius: scale(12),
        },
        statusDot: {
          width: scale(8),
          height: scale(8),
          borderRadius: scale(4),
        },
        setupContainer: {
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: scale(24),
          gap: verticalScale(16),
        },
        setupTitle: {
          textAlign: 'center',
          marginBottom: verticalScale(4),
        },
        hint: {
          textAlign: 'center',
          color: AppColors.grayLight,
        },
        visibilityRow: {
          flexDirection: 'row',
          gap: scale(10),
        },
        visBtn: {
          flex: 1,
          paddingVertical: verticalScale(10),
          borderRadius: scale(8),
          alignItems: 'center',
        },
        visBtnActive: {
          backgroundColor: AppColors.primary,
        },
        visBtnInactive: {
          backgroundColor: AppColors.backgroundInteractive,
        },
        creatingOverlay: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: verticalScale(12),
        },
        previewContainer: {
          flex: 1,
          backgroundColor: '#000',
        },
        publisherWrap: {
          position: 'absolute',
          top: 0,
          left: 0,
        },
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
        stopBtn: {
          flex: 1,
        },
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
              {isStreaming
                ? sessionRef.current?.title ?? title
                : 'เริ่ม Stream'}
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

            <View />

            {/* <View>
              <AppText
                fontSize={AppFontSize.body}
                style={{ marginBottom: verticalScale(6) }}
              >
                การมองเห็น
              </AppText>
              <View style={styles.visibilityRow}>
                <TouchableOpacity
                  style={[
                    styles.visBtn,
                    visibility === 'Public'
                      ? styles.visBtnActive
                      : styles.visBtnInactive,
                  ]}
                  onPress={() => setVisibility('Public')}
                >
                  <AppText fontWeight="medium" fontSize={AppFontSize.caption}>
                    สาธารณะ
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.visBtn,
                    visibility === 'Private'
                      ? styles.visBtnActive
                      : styles.visBtnInactive,
                  ]}
                  onPress={() => setVisibility('Private')}
                >
                  <AppText fontWeight="medium" fontSize={AppFontSize.caption}>
                    ส่วนตัว
                  </AppText>
                </TouchableOpacity>
              </View>
            </View> */}

            <AppButton
              title="เริ่มถ่ายทอดสด"
              onPress={handleStartStream}
              disabled={!title.trim()}
            />
          </View>
        ) : (
          <View
            style={styles.previewContainer}
            collapsable={false}
            onLayout={e => {
              const { width, height } = e.nativeEvent.layout;
              setPreviewSize(prev =>
                prev.width === width && prev.height === height
                  ? prev
                  : { width, height },
              );
            }}
          >
            {rtmpUrl && previewSize.width > 0 ? (
              <View
                style={[
                  styles.publisherWrap,
                  { width: previewSize.width, height: previewSize.height },
                ]}
                collapsable={false}
                {...pinchResponder.panHandlers}
              >
                <NodePublisher
                  key={`pub-${mountKey}-${Math.round(
                    previewSize.width,
                  )}x${Math.round(previewSize.height)}`}
                  ref={cameraRef}
                  style={{
                    width: previewSize.width,
                    height: previewSize.height,
                  }}
                  url={rtmpUrl}
                  frontCamera={isFrontCamera}
                  videoOrientation={NodePublisher.VIDEO_ORIENTATION_PORTRAIT}
                  roomRatio={zoom}
                  HWAccelEnable={Platform.OS === 'ios'}
                  videoParam={videoParam}
                  audioParam={audioParam}
                  onEvent={handleRtmpEvent}
                />
              </View>
            ) : null}

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
