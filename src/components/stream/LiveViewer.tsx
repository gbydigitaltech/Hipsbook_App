import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AppSpinner from '../loading/AppSpinner';
import Orientation from 'react-native-orientation-locker';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { IS_TABLET } from '../../constants/platform';
import { log, logWarn } from '../../helpers/logger';
import { useResponsive } from '../../helpers/responsive';
import { AppColors, LIVE_HEART_COLORS } from '../../styles/colors';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';
import Player from '../videos/Player';
import useLiveLikes from '../../hooks/chat/useLiveLikes';
import LiveChat from './LiveChat';
import liveStreamService from './liveStreamService';
import { getHlsUrl, normalizeHlsPlaybackUrl } from './streamConfig';

// Square app icon (appLogo.png is a wide text logo; cropped into a circle it shows only white)
const APP_ICON = require('../../assets/images/iconFull.png');

/* Figma design colors, mapped to the app theme (AppColors) */
const C = {
  bg: AppColors.black,
  danger: AppColors.danger,
  primary: AppColors.primary,
  white: AppColors.white,
  chip: AppColors.chip,
  panel: AppColors.secondary,
  playCircle: AppColors.mediaButton,
  track: AppColors.mediaTrack,
  menu: AppColors.sheet,
  muted: AppColors.textSecondary,
  grabber: AppColors.textTertiary,
};

type LiveViewerProps = {
  visible: boolean;
  onClose: () => void;
  streamId?: string;
  streamKey?: string;
  title?: string;
};

const CONTROLS_HIDE_MS = 3000;

const formatElapsed = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(t / 3600)).padStart(2, '0');
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const sec = String(t % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
};

/** TikTok-style floating heart (notifies when its animation ends so it can be removed) */
const FloatingHeart = ({ onDone }: { onDone: () => void }) => {
  const v = useRef(new Animated.Value(0)).current;
  const drift = useRef((Math.random() - 0.5) * 50).current;
  // Random color/size/tilt to feel lively (same style as the host screen)
  const look = useRef({
    color: LIVE_HEART_COLORS[Math.floor(Math.random() * 5)],
    size: 22 + Math.round(Math.random() * 12),
    tilt: Math.random() < 0.5 ? '-15deg' : '15deg',
  }).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: true,
    }).start(onDone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
    transform: [
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -200],
        }),
      },
      {
        translateX: v.interpolate({
          inputRange: [0, 1],
          outputRange: [0, drift],
        }),
      },
      { rotate: look.tilt },
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
      <Ionicons name="heart" size={look.size} color={look.color} />
    </Animated.View>
  );
};

const LiveViewerContent = ({
  visible,
  onClose,
  streamId,
  streamKey,
  title: initialTitle,
  closeRef,
}: LiveViewerProps & { closeRef: React.MutableRefObject<() => void> }) => {
  // Uses the Modal's own SafeAreaProvider -> insets update on rotation
  // iOS landscape: keep clear of the Dynamic Island/notch so buttons and chat aren't covered
  const insets = useSafeAreaInsets();
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const [hasError, setHasError] = useState(false);
  const [hlsUrl, setHlsUrl] = useState('');
  const [title, setTitle] = useState(initialTitle ?? '');
  const [description, setDescription] = useState('');
  const [hostLogo, setHostLogo] = useState<string | null>(null);
  const [hostName, setHostName] = useState('');
  const [chips, setChips] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [viewerCount, setViewerCount] = useState(0);
  const [away, setAway] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatKeyboardOpen, setChatKeyboardOpen] = useState(false);

  // Fullscreen: swipe to hide/show the chat panel
  const { width: winW, height: winH } = useWindowDimensions();
  const [fsArea, setFsArea] = useState({ w: 0, h: 0 });
  // Width of the right-side chat panel in fullscreen (~43% of the landscape width, like YouTube)
  const panelW = Math.round(Math.max(winW, winH) * 0.435);
  const chatX = useRef(new Animated.Value(0)).current;
  const swipePan = useMemo(
    () =>
      PanResponder.create({
        // Only capture clear one-finger horizontal swipes (button taps and vertical chat scrolling still work)
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          g.numberActiveTouches === 1 &&
          Math.abs(g.dx) > 20 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_e, g) => {
          // Chat is on the right (YouTube-style): swipe right = push chat out, swipe left = bring it back
          if (g.dx > 40 || g.vx > 0.5) setShowChat(false);
          else if (g.dx < -40 || g.vx < -0.5) setShowChat(true);
        },
      }),
    [],
  );
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);

  // Quality: null = auto
  const [qualities, setQualities] = useState<number[]>([]);
  const [quality, setQuality] = useState<number | null>(null);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);

  // Controls: tap the video to show/hide, auto-hide after 3s
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(
      () => setControlsVisible(false),
      CONTROLS_HIDE_MS,
    );
  }, []);
  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);
  const toggleControls = useCallback(() => {
    if (controlsVisible) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setControlsVisible(false);
    } else {
      showControls();
    }
  }, [controlsVisible, showControls]);
  useEffect(() => {
    if (!visible) return;
    showControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [visible, showControls]);
  useEffect(() => {
    if (qualityMenuOpen && hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
  }, [qualityMenuOpen]);

  // Custom fullscreen -> chat and buttons can still float over the video
  useEffect(() => {
    if (!visible) return;
    if (isFullscreen) Orientation.lockToLandscape();
    else Orientation.lockToPortrait();
  }, [visible, isFullscreen]);
  useEffect(() => () => Orientation.lockToPortrait(), []);

  // Elapsed live time clock
  useEffect(() => {
    if (!visible || !startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [visible, startedAt]);

  useEffect(() => {
    if (!visible) return;

    if (streamId) {
      (async () => {
        try {
          const data = await liveStreamService.getById(streamId);
          setTitle(data.title);
          setDescription(data.description ?? '');
          setHostLogo(data.logoUrl ?? null);
          setHostName(data.hostName ?? '');
          setViewerCount(data.currentViewers ?? 0);
          const tagList = (data.tags ?? '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);
          setChips(
            [data.category?.trim(), ...tagList].filter(Boolean) as string[],
          );
          const ts = data.createdAt ? Date.parse(data.createdAt) : NaN;
          setStartedAt(Number.isFinite(ts) ? ts : null);

          const playback = await liveStreamService.getPlayback(streamId);
          let url = normalizeHlsPlaybackUrl(playback.hlsUrl);
          if (!url && data.streamKey?.trim()) {
            url = normalizeHlsPlaybackUrl(getHlsUrl(data.streamKey.trim()));
          }
          if (url) log('Stream', '[LiveViewer] HLS:', url);
          setHlsUrl(url);
        } catch {
          if (streamKey) {
            setHlsUrl(normalizeHlsPlaybackUrl(getHlsUrl(streamKey)));
          }
        }
      })();
    } else if (streamKey) {
      setHlsUrl(normalizeHlsPlaybackUrl(getHlsUrl(streamKey)));
    }
  }, [visible, streamId, streamKey]);

  useEffect(() => {
    if (!visible || !streamId) return;
    const timer = setInterval(async () => {
      try {
        const h = await liveStreamService.getHealth(streamId);
        setViewerCount(h.currentViewers ?? h.CurrentViewers ?? 0);
      } catch {}
    }, 10000);
    return () => clearInterval(timer);
  }, [visible, streamId]);

  const handleError = () => {
    logWarn('Stream', '[LiveViewer] Video error');
    setHasError(true);
  };

  const handleChatKeyboardChange = useCallback(
    (open: boolean) => setChatKeyboardOpen(open),
    [],
  );
  useEffect(() => {
    Animated.timing(chatX, {
      toValue: isFullscreen && !showChat ? panelW + 20 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [chatX, isFullscreen, showChat, panelW]);

  // Portrait: chat is a sheet over the info area below the video, toggled from the player's chat button
  const chatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(chatY, {
      toValue: !isFullscreen && !showChat ? Math.max(winW, winH) : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [chatY, isFullscreen, showChat, winW, winH]);
  // Drag the sheet header down to close
  const sheetPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          if (g.dy > 0) chatY.setValue(g.dy);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > 80 || g.vy > 0.8) setShowChat(false);
          else
            Animated.spring(chatY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
        },
      }),
    [chatY],
  );

  const spawnHeart = useCallback(() => {
    setHearts(prev => [...prev.slice(-12), Date.now() + Math.random()]);
  }, []);
  // Hearts from others (realtime): float up one by one instead of all at once
  const { sendLike } = useLiveLikes(streamId, n => {
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

  const handleClose = () => {
    Keyboard.dismiss();
    setChatKeyboardOpen(false);
    setHasError(false);
    setAway(false);
    setIsFullscreen(false);
    setShowChat(true);
    setQualityMenuOpen(false);
    setQuality(null);
    setQualities([]);
    setPaused(false);
    setMuted(false);
    setHearts([]);
    Orientation.lockToPortrait();
    setHlsUrl('');
    setTitle(initialTitle ?? '');
    setDescription('');
    setHostLogo(null);
    setHostName('');
    setChips([]);
    setStartedAt(null);
    setViewerCount(0);
    onClose();
  };

  const qualityLabel = quality ? `${quality}p` : 'อัตโนมัติ';
  const ic = (n: number) => (IS_TABLET ? n + 4 : n);
  // Video control icons: bigger in fullscreen, easier to tap in landscape
  // Portrait +20% / fullscreen +35% of the base size
  const cs = (n: number) => Math.round(ic(n) * (isFullscreen ? 1.35 : 1.2));
  // Fullscreen edge spacing: equal on all sides + clear of the Dynamic Island/notch/Home bar
  // Right side: when the chat panel is open the video doesn't touch the screen edge -> no right inset
  const fsEdge = scale(20);
  // Distance of the bottom control bar from the video edge (same left/right/bottom)
  const barGap = scale(isFullscreen ? 16 : 10);
  const barPad = scale(isFullscreen ? 12 : 9);
  // The 16:9 picture is centered in its box -> black bars left/right (offsetX); space from the real picture edge
  const areaPadL = isFullscreen && showChat ? insets.left : 0;
  const contentW = fsArea.w
    ? Math.min(fsArea.w - areaPadL, (fsArea.h * 16) / 9)
    : 0;
  const offsetX = fsArea.w ? (fsArea.w - areaPadL - contentW) / 2 : 0;
  // Bar left/right = picture edge + gap (never less than the Dynamic Island inset)
  const safeL = isFullscreen ? insets.left : 0;
  const safeR = isFullscreen && !showChat ? insets.right : 0;
  const barLeft = Math.max(areaPadL + offsetX, safeL) + barGap;
  const barRight = Math.max(offsetX, safeR) + barGap;
  const fsLeft = Math.max(areaPadL + offsetX, safeL) + fsEdge;
  const fsRight = Math.max(offsetX, safeR) + fsEdge;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: C.bg },
        body: { flex: 1 },
        white: { color: C.white },
        // Subtle shadow instead of a black bar: icons/text stay readable on bright video
        shadow: {
          textShadowColor: 'rgba(0,0,0,0.85)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        },
        // Button group inside the bar (the background is on the bar itself)
        ctrlPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(isFullscreen ? 20 : 16),
        },
        // Translucent round button (chevron-down in fullscreen)
        ctrlCircle: {
          width: scale(40),
          height: scale(40),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.mediaScrim,
          justifyContent: 'center',
          alignItems: 'center',
        },
        danger: { color: C.danger },

        /* ---- Video ---- */
        videoArea: {
          width: '100%',
          aspectRatio: 393 / 210,
          marginTop: insets.top + verticalScale(8),
          backgroundColor: C.bg,
          overflow: 'hidden',
        },
        // Fullscreen: pin to all 4 edges of the container (don't rely on aspectRatio/screen size that may be stale from portrait)
        videoAreaFullscreen: {
          position: 'absolute',
          top: 0,
          left: 0,
          // Chat open: video shrinks to the left so the chat doesn't cover it (YouTube-style)
          right: showChat ? panelW + scale(4) : 0,
          bottom: 0,
          // Chat open: keep clear of the Dynamic Island, video sits next to the chat panel
          paddingLeft: showChat ? insets.left : 0,
          backgroundColor: C.bg,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        },
        playerBox: { width: '100%', height: '100%' },
        tapLayer: { ...StyleSheet.absoluteFillObject },

        livePill: {
          position: 'absolute',
          left: scale(14) + (isFullscreen ? insets.left : 0),
          top: verticalScale(12),
          height: scale(26),
          paddingHorizontal: scale(13),
          borderRadius: AppRadius.pill,
          backgroundColor: C.danger,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(5),
        },
        liveDot: {
          width: scale(10),
          height: scale(10),
          borderRadius: scale(5),
          backgroundColor: C.white,
        },
        closeBtn: {
          position: 'absolute',
          right: scale(12),
          top: verticalScale(12),
          width: scale(30),
          height: scale(30),
          borderRadius: scale(15),
          backgroundColor: AppColors.mediaScrim,
          justifyContent: 'center',
          alignItems: 'center',
        },
        centerPlay: {
          position: 'absolute',
          alignSelf: 'center',
          top: '50%',
          width: scale(isFullscreen ? 68 : 58),
          height: scale(isFullscreen ? 68 : 58),
          marginTop: -scale(isFullscreen ? 68 : 58) / 2,
          borderRadius: 999,
          backgroundColor: AppColors.mediaScrim,
          borderWidth: 1,
          borderColor: AppColors.surfaceStrong,
          justifyContent: 'center',
          alignItems: 'center',
        },

        topBar: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: verticalScale(64),
          marginTop: verticalScale(6),
          paddingLeft: fsLeft,
          paddingRight: fsRight,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(12),
        },
        topTitle: { flex: 1, color: C.white },
        fsChatBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          height: scale(36),
          paddingHorizontal: scale(14),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.mediaScrim,
        },
        fsChatBtnOn: { backgroundColor: C.primary },
        fsLive: {
          height: scale(26),
          paddingHorizontal: scale(13),
          borderRadius: AppRadius.pill,
          backgroundColor: C.danger,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(5),
        },

        // Control bar is a full-width capsule on a translucent dark background (readable on bright video)
        bottomBar: {
          position: 'absolute',
          // Gap from the video edge: left = right = bottom (barGap)
          // Fullscreen: add the Dynamic Island/Home bar inset only on the sides that need it
          left: barLeft,
          right: barRight,
          // Fullscreen: smaller bottom gap so the bar sits lower (the landscape Home bar is short)
          bottom: isFullscreen ? scale(8) : barGap,
          // Inner padding: equal on all sides (buttons are the same distance from the bar edge)
          paddingVertical: barPad,
          // Fullscreen: more horizontal padding so the first/last buttons aren't near the rounded ends
          paddingHorizontal: isFullscreen ? scale(26) : barPad,
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.mediaScrim,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(isFullscreen ? 18 : 14),
        },
        trackWrap: {
          flex: 1,
          height: scale(12),
          justifyContent: 'center',
          marginHorizontal: scale(4),
        },
        track: {
          height: isFullscreen ? 4 : 3.5,
          borderRadius: 3,
          backgroundColor: AppColors.mediaTrack,
          overflow: 'visible',
        },
        trackFill: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: 3,
          backgroundColor: C.primary,
        },
        knob: {
          position: 'absolute',
          right: isFullscreen ? -6 : -4,
          top: isFullscreen ? -4 : -2.5,
          width: isFullscreen ? 12 : 8,
          height: isFullscreen ? 12 : 8,
          borderRadius: 6,
          backgroundColor: C.primary,
        },
        barBtn: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },

        /* Quality menu */
        menuBackdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: AppColors.scrim,
          justifyContent: 'center',
          alignItems: 'center',
        },
        menuCard: {
          backgroundColor: C.menu,
          borderRadius: scale(12),
          paddingVertical: verticalScale(6),
          minWidth: scale(180),
        },
        menuTitle: {
          color: C.muted,
          paddingHorizontal: scale(18),
          paddingVertical: verticalScale(8),
        },
        menuItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: scale(18),
          paddingVertical: verticalScale(11),
        },

        brbOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: AppColors.scrimStrong,
          justifyContent: 'center',
          alignItems: 'center',
          gap: verticalScale(8),
          paddingHorizontal: scale(32),
        },
        brbSub: { color: C.muted, textAlign: 'center' },
        center: { textAlign: 'center' },

        /* ---- Live info below the video ---- */
        // Chat moved to a sheet -> live info can use the full area below the video
        infoScroll: { flex: 1 },
        info: {
          paddingHorizontal: scale(15),
          paddingTop: verticalScale(21),
          paddingBottom: verticalScale(4),
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: verticalScale(6),
        },
        metaGroup: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(4),
        },
        metaGap: { width: scale(18) },
        hostRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginTop: verticalScale(9),
          gap: scale(9),
        },
        hostAvatarWrap: { width: scale(40), height: scale(48) },
        hostAvatar: {
          width: scale(40),
          height: scale(40),
          borderRadius: scale(20),
          borderWidth: 2,
          borderColor: C.danger,
          backgroundColor: AppColors.sheet,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        },
        hostImgFull: { width: '100%', height: '100%' },
        hostImgIcon: { width: '78%', height: '78%' },
        miniLive: {
          position: 'absolute',
          alignSelf: 'center',
          top: scale(32),
          width: scale(30),
          height: scale(16),
          borderRadius: AppRadius.pill,
          backgroundColor: C.danger,
          justifyContent: 'center',
          alignItems: 'center',
        },
        // No chip -> name is vertically centered with the logo
        hostCol: {
          flex: 1,
          gap: verticalScale(3),
          minHeight: scale(40),
          justifyContent: 'center',
        },
        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(9) },
        chip: {
          height: scale(20),
          paddingHorizontal: scale(10),
          borderRadius: AppRadius.pill,
          backgroundColor: C.chip,
          justifyContent: 'center',
        },
        desc: { marginTop: verticalScale(10), color: C.white },

        /* ---- Chat box ---- */
        // Portrait: chat sheet floats over the info area, from below the video to the bottom of the screen
        chatPanel: {
          position: 'absolute',
          left: 0,
          right: 0,
          top:
            insets.top +
            verticalScale(8) +
            (Math.min(winW, winH) * 210) / 393 +
            verticalScale(8),
          bottom: 0,
          // Same bottom-sheet style as the rest of the app (e.g. ClassroomCommentsSheet)
          backgroundColor: AppColors.sheet,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: AppColors.border,
          borderTopLeftRadius: responsiveRadius(AppRadius.sheet),
          borderTopRightRadius: responsiveRadius(AppRadius.sheet),
          overflow: 'hidden',
        },
        chatHeader: {
          paddingHorizontal: scale(18),
          paddingTop: verticalScale(10),
          paddingBottom: verticalScale(14),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: AppColors.border,
        },
        grabber: {
          alignSelf: 'center',
          width: scale(44),
          height: verticalScale(5),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.surfaceStrong,
          marginBottom: verticalScale(14),
        },
        sheetHeadRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
        },
        sheetLive: {
          height: scale(20),
          paddingHorizontal: scale(8),
          borderRadius: AppRadius.pill,
          backgroundColor: C.danger,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(4),
        },
        sheetLiveDot: {
          width: scale(6),
          height: scale(6),
          borderRadius: scale(3),
          backgroundColor: C.white,
        },
        sheetViewers: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(4),
          marginRight: scale(6),
        },
        sheetClose: {
          marginLeft: scale(4),
          justifyContent: 'center',
          alignItems: 'center',
        },
        sheetSub: { color: AppColors.textSecondary },
        primaryText: { color: C.primary },
        flex1: { flex: 1 },
        // Title like AppSectionHeader: primary-color bar before the text
        titleRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
        accentBar: {
          width: scale(3),
          height: scale(16),
          borderRadius: scale(2),
          backgroundColor: C.primary,
        },
        // Live chat panel on the right (YouTube-style)
        // Fullscreen chat panel: floating card, rounded corners, thin border, spaced from edges/Dynamic Island
        chatFullscreen: {
          position: 'absolute',
          top: verticalScale(8) + insets.top,
          right: scale(8) + insets.right,
          bottom: verticalScale(8) + Math.max(insets.bottom - 8, 0),
          width: panelW - scale(8) - insets.right,
          backgroundColor: AppColors.sheet,
          borderRadius: scale(16),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.borderStrong,
          overflow: 'hidden',
        },
        sideHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: scale(16),
          paddingRight: scale(10),
          paddingTop: verticalScale(12),
          paddingBottom: verticalScale(10),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: AppColors.borderStrong,
          gap: scale(10),
        },
        sideTitleCol: { flex: 1, gap: verticalScale(4) },
        sideSubRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
        },
        sideLive: {
          height: scale(18),
          paddingHorizontal: scale(7),
          borderRadius: AppRadius.pill,
          backgroundColor: C.danger,
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(4),
        },
        sideLiveDot: {
          width: scale(5),
          height: scale(5),
          borderRadius: scale(3),
          backgroundColor: C.white,
        },
        sideViewers: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(3),
        },
        sideSub: { color: AppColors.textSecondary },
        sideClose: {
          width: scale(32),
          height: scale(32),
          borderRadius: scale(16),
          backgroundColor: AppColors.surface,
          justifyContent: 'center',
          alignItems: 'center',
        },

        hearts: {
          position: 'absolute',
          right:
            scale(28) + (isFullscreen ? (showChat ? panelW : insets.right) : 0),
          bottom: insets.bottom + verticalScale(70),
          width: 1,
          height: 1,
        },

        centerBox: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: scale(40),
          gap: verticalScale(12),
        },
        retryBtn: {
          marginTop: verticalScale(4),
          paddingVertical: verticalScale(10),
          paddingHorizontal: scale(24),
          backgroundColor: C.danger,
          borderRadius: AppRadius.pill,
        },
      }),
    [
      insets.top,
      insets.bottom,
      insets.left,
      insets.right,
      scale,
      verticalScale,
      responsiveRadius,
      isFullscreen,
      showChat,
      panelW,
      winW,
      winH,
      fsLeft,
      fsRight,
      barLeft,
      barRight,
      barGap,
      barPad,
    ],
  );

  const liveLabel = (
    <>
      <View style={styles.liveDot} />
      <AppText fontSize={AppFontSize.caption} style={styles.white}>
        Live
      </AppText>
    </>
  );

  // Fullscreen video box: largest 16:9 that fits the measured area (onLayout), centered
  const fsBox = useMemo(() => {
    const { h } = fsArea;
    const w = fsArea.w - (showChat ? insets.left : 0);
    if (!w || !h) return { width: '100%' as const, height: '100%' as const };
    const width = Math.min(w, (h * 16) / 9);
    return { width, height: (width * 9) / 16 };
  }, [fsArea, showChat, insets.left]);

  const renderVideo = () => (
    <View
      // Fullscreen uses its own style (if merged with videoArea, the old width 100%/aspectRatio wins
      // and the video doesn't shrink when chat opens)
      style={isFullscreen ? styles.videoAreaFullscreen : styles.videoArea}
      onLayout={e => {
        const { width, height, x } = e.nativeEvent.layout;
        if (isFullscreen) {
          log(
            'Stream',
            `[LiveViewer] fullscreen area ${Math.round(width)}x${Math.round(
              height,
            )} x=${Math.round(x)} window=${Math.round(winW)}x${Math.round(
              winH,
            )}`,
          );
        }
        // Measured in every mode: used to find the real picture edges so the controls are spaced from the picture, not the box
        setFsArea({ w: width, h: height });
      }}
    >
      <View style={isFullscreen ? fsBox : styles.playerBox}>
        <Player
          sourceUrl={hlsUrl}
          isLive
          paused={paused}
          muted={muted}
          onError={handleError}
          onStalled={setAway}
          quality={quality}
          onQualities={setQualities}
        />
      </View>

      <Pressable style={styles.tapLayer} onPress={toggleControls} />

      {away && (
        <View style={styles.brbOverlay} pointerEvents="none">
          <Ionicons
            name="cafe"
            size={cs(52)}
            color={C.white}
            style={styles.shadow}
          />
          <AppText
            fontWeight="medium"
            fontSize={AppFontSize.subtitle}
            style={[styles.white, styles.center]}
          >
            โฮสต์ไม่อยู่แป๊บนึง
          </AppText>
          <AppText fontSize={AppFontSize.caption} style={styles.brbSub}>
            เดี๋ยวกลับมา ไม่ต้องปิดหนีนะ 💜
          </AppText>
        </View>
      )}

      {/* Top left: Live | top right: close (portrait) */}
      {!isFullscreen && (
        <>
          <View style={styles.livePill} pointerEvents="none">
            {liveLabel}
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={8}
          >
            <Ionicons
              name="close"
              size={cs(18)}
              color={C.white}
              style={styles.shadow}
            />
          </TouchableOpacity>
        </>
      )}

      {controlsVisible && isFullscreen && (
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setIsFullscreen(false)}
            hitSlop={10}
            style={styles.ctrlCircle}
          >
            <Ionicons
              name="chevron-down"
              size={cs(24)}
              color={C.white}
              style={styles.shadow}
            />
          </TouchableOpacity>
          <View style={styles.fsLive}>{liveLabel}</View>
          <AppText
            fontWeight="medium"
            fontSize={AppFontSize.subtitle}
            numberOfLines={1}
            style={[styles.topTitle, styles.shadow]}
          >
            {title}
          </AppText>
          {/* Top right: open/close chat (easy thumb reach in landscape) */}
          <TouchableOpacity
            onPress={() => {
              setShowChat(v => !v);
              showControls();
            }}
            hitSlop={12}
            style={[styles.fsChatBtn, showChat && styles.fsChatBtnOn]}
          >
            <Ionicons
              name={
                showChat ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'
              }
              size={cs(18)}
              color={C.white}
            />
            <AppText
              fontSize={AppFontSize.body}
              fontWeight="medium"
              style={styles.white}
            >
              แชท
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Center play button */}
      {(controlsVisible || paused) && (
        <TouchableOpacity
          style={styles.centerPlay}
          onPress={() => {
            setPaused(p => !p);
            showControls();
          }}
        >
          <Ionicons
            name={paused ? 'play' : 'pause'}
            size={cs(25)}
            color={C.white}
            style={styles.shadow}
          />
        </TouchableOpacity>
      )}

      {/* Bottom control bar */}
      {controlsVisible && (
        <View style={styles.bottomBar}>
          {/* Left group: play/mute */}
          <View style={styles.ctrlPill}>
            <TouchableOpacity
              onPress={() => {
                setPaused(p => !p);
                showControls();
              }}
              hitSlop={8}
            >
              <Ionicons
                name={paused ? 'play' : 'pause'}
                size={cs(18)}
                color={C.white}
                style={styles.shadow}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMuted(m => !m);
                showControls();
              }}
              hitSlop={8}
            >
              <Ionicons
                name={muted ? 'volume-mute' : 'volume-low'}
                size={cs(16)}
                color={C.white}
                style={styles.shadow}
              />
            </TouchableOpacity>
          </View>

          {/* Live: always at the live edge */}
          <View style={styles.trackWrap}>
            <View style={styles.track}>
              <View style={styles.trackFill} />
              <View style={styles.knob} />
            </View>
          </View>

          {/* Right group: chat/quality/fullscreen */}
          <View style={styles.ctrlPill}>
            {/* Chat button (portrait): open/close the chat sheet | in fullscreen it moves to the top right */}
            {!isFullscreen && (
              <TouchableOpacity
                onPress={() => {
                  setShowChat(v => !v);
                  showControls();
                }}
                hitSlop={8}
              >
                <Ionicons
                  name={showChat ? 'chatbubble-ellipses' : 'chatbubble-outline'}
                  size={cs(18)}
                  color={C.white}
                  style={styles.shadow}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setQualityMenuOpen(true)}
              hitSlop={8}
              style={styles.barBtn}
            >
              <Ionicons
                name="settings-outline"
                size={cs(17)}
                color={C.white}
                style={styles.shadow}
              />
              <AppText
                fontSize={isFullscreen ? 15 : 13}
                style={[styles.white, styles.shadow]}
              >
                {qualityLabel}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsFullscreen(v => !v);
                showControls();
              }}
              hitSlop={8}
            >
              <Ionicons
                name={isFullscreen ? 'contract' : 'expand'}
                size={cs(18)}
                color={C.white}
                style={styles.shadow}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {qualityMenuOpen && (
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => {
            setQualityMenuOpen(false);
            scheduleHide();
          }}
        >
          <Pressable style={styles.menuCard} onPress={() => {}}>
            <AppText fontSize={AppFontSize.caption} style={styles.menuTitle}>
              ความละเอียด
            </AppText>
            {[null, ...qualities].map(q => {
              const active = quality === q;
              return (
                <TouchableOpacity
                  key={q ?? 'auto'}
                  style={styles.menuItem}
                  onPress={() => {
                    setQuality(q);
                    setQualityMenuOpen(false);
                    scheduleHide();
                  }}
                >
                  <AppText
                    fontSize={AppFontSize.subtitle}
                    fontWeight={active ? 'medium' : 'regular'}
                    style={active ? styles.primaryText : styles.white}
                  >
                    {q ? `${q}p` : 'อัตโนมัติ'}
                  </AppText>
                  {active && (
                    <Ionicons name="checkmark" size={18} color={C.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      )}
    </View>
  );

  const renderInfo = () => (
    // Long content scrolls inside this box so the chat isn't squeezed
    <ScrollView
      style={styles.infoScroll}
      contentContainerStyle={styles.info}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      bounces={false}
    >
      {title ? (
        <AppText
          fontWeight="medium"
          fontSize={AppFontSize.subtitle}
          numberOfLines={2}
          style={styles.white}
        >
          {title}
        </AppText>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaGroup}>
          <Ionicons name="people" size={ic(15)} color={C.danger} />
          <AppText fontSize={AppFontSize.caption} style={styles.danger}>
            {viewerCount}
          </AppText>
        </View>
        {startedAt ? (
          <>
            <View style={styles.metaGap} />
            <AppText fontSize={AppFontSize.caption} style={styles.white}>
              {formatElapsed(now - startedAt)}
            </AppText>
          </>
        ) : null}
      </View>

      <View style={styles.hostRow}>
        <View style={styles.hostAvatarWrap}>
          <View style={styles.hostAvatar}>
            <Image
              source={hostLogo ? { uri: hostLogo } : APP_ICON}
              style={hostLogo ? styles.hostImgFull : styles.hostImgIcon}
              resizeMode={hostLogo ? 'cover' : 'contain'}
              // API image failed to load -> fall back to the app icon
              onError={() => setHostLogo(null)}
            />
          </View>
          <View style={styles.miniLive}>
            <AppText fontSize={8} style={styles.white}>
              Live
            </AppText>
          </View>
        </View>
        <View style={styles.hostCol}>
          <AppText fontSize={AppFontSize.subtitle} style={styles.white}>
            {hostName || 'HIPSBOOK'}
          </AppText>
          {chips.length > 0 && (
            <View style={styles.chipRow}>
              {chips.map(c => (
                <View key={c} style={styles.chip}>
                  <AppText fontSize={AppFontSize.caption} style={styles.white}>
                    {c}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {description ? (
        <AppText fontSize={AppFontSize.caption} style={styles.desc}>
          {description}
        </AppText>
      ) : null}
    </ScrollView>
  );

  useEffect(() => {
    closeRef.current = handleClose;
  });

  return (
    <>
      <StatusBar hidden={isFullscreen} barStyle="light-content" />
      <View style={styles.container}>
        {hasError ? (
          <View style={styles.centerBox}>
            <Ionicons name="cloud-offline" size={ic(60)} color={C.muted} />
            <AppText
              fontSize={AppFontSize.subtitle}
              style={[styles.white, styles.center]}
            >
              ไม่สามารถโหลด Live ได้
            </AppText>
            <TouchableOpacity
              onPress={() => setHasError(false)}
              style={styles.retryBtn}
            >
              <AppText
                fontWeight="medium"
                fontSize={AppFontSize.subtitle}
                style={styles.white}
              >
                ลองใหม่
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClose} hitSlop={10}>
              <AppText fontSize={AppFontSize.caption} style={styles.brbSub}>
                ปิด
              </AppText>
            </TouchableOpacity>
          </View>
        ) : hlsUrl ? (
          <View
            style={styles.body}
            {...(isFullscreen ? swipePan.panHandlers : {})}
          >
            {renderVideo()}

            {!isFullscreen && renderInfo()}

            {/* Keyboard open: tapping anywhere outside the chat closes it (portrait and fullscreen) */}
            {chatKeyboardOpen && (
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={Keyboard.dismiss}
              />
            )}

            {/* Chat stays mounted (no new Firestore subscription each time it's hidden/shown) */}
            {
              <Animated.View
                style={
                  isFullscreen
                    ? [
                        styles.chatFullscreen,
                        { transform: [{ translateX: chatX }] },
                      ]
                    : [styles.chatPanel, { transform: [{ translateY: chatY }] }]
                }
                pointerEvents={!showChat ? 'none' : 'box-none'}
              >
                {isFullscreen && (
                  <View style={styles.sideHeader}>
                    <View style={styles.sideTitleCol}>
                      <View style={styles.titleRow}>
                        <View style={styles.accentBar} />
                        <AppText
                          fontWeight="medium"
                          fontSize={AppFontSize.subtitle}
                          style={styles.white}
                        >
                          แชทสด
                        </AppText>
                      </View>
                      <View style={styles.sideSubRow}>
                        <View style={styles.sideLive}>
                          <View style={styles.sideLiveDot} />
                          <AppText
                            fontSize={AppFontSize.overline}
                            style={styles.white}
                          >
                            Live
                          </AppText>
                        </View>
                        <View style={styles.sideViewers}>
                          <Ionicons
                            name="eye-outline"
                            size={ic(13)}
                            color={AppColors.textSecondary}
                          />
                          <AppText
                            fontSize={AppFontSize.caption}
                            style={styles.sideSub}
                          >
                            {viewerCount.toLocaleString()} คนกำลังดู
                          </AppText>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowChat(false)}
                      hitSlop={10}
                      style={styles.sideClose}
                    >
                      <Ionicons name="close" size={ic(18)} color={C.white} />
                    </TouchableOpacity>
                  </View>
                )}
                {!isFullscreen && (
                  <View style={styles.chatHeader} {...sheetPan.panHandlers}>
                    <View style={styles.grabber} />
                    {/* Single-line header: title + LIVE | viewers + close (matches other sheets in the app) */}
                    <View style={styles.sheetHeadRow}>
                      <AppText
                        fontWeight="semiBold"
                        fontSize={AppFontSize.title}
                        style={styles.white}
                      >
                        แชทสด
                      </AppText>
                      <View style={styles.sheetLive}>
                        <View style={styles.sheetLiveDot} />
                        <AppText
                          fontSize={AppFontSize.overline}
                          style={styles.white}
                        >
                          LIVE
                        </AppText>
                      </View>
                      <View style={styles.flex1} />
                      <View style={styles.sheetViewers}>
                        <Ionicons
                          name="eye-outline"
                          size={ic(15)}
                          color={AppColors.textSecondary}
                        />
                        <AppText
                          fontSize={AppFontSize.caption}
                          style={styles.sheetSub}
                        >
                          {viewerCount.toLocaleString()}
                        </AppText>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowChat(false)}
                        hitSlop={12}
                        style={styles.sheetClose}
                      >
                        <Ionicons
                          name="close"
                          size={ic(22)}
                          color={AppColors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                <LiveChat
                  streamId={streamId}
                  variant={isFullscreen ? 'side' : 'panel'}
                  onLike={handleLike}
                  bottomInset={isFullscreen ? 4 : insets.bottom}
                  onKeyboardVisibleChange={handleChatKeyboardChange}
                />
              </Animated.View>
            }

            {/* Floating hearts */}
            <View style={styles.hearts} pointerEvents="none">
              {hearts.map(id => (
                <FloatingHeart key={id} onDone={() => removeHeart(id)} />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.centerBox}>
            <AppSpinner size="large" />
            <AppText fontSize={AppFontSize.caption} style={styles.brbSub}>
              กำลังเตรียม Stream...
            </AppText>
            <TouchableOpacity onPress={handleClose} hitSlop={10}>
              <AppText fontSize={AppFontSize.caption} style={styles.brbSub}>
                ปิด
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
};

const LiveViewer = (props: LiveViewerProps) => {
  const closeRef = useRef<() => void>(props.onClose);
  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={() => closeRef.current()}
    >
      <SafeAreaProvider>
        <LiveViewerContent {...props} closeRef={closeRef} />
      </SafeAreaProvider>
    </Modal>
  );
};

export default LiveViewer;
