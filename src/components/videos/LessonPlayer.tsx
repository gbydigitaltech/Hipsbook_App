import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import AppText from '../texts/AppText';
import Player, { PlayerHandle } from './Player';

/* Same colors as the live viewer */
const C = {
  bg: '#000000',
  accent: '#E34A42',
  white: '#FFFFFF',
  playCircle: 'rgba(245,245,245,0.25)',
  track: 'rgba(239,239,239,0.33)',
  buffered: 'rgba(239,239,239,0.55)',
  menu: '#1C1C1C',
  muted: '#C4C4C4',
};

const CONTROLS_HIDE_MS = 3000;
const SKIP_SEC = 10;

const formatTime = (sec: number) => {
  const t = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

type Props = {
  mediaId?: string;
  lessonId?: string;
  /** Title shown in the top bar in fullscreen */
  title?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
};

/**
 * Lesson player: same look and controls as the live viewer (YouTube-style)
 * - Tap the video = show/hide controls (auto-hide after 3s)
 * - Drag the progress bar to seek, back/forward 10s buttons
 * - Quality picker, custom fullscreen (rotates to landscape without remounting the video)
 */
const LessonPlayer = ({
  mediaId,
  lessonId,
  title,
  onFullscreenChange,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const { scale, verticalScale } = useResponsive();
  const playerRef = useRef<PlayerHandle>(null);

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quality: null = auto
  const [qualities, setQualities] = useState<number[]>([]);
  const [quality, setQuality] = useState<number | null>(null);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);

  // Scrubbing: while dragging, show the dragged position instead of the real time
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const trackWidthRef = useRef(1);
  const dragStartXRef = useRef(0);
  const durationRef = useRef(0);
  durationRef.current = duration;

  /* ---- Show/hide controls ---- */
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);
  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimerRef.current = setTimeout(
      () => setControlsVisible(false),
      CONTROLS_HIDE_MS,
    );
  }, [clearHide]);
  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);
  const toggleControls = useCallback(() => {
    if (controlsVisible) {
      clearHide();
      setControlsVisible(false);
    } else {
      showControls();
    }
  }, [controlsVisible, clearHide, showControls]);

  useEffect(() => {
    showControls();
    return clearHide;
  }, [showControls, clearHide]);

  // Paused/ended -> keep controls visible
  useEffect(() => {
    if (paused || ended || qualityMenuOpen) clearHide();
  }, [paused, ended, qualityMenuOpen, clearHide]);

  /* ---- Fullscreen ---- */
  useEffect(() => {
    if (isFullscreen) Orientation.lockToLandscape();
    else Orientation.lockToPortrait();
    onFullscreenChange?.(isFullscreen);
  }, [isFullscreen, onFullscreenChange]);
  useEffect(() => () => Orientation.lockToPortrait(), []);

  // Android: back button in fullscreen = exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setIsFullscreen(false);
      return true;
    });
    return () => sub.remove();
  }, [isFullscreen]);

  /* ---- Playback ---- */
  const seekTo = useCallback((sec: number) => {
    const d = durationRef.current;
    const t = Math.max(0, d > 0 ? Math.min(sec, d - 0.5) : sec);
    playerRef.current?.seek(t);
    setCurrent(t);
    setEnded(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (ended) {
      seekTo(0);
      setPaused(false);
    } else {
      setPaused(p => !p);
    }
    showControls();
  }, [ended, seekTo, showControls]);

  // Skip badge: repeated taps in the same direction add up (+10 -> +20 -> +30)
  const [skipInfo, setSkipInfo] = useState<{ dir: 1 | -1; sec: number } | null>(
    null,
  );
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    },
    [],
  );

  const skip = useCallback(
    (delta: number) => {
      seekTo(current + delta);
      showControls();
      const dir: 1 | -1 = delta > 0 ? 1 : -1;
      setSkipInfo(prev =>
        prev && prev.dir === dir
          ? { dir, sec: prev.sec + Math.abs(delta) }
          : { dir, sec: Math.abs(delta) },
      );
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
      skipTimerRef.current = setTimeout(() => setSkipInfo(null), 900);
    },
    [current, seekTo, showControls],
  );

  const handleProgress = useCallback((t: number) => {
    setCurrent(t);
  }, []);
  const handleEnd = useCallback(() => {
    setEnded(true);
    setPaused(true);
    setControlsVisible(true);
  }, []);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: e => {
          clearHide();
          dragStartXRef.current = e.nativeEvent.locationX;
          setDragRatio(
            Math.min(
              1,
              Math.max(0, e.nativeEvent.locationX / trackWidthRef.current),
            ),
          );
        },
        onPanResponderMove: (_, g) => {
          const x = dragStartXRef.current + g.dx;
          setDragRatio(Math.min(1, Math.max(0, x / trackWidthRef.current)));
        },
        onPanResponderRelease: (_, g) => {
          const x = dragStartXRef.current + g.dx;
          const r = Math.min(1, Math.max(0, x / trackWidthRef.current));
          seekTo(r * durationRef.current);
          setDragRatio(null);
          scheduleHide();
        },
        onPanResponderTerminate: () => {
          setDragRatio(null);
          scheduleHide();
        },
      }),
    [clearHide, scheduleHide, seekTo],
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = Math.max(1, e.nativeEvent.layout.width);
  };

  const ratio =
    dragRatio ?? (duration > 0 ? Math.min(1, current / duration) : 0);
  const shownTime = dragRatio != null ? dragRatio * duration : current;

  const qualityLabel = quality ? `${quality}p` : 'อัตโนมัติ';
  const ic = (n: number) => (IS_TABLET ? n + 4 : n);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: '100%',
          aspectRatio: 16 / 9,
          backgroundColor: C.bg,
          overflow: 'hidden',
        },
        // True fullscreen: size = screen, pulled outside the SafeAreaView padding
        // (otherwise the app background shows at the left/right by the notch/nav bar)
        rootFullscreen: {
          width: Math.max(winW, winH),
          height: Math.min(winW, winH),
          marginLeft: -insets.left,
          marginTop: -insets.top,
          backgroundColor: C.bg,
          overflow: 'hidden',
        },
        white: { color: C.white },
        shadow: {
          textShadowColor: 'rgba(0,0,0,0.6)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        },
        tapLayer: { ...StyleSheet.absoluteFillObject },

        topBar: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: verticalScale(56),
          paddingLeft: scale(14) + (isFullscreen ? insets.left : 0),
          paddingRight: scale(14) + (isFullscreen ? insets.right : 0),
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(10),
        },
        topTitle: { flex: 1, color: C.white },

        centerRow: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          marginTop: -scale(51) / 2,
          height: scale(51),
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: scale(isFullscreen ? 56 : 36),
        },
        centerPlay: {
          width: scale(51),
          height: scale(51),
          borderRadius: scale(26),
          backgroundColor: C.playCircle,
          justifyContent: 'center',
          alignItems: 'center',
        },
        skipBadge: {
          position: 'absolute',
          top: '50%',
          marginTop: -scale(16),
          height: scale(32),
          paddingHorizontal: scale(12),
          borderRadius: 99,
          backgroundColor: 'rgba(0,0,0,0.55)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(5),
        },
        skipBadgeLeft: { left: '8%' },
        skipBadgeRight: { right: '8%' },
        skipBtn: {
          width: scale(40),
          height: scale(44),
          justifyContent: 'center',
          alignItems: 'center',
        },

        bottomBar: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: verticalScale(18),
          paddingBottom:
            verticalScale(isFullscreen ? 10 : 6) +
            (isFullscreen ? insets.bottom : 0),
          // Fullscreen: keep buttons clear of the notch/nav bar
          paddingLeft: scale(13) + (isFullscreen ? insets.left : 0),
          paddingRight: scale(18) + (isFullscreen ? insets.right : 0),
          gap: verticalScale(2),
        },
        barRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(12),
        },
        spacer: { flex: 1 },
        trackTouch: {
          height: scale(22),
          justifyContent: 'center',
        },
        track: {
          height: 3,
          borderRadius: 3,
          backgroundColor: C.track,
        },
        trackFill: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          borderRadius: 3,
          backgroundColor: C.accent,
        },
        knob: {
          position: 'absolute',
          top: -4.5,
          width: 12,
          height: 12,
          marginLeft: -6,
          borderRadius: 6,
          backgroundColor: C.accent,
        },
        knobDrag: {
          top: -6.5,
          width: 16,
          height: 16,
          marginLeft: -8,
          borderRadius: 8,
        },
        barBtn: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },

        menuBackdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.55)',
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
          paddingVertical: verticalScale(isFullscreen ? 8 : 11),
        },
      }),
    [
      scale,
      verticalScale,
      isFullscreen,
      insets.top,
      insets.bottom,
      insets.left,
      insets.right,
      winW,
      winH,
    ],
  );

  const showUi = controlsVisible || dragRatio != null;

  return (
    <View style={isFullscreen ? styles.rootFullscreen : styles.root}>
      <StatusBar hidden={isFullscreen} barStyle="light-content" />

      <Player
        ref={playerRef}
        mediaId={mediaId}
        lessonId={lessonId}
        fill
        nativeControls={false}
        paused={paused}
        muted={muted}
        quality={quality}
        onQualities={setQualities}
        onProgress={handleProgress}
        onDuration={setDuration}
        onEnd={handleEnd}
      />

      <Pressable style={styles.tapLayer} onPress={toggleControls} />

      {showUi && isFullscreen && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setIsFullscreen(false)} hitSlop={10}>
            <Ionicons
              name="chevron-down"
              size={ic(24)}
              color={C.white}
              style={styles.shadow}
            />
          </TouchableOpacity>
          <AppText
            fontWeight="medium"
            fontSize={16}
            numberOfLines={1}
            style={[styles.topTitle, styles.shadow]}
          >
            {title ?? ''}
          </AppText>
        </View>
      )}

      {/* Center: back 10 | play/pause | forward 10 */}
      {(showUi || paused) && (
        <View style={styles.centerRow} pointerEvents="box-none">
          {!ended && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => skip(-SKIP_SEC)}
              hitSlop={8}
            >
              <Ionicons
                name="play-back"
                size={ic(22)}
                color={C.white}
                style={styles.shadow}
              />
              <AppText fontSize={10} style={[styles.white, styles.shadow]}>
                {SKIP_SEC}
              </AppText>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.centerPlay} onPress={togglePlay}>
            <Ionicons
              name={ended ? 'refresh' : paused ? 'play' : 'pause'}
              size={ic(25)}
              color={C.white}
              style={styles.shadow}
            />
          </TouchableOpacity>
          {!ended && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => skip(SKIP_SEC)}
              hitSlop={8}
            >
              <Ionicons
                name="play-forward"
                size={ic(22)}
                color={C.white}
                style={styles.shadow}
              />
              <AppText fontSize={10} style={[styles.white, styles.shadow]}>
                {SKIP_SEC}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* -10s / +10s badge on the left/right */}
      {skipInfo && (
        <View
          pointerEvents="none"
          style={[
            styles.skipBadge,
            skipInfo.dir < 0 ? styles.skipBadgeLeft : styles.skipBadgeRight,
          ]}
        >
          <Ionicons
            name={skipInfo.dir < 0 ? 'play-back' : 'play-forward'}
            size={ic(14)}
            color={C.white}
          />
          <AppText fontSize={14} fontWeight="medium" style={styles.white}>
            {skipInfo.dir < 0 ? '-' : '+'}
            {skipInfo.sec} วิ
          </AppText>
        </View>
      )}

      {/* Bottom bar: progress bar (draggable) + buttons */}
      {(showUi || paused) && (
        <View style={styles.bottomBar}>
          <View
            style={styles.trackTouch}
            onLayout={onTrackLayout}
            {...pan.panHandlers}
          >
            <View style={styles.track} pointerEvents="none">
              <View style={[styles.trackFill, { width: `${ratio * 100}%` }]} />
              <View
                style={[
                  styles.knob,
                  dragRatio != null && styles.knobDrag,
                  { left: `${ratio * 100}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.barRow}>
            <TouchableOpacity onPress={togglePlay} hitSlop={8}>
              <Ionicons
                name={ended ? 'refresh' : paused ? 'play' : 'pause'}
                size={ic(18)}
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
                size={ic(16)}
                color={C.white}
                style={styles.shadow}
              />
            </TouchableOpacity>
            <AppText fontSize={12} style={[styles.white, styles.shadow]}>
              {formatTime(shownTime)} / {formatTime(duration)}
            </AppText>

            <View style={styles.spacer} />

            <TouchableOpacity
              onPress={() => setQualityMenuOpen(true)}
              hitSlop={8}
              style={styles.barBtn}
            >
              <Ionicons
                name="settings-outline"
                size={ic(17)}
                color={C.white}
                style={styles.shadow}
              />
              <AppText fontSize={12} style={[styles.white, styles.shadow]}>
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
                size={ic(18)}
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
            <AppText fontSize={12} style={styles.menuTitle}>
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
                    fontSize={16}
                    fontWeight={active ? 'medium' : 'regular'}
                    style={styles.white}
                  >
                    {q ? `${q}p` : 'อัตโนมัติ'}
                  </AppText>
                  {active && (
                    <Ionicons name="checkmark" size={18} color={C.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      )}
    </View>
  );
};

export default LessonPlayer;
