import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Image,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AppSpinner from '../loading/AppSpinner';
import {
  ApiVideoLiveStreamMethods,
  ApiVideoLiveStreamView,
} from '@api.video/react-native-livestream';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { IS_TABLET } from '../../constants/platform';
import { logError } from '../../helpers/logger';
import { useResponsive } from '../../helpers/responsive';
import { AppColors, LIVE_HEART_COLORS } from '../../styles/colors';
import { getFontFamily } from '../../helpers/fontFamilyHelper';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Orientation from 'react-native-orientation-locker';
import AppText from '../texts/AppText';
import liveStreamService, { LiveStreamSession } from './liveStreamService';
import { STREAM_CONFIG } from './streamConfig';
import useLiveLikes from '../../hooks/chat/useLiveLikes';
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

/** Retries up to `attempts` times (delays 1s, 2s, ...); returns null instead of throwing if all fail */
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

type StreamQuality = 'fhd' | 'high' | 'medium' | 'low';

const STREAM_QUALITY_PRESETS: Record<
  StreamQuality,
  {
    label: string;
    hint: string;
    video: {
      bitrate: number;
      fps: number;
      resolution: '1080p' | '720p' | '480p' | '360p';
    };
  }
> = {
  // 1080p needs a strong upload connection (Wi-Fi/5G recommended) and uses more battery/heat
  fhd: {
    label: '1080p',
    hint: 'Full HD · 4.5 Mbps (แนะนำ Wi-Fi/5G)',
    video: { bitrate: 4_500_000, fps: 30, resolution: '1080p' },
  },
  high: {
    label: '720p',
    hint: 'HD · 3 Mbps',
    video: { bitrate: 3_000_000, fps: 30, resolution: '720p' },
  },
  medium: {
    label: '480p',
    hint: 'มาตรฐาน · 1.5 Mbps',
    video: { bitrate: 1_500_000, fps: 30, resolution: '480p' },
  },
  low: {
    label: '360p',
    hint: 'ประหยัดเน็ต · 0.8 Mbps',
    video: { bitrate: 800_000, fps: 30, resolution: '360p' },
  },
};

const QUALITY_ORDER: StreamQuality[] = ['fhd', 'high', 'medium', 'low'];

const MAX_ZOOM = 5;

const ORIENT_OPTIONS = [
  { landscape: false, label: 'แนวตั้ง 9:16' },
  { landscape: true, label: 'แนวนอน 16:9' },
];

type AudienceKey = 'public' | 'followers' | 'private';
const AUDIENCE_OPTIONS: {
  key: AudienceKey;
  label: string;
  api: 'Public' | 'Private' | 'Unlisted';
}[] = [
  { key: 'public', label: 'สาธารณะ', api: 'Public' },
  // TODO: waiting for backend support for "followers"
  { key: 'followers', label: 'ผู้ติดตาม', api: 'Public' },
  { key: 'private', label: 'ส่วนตัว', api: 'Private' },
];

/* Setup screen colors (Figma design mapped to the app theme) */
const SC = {
  bg: AppColors.black,
  title: AppColors.textPrimary,
  backCircle: AppColors.surface,
  field: AppColors.backgroundInteractive,
  placeholder: AppColors.textTertiary,
  placeholder2: AppColors.textTertiary,
  card: AppColors.cardBackground,
  sub: AppColors.textTertiary,
  hint: AppColors.textSecondary,
  cam: AppColors.textTertiary,
  dash: AppColors.borderStrong,
  addTile: AppColors.cardBackground,
  addDash: AppColors.textTertiary,
  addIcon: AppColors.textTertiary,
  ready: AppColors.liveReady,
  primary: AppColors.primary,
  toggleOff: AppColors.surfaceStrong,
};

const toggleStyles = StyleSheet.create({
  track: {
    width: 64,
    height: 28,
    borderRadius: AppRadius.pill,
    padding: 2,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: SC.toggleOff,
  },
  trackOn: { justifyContent: 'flex-end', backgroundColor: SC.primary },
  knob: {
    width: 39,
    height: 24,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.white,
  },
});

/** Toggle switch per design (64x28, knob 39x24) */
const DesignToggle = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <Pressable
    onPress={() => onChange(!value)}
    hitSlop={6}
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
    style={[toggleStyles.track, value && toggleStyles.trackOn]}
  >
    <View style={toggleStyles.knob} />
  </Pressable>
);

/* Host screen colors (Figma design mapped to the app theme) */
const HC = {
  danger: AppColors.danger,
  white: AppColors.white,
  endPill: AppColors.borderStrong,
  viewerPill: AppColors.mediaScrim,
  circle: AppColors.sheetRaised,
  icon: AppColors.grayLight,
  menu: AppColors.sheet,
};
const HEART_COLORS = LIVE_HEART_COLORS;

/** Floating heart (random color/size/tilt per design); notifies when done so it can be removed */
const FloatingHeart = ({ onDone }: { onDone: () => void }) => {
  const v = useRef(new Animated.Value(0)).current;
  const cfg = useRef({
    drift: (Math.random() - 0.5) * 60,
    color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
    size: 14 + Math.round(Math.random() * 12),
    tilt: Math.random() < 0.5 ? '-15deg' : '15deg',
  }).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 1600,
      useNativeDriver: true,
    }).start(onDone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = {
    position: 'absolute' as const,
    bottom: 0,
    left: -cfg.size / 2,
    opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
    transform: [
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -170],
        }),
      },
      {
        translateX: v.interpolate({
          inputRange: [0, 1],
          outputRange: [0, cfg.drift],
        }),
      },
      { rotate: cfg.tilt },
      {
        scale: v.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0.5, 1.15, 1],
        }),
      },
    ],
  };
  return (
    <Animated.View style={style} pointerEvents="none">
      <Ionicons name="heart" size={cfg.size} color={cfg.color} />
    </Animated.View>
  );
};

/** Live duration as HH:MM:SS (per design) */
const formatHms = (s: number) => {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
};

type ContentProps = {
  onClose: () => void;
  /** Lets the outer Modal call the content's handleClose on Android back press */
  closeRef: React.MutableRefObject<() => void>;
};

const StreamPublisherContent = ({ onClose, closeRef }: ContentProps) => {
  // Uses the Modal's own SafeAreaProvider -> insets update on rotation
  // (the app-level provider kept portrait values: top bar dropped, left edge didn't avoid the Dynamic Island)
  const rotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const isLand = winW > winH;
  // One edge spacing for everything (top row/chat/input bar) + clear of the Dynamic Island/notch via insets
  const { scale, verticalScale, moderateScale, responsiveRadius } =
    useResponsive();
  const E = scale(16);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Who can watch (followers isn't supported by the backend yet -> sent as Public for now)
  const [audience, setAudience] = useState<AudienceKey>('public');
  // Extra settings (chat: no server-side support yet, value kept locally)
  const [chatEnabled, setChatEnabled] = useState(true);
  const [recordEnabled, setRecordEnabled] = useState(false);
  // Live cover: can be picked but isn't uploaded yet -> shown locally only
  const [coverUri, setCoverUri] = useState<string | null>(null);
  // Live format: portrait 9:16 | landscape 16:9 (output follows the app's screen orientation)
  const [landscape, setLandscape] = useState(false);
  // Camera check before going live: tap the preview -> opens the real camera (not broadcasting)
  const [camCheck, setCamCheck] = useState(false);
  // Camera already checked -> preview shows "ready to go live"
  const [camChecked, setCamChecked] = useState(false);
  const openCamCheck = useCallback(async () => {
    const ok = await requestPermissions();
    if (!ok) {
      Alert.alert('ไม่มีสิทธิ์', 'กรุณาอนุญาตกล้องและไมค์ในการตั้งค่า');
      return;
    }
    // Landscape selected -> rotate the screen so the preview matches the actual broadcast
    if (landscape) Orientation.lockToLandscape();
    setCamCheck(true);
    setCamChecked(true);
  }, [landscape]);
  const closeCamCheck = useCallback(() => {
    setCamCheck(false);
    Orientation.lockToPortrait();
  }, []);

  const pickCover = useCallback(async () => {
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });
      const uri = res.assets?.[0]?.uri;
      if (uri) setCoverUri(uri);
    } catch (e) {
      logError('Stream', '[StreamPublisher] pick cover', e);
    }
  }, []);
  const [quality, setQuality] = useState<StreamQuality>('medium');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // TikTok-style: swipe left anywhere = hide comments, swipe right = show them (shown by default)
  const [chatHidden, setChatHidden] = useState(false);
  // Uses gesture-handler: works alongside the camera/comment list (PanResponder often loses to the native view)
  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-25, 25])
        .failOffsetY([-20, 20])
        .onEnd(e => {
          if (e.translationX < -40 || e.velocityX < -500) setChatHidden(true);
          else if (e.translationX > 40 || e.velocityX > 500)
            setChatHidden(false);
        }),
    [],
  );
  // Pinch to zoom the camera (done via gesture-handler because the overlay/chat blocks native zoom)
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const zoomStartRef = useRef(1);
  const [zoomBadge, setZoomBadge] = useState(false);
  const zoomBadgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyZoom = useCallback((z: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(1, z));
    zoomRef.current = clamped;
    liveRef.current?.setZoomRatio(clamped);
    setZoom(clamped);
  }, []);
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        // No zoom on the front camera (its zoom range on iOS is very small and gets stuck)
        .enabled(!isFrontCamera)
        .runOnJS(true)
        .onStart(() => {
          zoomStartRef.current = zoomRef.current;
          if (zoomBadgeTimer.current) clearTimeout(zoomBadgeTimer.current);
          setZoomBadge(true);
        })
        .onUpdate(e =>
          // Power of 1.6: a small pinch zooms more (the old linear mapping needed a very wide pinch)
          applyZoom(zoomStartRef.current * Math.pow(e.scale, 1.6)),
        )
        .onEnd(() => {
          zoomBadgeTimer.current = setTimeout(() => setZoomBadge(false), 1200);
        }),
    [applyZoom, isFrontCamera],
  );
  // Double tap = back to 1x
  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!isFrontCamera)
        .numberOfTaps(2)
        .runOnJS(true)
        .onEnd(() => {
          applyZoom(1);
          setZoomBadge(true);
          if (zoomBadgeTimer.current) clearTimeout(zoomBadgeTimer.current);
          zoomBadgeTimer.current = setTimeout(() => setZoomBadge(false), 900);
        }),
    [applyZoom, isFrontCamera],
  );
  // Switching cameras: the new camera always starts at 1x -> reset the app value to match
  // (previously the old camera's zoom, e.g. 3x, carried over so pinching did nothing until past 3x)
  useEffect(() => {
    zoomRef.current = 1;
    zoomStartRef.current = 1;
    setZoom(1);
    liveRef.current?.setZoomRatio(1);
  }, [isFrontCamera]);

  const liveGestures = useMemo(
    () => Gesture.Simultaneous(swipeGesture, pinchGesture, doubleTapGesture),
    [swipeGesture, pinchGesture, doubleTapGesture],
  );
  useEffect(
    () => () => {
      if (zoomBadgeTimer.current) clearTimeout(zoomBadgeTimer.current);
    },
    [],
  );

  const [hearts, setHearts] = useState<number[]>([]);
  const spawnHeart = useCallback(() => {
    setHearts(prev => [...prev.slice(-14), Date.now() + Math.random()]);
  }, []);
  // Hearts from others (realtime): float up one by one instead of all at once
  const { sendLike } = useLiveLikes(sessionId ?? undefined, n => {
    for (let i = 0; i < n; i++) setTimeout(spawnHeart, i * 140);
  });
  const handleLike = useCallback(() => {
    spawnHeart();
    sendLike();
  }, [spawnHeart, sendLike]);
  const removeHeart = useCallback(
    (id: number) => setHearts(prev => prev.filter(h => h !== id)),
    [],
  );

  const sessionRef = useRef<LiveStreamSession | null>(null);
  const liveRef = useRef<ApiVideoLiveStreamMethods>(null);
  const startedRef = useRef(false);
  const connectedRef = useRef(false); // whether RTMP is actually connected
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Chained setTimeout instead of setInterval: the next poll starts only after this one finishes
    // (no overlapping requests when the server is slow) + backoff on consecutive failures
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
      // 4s normally -> 8s -> 16s -> up to 30s while the API is failing
      const delay = Math.min(
        SYNC_INTERVAL_MS * 2 ** failStreak,
        SYNC_MAX_BACKOFF_MS,
      );
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
    // Cancel any pending rotation (if creating the live fails fast, don't rotate to landscape afterwards)
    if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
    startedRef.current = false;
    Orientation.lockToPortrait();
    setCamCheck(false);
    setIsStreaming(false);
    setStreamStatus('idle');
    setDuration(0);
    setViewerCount(0);
    setSessionId(null);
    connectedRef.current = false;
    setIsMuted(false);
    setMenuOpen(false);
    setChatHidden(false);
    zoomRef.current = 1;
    setZoom(1);
    setHearts([]);
  }, []);

  const handleClose = useCallback(() => {
    // Camera check is open -> back button only closes the camera check
    if (camCheck) {
      setCamCheck(false);
      Orientation.lockToPortrait();
      return;
    }
    if (isStreaming) {
      Alert.alert('กำลัง Stream อยู่', 'หยุด Stream ก่อนปิดหน้าจอ');
      return;
    }
    cleanup();
    sessionRef.current = null;
    setTitle('');
    setDescription('');
    onClose();
  }, [cleanup, onClose, isStreaming, camCheck]);

  useEffect(() => {
    closeRef.current = handleClose;
  }, [closeRef, handleClose]);

  const handleStartStream = useCallback(async () => {
    if (!title.trim()) return;

    const ok = await requestPermissions();
    if (!ok) {
      Alert.alert('ไม่มีสิทธิ์', 'กรุณาอนุญาตกล้องและไมค์ในการตั้งค่า');
      return;
    }

    // Switch to the loading screen first, then rotate (avoids the setup form flashing in landscape)
    setStreamStatus('creating');
    setCamCheck(false);
    // Rotate before starting: the broadcast output will be landscape (16:9)
    if (landscape) {
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      rotateTimerRef.current = setTimeout(
        () => Orientation.lockToLandscape(),
        80,
      );
    }
    try {
      const session = await liveStreamService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility: AUDIENCE_OPTIONS.find(a => a.key === audience)?.api,
        recordingEnabled: recordEnabled,
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
  }, [title, description, audience, recordEnabled, landscape, cleanup]);

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
   * Reconnect RTMP (used when returning to the foreground after locking the screen/switching apps)
   * Screen lock -> OS stops publishing -> media server gets no signal -> web can't see the live
   * Fix: when active again, wake the session (if it was closed) + restart RTMP with the same key
   */
  const reconnectStream = useCallback(async () => {
    const session = sessionRef.current;
    if (!session?.streamKey || !STREAM_CONFIG.rtmpServer) return;
    setStreamStatus('connecting');
    try {
      // Wake the backend session if it was closed during the drop (retry in case the API is briefly down)
      const s = await withRetry(
        () => liveStreamService.getById(session.id),
        '[StreamPublisher] reconnect status check',
      );
      if (sessionRef.current?.id !== session.id) return; // live was closed while waiting
      if (s && (s.status === 'Ended' || s.status === 'Error')) {
        await withRetry(
          () => liveStreamService.start(session.id),
          '[StreamPublisher] reconnect start session',
        );
        if (sessionRef.current?.id !== session.id) return;
      }
      // Reset and reconnect with the same key (same streamId, so the web sees it again)
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
        // Backgrounded -> publishing will drop; mark it so we reconnect on return
        connectedRef.current = false;
        startedRef.current = false;
      } else if (state === 'active' && isStreaming && !connectedRef.current) {
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        // Give the camera/screen time to resume before reconnecting RTMP
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
              liveRef.current?.stopStreaming();
            } catch {}
            startedRef.current = false;
            Orientation.lockToPortrait();
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

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: SC.bg },
        flex1: { flex: 1 },

        /* ---- Header: round back button + centered title ---- */
        header: {
          height: scale(35),
          marginTop: insets.top + verticalScale(4),
          justifyContent: 'center',
        },
        headerTitle: {
          position: 'absolute',
          left: 0,
          right: 0,
          textAlign: 'center',
          color: SC.title,
        },
        backBtn: {
          marginLeft: scale(24),
          width: scale(35),
          height: scale(35),
          borderRadius: scale(18),
          backgroundColor: SC.backCircle,
          justifyContent: 'center',
          alignItems: 'center',
        },

        /* ---- Form ---- */
        form: {
          paddingHorizontal: scale(8.5),
          paddingTop: verticalScale(12),
          paddingBottom: insets.bottom + verticalScale(24),
        },
        label: {
          color: AppColors.white,
          marginLeft: scale(6.5),
          marginTop: verticalScale(14),
          marginBottom: verticalScale(10),
        },
        preview: {
          height: scale(255),
          borderRadius: scale(10),
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        },
        previewBorder: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: scale(10),
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: SC.dash,
        },
        readyPill: {
          position: 'absolute',
          left: scale(19),
          top: scale(16),
          height: scale(24),
          paddingHorizontal: scale(8),
          borderRadius: AppRadius.pill,
          borderWidth: 1,
          borderColor: SC.ready,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(5),
        },
        readyDot: {
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: SC.ready,
        },
        readyText: { color: SC.ready },
        camSidePill: {
          position: 'absolute',
          right: scale(14),
          top: scale(14),
          height: scale(28),
          paddingHorizontal: scale(10),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(5),
        },
        idlePill: { borderColor: SC.sub },
        idleDot: { backgroundColor: SC.sub },
        idleText: { color: SC.sub },
        camBtn: {
          width: scale(38),
          height: scale(38),
          borderRadius: scale(19),
          backgroundColor: AppColors.mediaScrim,
          justifyContent: 'center',
          alignItems: 'center',
        },
        camFull: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: AppColors.black,
          zIndex: 20,
        },
        camTop: {
          position: 'absolute',
          top: insets.top + verticalScale(10),
          left: scale(16) + insets.left,
          right: scale(16) + insets.right,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(10),
        },
        readyPill2: {
          height: scale(28),
          paddingHorizontal: scale(10),
          borderRadius: AppRadius.pill,
          borderWidth: 1,
          borderColor: SC.ready,
          backgroundColor: AppColors.mediaScrim,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(5),
        },
        camBottom: {
          position: 'absolute',
          left: scale(16) + insets.left,
          right: scale(16) + insets.right,
          bottom: insets.bottom + verticalScale(16),
          alignItems: 'center',
          gap: verticalScale(12),
        },
        camDone: {
          alignSelf: 'stretch',
          height: scale(46),
          borderRadius: AppRadius.pill,
          backgroundColor: SC.primary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        previewHintOn: {
          textShadowColor: 'rgba(0,0,0,0.7)',
          textShadowRadius: 3,
        },
        previewHint: {
          position: 'absolute',
          bottom: scale(13),
          color: SC.hint,
        },
        coverRow: { flexDirection: 'row', gap: scale(14) },
        coverTile: {
          width: scale(104),
          height: scale(94),
          borderRadius: scale(10),
          overflow: 'hidden',
        },
        coverImg: { width: '100%', height: '100%' },
        addTile: {
          width: scale(104),
          height: scale(94),
          borderRadius: scale(10),
          backgroundColor: SC.addTile,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: SC.addDash,
          justifyContent: 'center',
          alignItems: 'center',
        },
        field: {
          minHeight: scale(45),
          borderRadius: responsiveRadius(AppRadius.md),
          backgroundColor: SC.field,
          paddingHorizontal: scale(11),
          paddingTop: verticalScale(9),
          paddingBottom: verticalScale(4),
          color: AppColors.white,
          fontSize: moderateScale(AppFontSize.body, 0.5),
          fontFamily: getFontFamily('regular'),
        },
        fieldMulti: { height: scale(99), textAlignVertical: 'top' },
        segRow: { flexDirection: 'row', gap: scale(7) },
        seg: {
          flex: 1,
          height: scale(44),
          borderRadius: AppRadius.pill,
          backgroundColor: SC.card,
          justifyContent: 'center',
          alignItems: 'center',
        },
        segActive: { backgroundColor: SC.primary },
        segHint: {
          color: SC.sub,
          marginLeft: scale(6.5),
          marginTop: verticalScale(6),
        },
        card: {
          marginTop: verticalScale(27),
          borderRadius: scale(10),
          backgroundColor: SC.card,
          paddingHorizontal: scale(22),
          paddingVertical: verticalScale(21),
          gap: verticalScale(16),
        },
        settingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: scale(12),
        },
        settingText: { flex: 1 },
        settingSub: { color: SC.sub },
        startBtn: {
          marginTop: verticalScale(21),
          marginHorizontal: scale(12.5),
          height: scale(46),
          borderRadius: AppRadius.pill,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        },
        startBtnDisabled: { opacity: 0.45 },
        creatingOverlay: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: scale(24) + Math.max(insets.left, insets.right),
          gap: verticalScale(10),
        },
        creatingSpinner: {
          width: scale(64),
          height: scale(64),
          borderRadius: scale(32),
          backgroundColor: AppColors.surfaceActive,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: verticalScale(6),
        },
        creatingTitle: { color: AppColors.white, textAlign: 'center' },
        creatingSub: { color: AppColors.textTertiary, textAlign: 'center' },
        creatingHint: {
          marginTop: verticalScale(10),
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          paddingHorizontal: scale(12),
          height: scale(30),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.surface,
        },
        creatingHintText: { color: AppColors.textSecondary },
        previewContainer: { flex: 1, backgroundColor: AppColors.black },
        zoomBadge: {
          position: 'absolute',
          alignSelf: 'center',
          top: '42%',
          paddingHorizontal: scale(14),
          height: scale(32),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.scrim,
          justifyContent: 'center',
          zIndex: 5,
        },
        // Landscape: keep clear of the notch on left/right
        chatOverlay: {
          ...StyleSheet.absoluteFillObject,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },

        /* ---- Host screen (per design) ---- */
        topRow: {
          position: 'absolute',
          top: isLand ? E : insets.top + verticalScale(6),
          left: E + insets.left,
          right: E + insets.right,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
          zIndex: 3,
        },
        pill: {
          height: scale(26),
          borderRadius: AppRadius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        livePill: {
          backgroundColor: HC.danger,
          paddingHorizontal: scale(13),
          gap: scale(5),
        },
        waitPill: {
          backgroundColor: HC.endPill,
          paddingHorizontal: scale(10),
          gap: scale(6),
        },
        liveDot: {
          width: scale(10),
          height: scale(10),
          borderRadius: scale(5),
          backgroundColor: HC.white,
        },
        // Time is a pill like the others (readable on bright video + consistent spacing)
        timePill: {
          backgroundColor: HC.viewerPill,
          paddingHorizontal: scale(10),
        },
        timeText: { color: HC.white, fontVariant: ['tabular-nums'] },
        viewerPill: {
          backgroundColor: HC.viewerPill,
          paddingHorizontal: scale(8),
          gap: scale(3),
        },
        mutedPill: {
          width: scale(26),
          backgroundColor: HC.viewerPill,
        },
        spacer: { flex: 1 },
        endPill: {
          backgroundColor: HC.endPill,
          paddingHorizontal: scale(15),
        },
        white: { color: HC.white },

        hearts: {
          position: 'absolute',
          // Above the heart button (the middle of the 2 round buttons at the bottom right)
          right: scale(13 + 49 + 9 + 24),
          bottom:
            Math.max(verticalScale(4), insets.bottom - scale(21)) +
            verticalScale(8) +
            scale(49) +
            verticalScale(20),
          width: 1,
          height: 1,
          zIndex: 2,
        },
        moreBtn: {
          width: scale(49),
          height: scale(49),
          borderRadius: 999,
          backgroundColor: HC.circle,
          justifyContent: 'center',
          alignItems: 'center',
        },
        menuBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 4 },
        menuCard: {
          position: 'absolute',
          right: scale(13),
          bottom:
            Math.max(verticalScale(4), insets.bottom - scale(21)) +
            verticalScale(8) +
            scale(49) +
            verticalScale(10),
          backgroundColor: HC.menu,
          borderRadius: scale(12),
          paddingVertical: verticalScale(6),
          minWidth: scale(180),
        },
        menuItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(12),
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(11),
        },
      }),
    [
      insets.top,
      moderateScale,
      responsiveRadius,
      insets.bottom,
      insets.left,
      insets.right,
      scale,
      verticalScale,
      E,
      isLand,
    ],
  );

  return (
    <>
      <StatusBar hidden={false} barStyle="light-content" />
      {/* Keep the screen awake while live (unmount = normal sleep behavior) */}
      {isStreaming && <KeepAwake />}
      <View style={styles.container}>
        {!isStreaming && streamStatus !== 'creating' && (
          <View style={styles.header}>
            <AppText
              fontWeight="medium"
              fontSize={AppFontSize.subtitle}
              style={styles.headerTitle}
            >
              เริ่มไลฟ์
            </AppText>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.backBtn}
              hitSlop={8}
            >
              <Ionicons
                name="chevron-back"
                size={IS_TABLET ? 22 : 18}
                color={AppColors.white}
              />
            </TouchableOpacity>
          </View>
        )}

        {streamStatus === 'creating' ? (
          // Loading screen before going live: centered, works in portrait and landscape (16:9)
          <View style={styles.creatingOverlay}>
            <View style={styles.creatingSpinner}>
              <AppSpinner size="large" />
            </View>
            <AppText
              fontWeight="semiBold"
              fontSize={AppFontSize.subtitle}
              style={styles.creatingTitle}
            >
              กำลังเตรียมไลฟ์ของคุณ
            </AppText>
            <AppText fontSize={AppFontSize.caption} style={styles.creatingSub}>
              กำลังสร้างห้องไลฟ์และเชื่อมต่อเซิร์ฟเวอร์ อีกสักครู่
            </AppText>
            {/* Summary of the selection: live format + camera in use */}
            <View style={styles.creatingHint}>
              <Ionicons
                name={
                  landscape
                    ? 'phone-landscape-outline'
                    : 'phone-portrait-outline'
                }
                size={IS_TABLET ? 18 : 16}
                color={AppColors.primary}
              />
              <AppText
                fontSize={AppFontSize.caption}
                style={styles.creatingHintText}
              >
                {landscape ? 'ไลฟ์แนวนอน 16:9' : 'ไลฟ์แนวตั้ง 9:16'}
                {'  ·  '}
                {isFrontCamera ? 'กล้องหน้า' : 'กล้องหลัง'}
              </AppText>
            </View>
          </View>
        ) : !isStreaming ? (
          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Preview box: tap to open the camera fullscreen and check before going live */}
              <Pressable style={styles.preview} onPress={openCamCheck}>
                <LinearGradient
                  colors={['#121212', '#011616']}
                  locations={[0.1736, 0.8875]}
                  useAngle
                  angle={146.94}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons
                  name="camera-outline"
                  size={IS_TABLET ? 34 : 28}
                  color={SC.cam}
                />
                <View style={styles.previewBorder} pointerEvents="none" />
                <View
                  style={[styles.readyPill, !camChecked && styles.idlePill]}
                  pointerEvents="none"
                >
                  <View
                    style={[styles.readyDot, !camChecked && styles.idleDot]}
                  />
                  <AppText
                    fontSize={AppFontSize.caption}
                    style={camChecked ? styles.readyText : styles.idleText}
                  >
                    {camChecked ? 'พร้อมออกอากาศ' : 'ยังไม่ได้เช็คกล้อง'}
                  </AppText>
                </View>
                {/* Camera used for the live (tap to switch front/back) */}
                <TouchableOpacity
                  style={styles.camSidePill}
                  onPress={() => setIsFrontCamera(v => !v)}
                  hitSlop={8}
                >
                  <Ionicons
                    name="camera-reverse-outline"
                    size={IS_TABLET ? 16 : 14}
                    color={AppColors.white}
                  />
                  <AppText fontSize={AppFontSize.caption} style={styles.white}>
                    {isFrontCamera ? 'กล้องหน้า' : 'กล้องหลัง'}
                  </AppText>
                </TouchableOpacity>
                <AppText
                  fontSize={AppFontSize.caption}
                  style={styles.previewHint}
                >
                  {camChecked
                    ? 'แตะเพื่อเช็คกล้องอีกครั้ง'
                    : 'แตะเพื่อเปิดกล้อง เช็คความพร้อมก่อนเริ่ม'}
                </AppText>
              </Pressable>

              {/* Live cover */}
              <AppText fontSize={AppFontSize.subtitle} style={styles.label}>
                ปกไลฟ์
              </AppText>
              <View style={styles.coverRow}>
                {coverUri && (
                  <TouchableOpacity
                    style={styles.coverTile}
                    onPress={pickCover}
                    onLongPress={() => setCoverUri(null)}
                  >
                    <Image source={{ uri: coverUri }} style={styles.coverImg} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.addTile} onPress={pickCover}>
                  <Ionicons
                    name="add"
                    size={IS_TABLET ? 36 : 32}
                    color={SC.addIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <AppText fontSize={AppFontSize.subtitle} style={styles.label}>
                หัวข้อไลฟ์
              </AppText>
              <TextInput
                style={styles.field}
                value={title}
                onChangeText={setTitle}
                placeholder="ตั้งชื่อไลฟ์ เช่น สอนกีตาร์เบื้องต้น"
                placeholderTextColor={SC.placeholder}
                returnKeyType="next"
                maxLength={100}
              />

              {/* Description */}
              <AppText fontSize={AppFontSize.subtitle} style={styles.label}>
                คำบรรยาย
              </AppText>
              <TextInput
                style={[styles.field, styles.fieldMulti]}
                value={description}
                onChangeText={setDescription}
                placeholder="เล่าให้ผู้ชมรู้ว่าไลฟ์นี้มีอะไร (ไม่บังคับ)"
                placeholderTextColor={SC.placeholder2}
                multiline
              />

              {/* Who can watch */}
              <AppText fontSize={AppFontSize.subtitle} style={styles.label}>
                ใครดูได้บ้าง
              </AppText>
              <View style={styles.segRow}>
                {AUDIENCE_OPTIONS.map(o => {
                  const active = audience === o.key;
                  return (
                    <TouchableOpacity
                      key={o.key}
                      style={[styles.seg, active && styles.segActive]}
                      onPress={() => setAudience(o.key)}
                    >
                      <AppText
                        fontSize={AppFontSize.subtitle}
                        fontWeight={active ? 'medium' : 'regular'}
                        style={styles.white}
                      >
                        {o.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Live format */}
              <AppText fontSize={AppFontSize.subtitle} style={styles.label}>
                รูปแบบไลฟ์
              </AppText>
              <View style={styles.segRow}>
                {ORIENT_OPTIONS.map(o => {
                  const active = landscape === o.landscape;
                  return (
                    <TouchableOpacity
                      key={o.label}
                      style={[styles.seg, active && styles.segActive]}
                      onPress={() => setLandscape(o.landscape)}
                    >
                      <AppText
                        fontSize={AppFontSize.subtitle}
                        fontWeight={active ? 'medium' : 'regular'}
                        style={styles.white}
                      >
                        {o.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {landscape && (
                <AppText fontSize={AppFontSize.caption} style={styles.segHint}>
                  กดเริ่มไลฟ์แล้วจอจะหมุนเป็นแนวนอน ให้ถือมือถือแนวนอน
                </AppText>
              )}

              {/* Stream quality (existing option, same style as above) */}
              <AppText fontSize={AppFontSize.subtitle} style={styles.label}>
                คุณภาพการถ่ายทอด
              </AppText>
              <View style={styles.segRow}>
                {QUALITY_ORDER.map(q => {
                  const active = quality === q;
                  return (
                    <TouchableOpacity
                      key={q}
                      style={[styles.seg, active && styles.segActive]}
                      onPress={() => setQuality(q)}
                    >
                      <AppText
                        fontSize={AppFontSize.subtitle}
                        fontWeight={active ? 'medium' : 'regular'}
                        style={styles.white}
                      >
                        {STREAM_QUALITY_PRESETS[q].label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <AppText fontSize={AppFontSize.caption} style={styles.segHint}>
                {STREAM_QUALITY_PRESETS[quality].hint}
              </AppText>

              {/* Extra settings */}
              <View style={styles.card}>
                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <AppText
                      fontWeight="medium"
                      fontSize={AppFontSize.subtitle}
                      style={styles.white}
                    >
                      เปิดให้แชทได้
                    </AppText>
                    <AppText
                      fontSize={AppFontSize.caption}
                      style={styles.settingSub}
                    >
                      ผู้ชมพิมพ์คุยระหว่างไลฟ์
                    </AppText>
                  </View>
                  <DesignToggle value={chatEnabled} onChange={setChatEnabled} />
                </View>
                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <AppText
                      fontWeight="medium"
                      fontSize={AppFontSize.subtitle}
                      style={styles.white}
                    >
                      บันทึกไลฟ์อัตโนมัติ
                    </AppText>
                    <AppText
                      fontSize={AppFontSize.caption}
                      style={styles.settingSub}
                    >
                      ดูย้อนหลังได้หลังจบไลฟ์
                    </AppText>
                  </View>
                  <DesignToggle
                    value={recordEnabled}
                    onChange={setRecordEnabled}
                  />
                </View>
              </View>

              {/* Start live */}
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  !title.trim() && styles.startBtnDisabled,
                ]}
                onPress={handleStartStream}
                disabled={!title.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={AppColors.appButtonGradient}
                  locations={[0.0978, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <AppText
                  fontWeight="medium"
                  fontSize={AppFontSize.subtitle}
                  style={styles.white}
                >
                  เริ่มไลฟ์
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <GestureDetector gesture={liveGestures}>
            <View style={styles.previewContainer} collapsable={false}>
              <ApiVideoLiveStreamView
                ref={liveRef}
                style={StyleSheet.absoluteFill}
                camera={isFrontCamera ? 'front' : 'back'}
                isMuted={isMuted}
                enablePinchedZoom={false}
                zoomRatio={zoom}
                video={STREAM_QUALITY_PRESETS[quality].video}
                audio={{ bitrate: 128_000, sampleRate: 44100, isStereo: false }}
                onConnectionSuccess={() => {
                  connectedRef.current = true;
                  setStreamStatus('live');
                }}
                onConnectionFailed={code => {
                  connectedRef.current = false;
                  logError(
                    'Stream',
                    '[StreamPublisher] RTMP connect failed',
                    code,
                  );
                  setStreamStatus('error');
                }}
                onDisconnect={() => {
                  startedRef.current = false;
                  connectedRef.current = false;
                }}
              />

              {/* Top row: Live | time | viewers ... end live */}
              <View style={styles.topRow} pointerEvents="box-none">
                {streamStatus === 'live' ? (
                  <View style={[styles.pill, styles.livePill]}>
                    <View style={styles.liveDot} />
                    <AppText
                      fontSize={AppFontSize.caption}
                      style={styles.white}
                    >
                      Live
                    </AppText>
                  </View>
                ) : (
                  <View style={[styles.pill, styles.waitPill]}>
                    <AppSpinner size="small" color={HC.white} />
                    <AppText
                      fontSize={AppFontSize.caption}
                      style={styles.white}
                    >
                      {streamStatus === 'error'
                        ? 'กำลังเชื่อมต่อใหม่...'
                        : 'กำลังเชื่อมต่อ...'}
                    </AppText>
                  </View>
                )}
                <View style={[styles.pill, styles.timePill]}>
                  <AppText
                    fontSize={AppFontSize.caption}
                    style={styles.timeText}
                  >
                    {formatHms(duration)}
                  </AppText>
                </View>
                <View style={[styles.pill, styles.viewerPill]}>
                  <Ionicons
                    name="eye-outline"
                    size={IS_TABLET ? 16 : 13}
                    color={HC.white}
                  />
                  <AppText fontSize={AppFontSize.caption} style={styles.white}>
                    {viewerCount}
                  </AppText>
                </View>
                {isMuted && (
                  <View style={[styles.pill, styles.mutedPill]}>
                    <Ionicons
                      name="mic-off"
                      size={IS_TABLET ? 16 : 13}
                      color={HC.danger}
                    />
                  </View>
                )}
                <View style={styles.spacer} />
                <TouchableOpacity
                  style={[styles.pill, styles.endPill]}
                  onPress={handleStopStream}
                  hitSlop={8}
                >
                  <AppText fontSize={AppFontSize.caption} style={styles.white}>
                    จบไลฟ์
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Zoom level (shown while pinching) */}
              {zoomBadge && (
                <View style={styles.zoomBadge} pointerEvents="none">
                  <AppText
                    fontWeight="medium"
                    fontSize={AppFontSize.body}
                    style={styles.white}
                  >
                    {zoom.toFixed(1)}x
                  </AppText>
                </View>
              )}

              {/* Chat + input/heart/menu bar */}
              <View style={styles.chatOverlay} pointerEvents="box-none">
                <LiveChat
                  streamId={sessionId ?? undefined}
                  ephemeral
                  variant="host"
                  hidden={chatHidden}
                  onShowChat={() => setChatHidden(false)}
                  onLike={handleLike}
                  hostEdge={E}
                  bottomInset={
                    isLand
                      ? Math.max(E - verticalScale(8), 0)
                      : Math.max(verticalScale(4), insets.bottom - scale(21))
                  }
                  extraAction={
                    <TouchableOpacity
                      style={styles.moreBtn}
                      onPress={() => setMenuOpen(true)}
                      hitSlop={4}
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={IS_TABLET ? 24 : 20}
                        color={HC.icon}
                      />
                    </TouchableOpacity>
                  }
                />
              </View>

              <View style={styles.hearts} pointerEvents="none">
                {hearts.map(id => (
                  <FloatingHeart key={id} onDone={() => removeHeart(id)} />
                ))}
              </View>

              {/* More menu: flip camera / mute-unmute mic */}
              {menuOpen && (
                <Pressable
                  style={styles.menuBackdrop}
                  onPress={() => setMenuOpen(false)}
                >
                  <Pressable style={styles.menuCard} onPress={() => {}}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setIsFrontCamera(v => !v);
                        setMenuOpen(false);
                      }}
                    >
                      <Ionicons
                        name="camera-reverse-outline"
                        size={IS_TABLET ? 24 : 20}
                        color={HC.white}
                      />
                      <AppText fontSize={AppFontSize.body} style={styles.white}>
                        กลับกล้อง
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setIsMuted(v => !v);
                        setMenuOpen(false);
                      }}
                    >
                      <Ionicons
                        name={isMuted ? 'mic-off' : 'mic-outline'}
                        size={IS_TABLET ? 24 : 20}
                        color={isMuted ? HC.danger : HC.white}
                      />
                      <AppText fontSize={AppFontSize.body} style={styles.white}>
                        {isMuted ? 'เปิดไมค์' : 'ปิดไมค์'}
                      </AppText>
                    </TouchableOpacity>
                  </Pressable>
                </Pressable>
              )}
            </View>
          </GestureDetector>
        )}
        {/* Fullscreen camera check (not broadcasting) */}
        {camCheck && !isStreaming && (
          <View style={styles.camFull}>
            <ApiVideoLiveStreamView
              style={StyleSheet.absoluteFill}
              camera={isFrontCamera ? 'front' : 'back'}
              isMuted
              enablePinchedZoom={!isFrontCamera}
              video={STREAM_QUALITY_PRESETS[quality].video}
            />
            <View style={styles.camTop}>
              <TouchableOpacity
                style={styles.camBtn}
                onPress={closeCamCheck}
                hitSlop={8}
              >
                <Ionicons
                  name="close"
                  size={IS_TABLET ? 24 : 20}
                  color={AppColors.white}
                />
              </TouchableOpacity>
              <View style={styles.readyPill2}>
                <View style={styles.readyDot} />
                <AppText
                  fontSize={AppFontSize.caption}
                  style={styles.readyText}
                >
                  พร้อมออกอากาศ · {landscape ? 'แนวนอน 16:9' : 'แนวตั้ง 9:16'}
                </AppText>
              </View>
              <View style={styles.spacer} />
              <TouchableOpacity
                style={styles.camBtn}
                onPress={() => setIsFrontCamera(v => !v)}
                hitSlop={8}
              >
                <Ionicons
                  name="camera-reverse-outline"
                  size={IS_TABLET ? 24 : 20}
                  color={AppColors.white}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.camBottom}>
              <AppText
                fontSize={AppFontSize.caption}
                style={[styles.white, styles.previewHintOn]}
              >
                {isFrontCamera
                  ? 'ตั้งมือถือให้นิ่งก่อนเริ่ม'
                  : 'ถ่างนิ้วเพื่อซูม · ตั้งมือถือให้นิ่งก่อนเริ่ม'}
              </AppText>
              <TouchableOpacity style={styles.camDone} onPress={closeCamCheck}>
                <AppText
                  fontWeight="medium"
                  fontSize={AppFontSize.subtitle}
                  style={styles.white}
                >
                  เรียบร้อย
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </>
  );
};

const StreamPublisher = ({ visible, onClose }: StreamPublisherProps) => {
  const closeRef = useRef<() => void>(onClose);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      supportedOrientations={['portrait', 'landscape']}
      statusBarTranslucent
      onRequestClose={() => closeRef.current()}
    >
      {/* Modal = new root: Android needs its own GestureHandlerRootView */}
      <GestureHandlerRootView style={outerStyles.gestureRoot}>
        <SafeAreaProvider>
          <StreamPublisherContent onClose={onClose} closeRef={closeRef} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Modal>
  );
};

const outerStyles = StyleSheet.create({ gestureRoot: { flex: 1 } });

export default StreamPublisher;
