import { VIDEO_STREAM_BASE_URL, VIDEO_THUMBNAIL_BASE_URL } from '@env';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  DimensionValue,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Orientation from 'react-native-orientation-locker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import Video, {
  SelectedVideoTrack,
  SelectedVideoTrackType,
  VideoRef,
  VideoTrack,
} from 'react-native-video';
import { IS_Android } from '../../constants/platform';
import { log } from '../../helpers/logger';
import { useResponsive } from '../../helpers/responsive';
import { useVideoAccess } from '../../hooks/videos/useVideoAccess';
import { useVideoPlayer } from '../../hooks/videos/useVideoPlayer';
import { AppColors } from '../../styles/colors';
import { AppFontSize } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

/* ---------- utils ---------- */
const formatTime = (sec = 0) => {
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((sec / 60) % 60)
    .toString()
    .padStart(2, '0');
  const h = Math.floor(sec / 3600).toString();
  return h !== '0' ? `${h}:${m}:${s}` : `${m}:${s}`;
};

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

type PlayerProps = {
  mediaId?: string;
  lessonId?: string;
  /** Play a ready HLS URL directly (e.g. live), bypassing the access flow. */
  sourceUrl?: string;
  /** Live mode: hide the seek bar/time and show a LIVE badge, autoplay. */
  isLive?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  initialFullscreen?: boolean;
  onError?: () => void;
};

/* ---------- styles ---------- */
const makeStyles = (params: {
  fullscreen: boolean;
  scale: (v: number) => number;
  verticalScale: (v: number) => number;
  insetsTop: number;
  insetsBottom: number;
}) => {
  const { fullscreen, scale, verticalScale, insetsBottom, insetsTop } = params;
  const bottomPad = fullscreen
    ? IS_Android
      ? Math.max(insetsBottom, verticalScale(10))
      : verticalScale(8)
    : verticalScale(0);
  const sidePad = fullscreen ? scale(20) : scale(12);

  return StyleSheet.create({
    container: {
      width: '100%',
      alignItems: 'center',
      flex: fullscreen ? 1 : 0,
      backgroundColor: fullscreen ? 'black' : 'transparent',
    },
    videoWrapper: {
      width: '100%',
      backgroundColor: 'black',
      alignSelf: 'center',
      overflow: 'hidden',
      ...(fullscreen ? { flex: 1 } : { aspectRatio: 16 / 9 }),
    },
    videoInner: { flex: 1 },
    audioThumbnail: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    video: { width: '100%', height: '100%' },
    hiddenVideo: { position: 'absolute', width: 1, height: 1, opacity: 0 },
    buffering: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorBox: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: scale(24),
    },
    errorText: { color: AppColors.textPrimary, textAlign: 'center' },

    /* gesture zones */
    doubleTapRow: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
    },
    doubleTapZone: { flex: 1 },

    /* double-tap ripple feedback */
    fxWrap: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fxSide: {
      width: '38%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fxBadge: { alignItems: 'center', justifyContent: 'center' },
    fxCircle: {
      width: scale(64),
      height: scale(64),
      borderRadius: scale(32),
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fxText: {
      color: '#fff',
      marginTop: verticalScale(4),
      fontSize: AppFontSize.caption,
    },

    /* scrims */
    controlsLayer: { ...StyleSheet.absoluteFillObject },
    topScrim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingTop: fullscreen ? Math.max(insetsTop, verticalScale(8)) : verticalScale(6),
      paddingHorizontal: sidePad,
      minHeight: verticalScale(fullscreen ? 56 : 40),
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: { padding: scale(6) },

    /* center */
    centerControls: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerSkip: { paddingHorizontal: scale(28) },
    centerPlayButton: {
      backgroundColor: 'rgba(0,0,0,0.45)',
      width: scale(64),
      height: scale(64),
      borderRadius: scale(32),
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: scale(12),
    },

    /* bottom */
    bottomScrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: bottomPad,
      paddingTop: verticalScale(24),
      paddingHorizontal: sidePad,
    },
    controlRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: { padding: scale(6) },
    timeText: {
      color: AppColors.textPrimary,
      marginLeft: scale(8),
      fontSize: AppFontSize.caption,
    },
    liveBadge: { flexDirection: 'row', alignItems: 'center' },
    liveDot: {
      width: scale(8),
      height: scale(8),
      borderRadius: scale(4),
      backgroundColor: '#ff3b30',
      marginRight: scale(6),
    },
    liveText: {
      color: AppColors.textPrimary,
      fontSize: AppFontSize.caption,
      fontWeight: '600',
    },
    speedLabel: {
      color: AppColors.textPrimary,
      fontSize: AppFontSize.caption,
      paddingHorizontal: scale(8),
      paddingVertical: verticalScale(4),
    },

    /* progress bar */
    progressWrap: {
      flex: 1,
      height: verticalScale(24),
      justifyContent: 'center',
      marginHorizontal: scale(6),
    },
    trackBase: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: verticalScale(3),
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.28)',
    },
    trackBuffered: {
      position: 'absolute',
      left: 0,
      height: verticalScale(3),
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
    slider: { width: '100%', height: verticalScale(24) },

    /* speed menu */
    menuBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuCard: {
      backgroundColor: '#1c1c1c',
      borderRadius: scale(12),
      paddingVertical: verticalScale(6),
      minWidth: scale(160),
    },
    menuTitle: {
      color: AppColors.textSecondary,
      fontSize: AppFontSize.caption,
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
    menuItemText: { color: '#fff', fontSize: AppFontSize.body },
  });
};

/* ---------- Player ---------- */
const Player = ({
  mediaId,
  lessonId,
  sourceUrl,
  isLive = false,
  onFullscreenChange,
  initialFullscreen = false,
  onError,
}: PlayerProps) => {
  const videoRef = useRef<VideoRef>(null);
  const { scale, verticalScale } = useResponsive();
  const insets = useSafeAreaInsets();
  const [fullscreen, setFullscreen] = useState(initialFullscreen);
  const [buffered, setBuffered] = useState(0);
  const [rate, setRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SelectedVideoTrack>({
    type: SelectedVideoTrackType.AUTO,
  });

  /* double-tap ripple feedback */
  const leftFx = useRef(new Animated.Value(0)).current;
  const rightFx = useRef(new Animated.Value(0)).current;
  const flashSeek = (direction: number) => {
    const v = direction < 0 ? leftFx : rightFx;
    v.stopAnimation();
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(v, {
        toValue: 0,
        duration: 380,
        delay: 240,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const {
    paused,
    controlsVisible,
    togglePlay,
    isBuffering,
    onLoad,
    onProgress,
    onBuffer,
    onEnd,
    onStartSeek,
    onSeekComplete,
    handleTap,
    onLeftPress,
    onRightPress,
    currentTime,
    duration,
    isSeeking,
    seekTime,
    currentMediaId,
    setSeekTime,
    isAudio,
    isVerticalVideo,
    hasEnded,
    replay,
  } = useVideoPlayer({ videoRef, mediaId, onDoubleTapSeek: flashSeek });

  const {
    streamUrl,
    loading: accessLoading,
    error: accessError,
    reload: reloadAccess,
  } = useVideoAccess({ videoId: currentMediaId, lessonId });

  const accessRetriedRef = useRef(false);
  useEffect(() => {
    accessRetriedRef.current = false;
  }, [currentMediaId, lessonId]);

  const handleVideoError = () => {
    if (lessonId && !accessRetriedRef.current) {
      accessRetriedRef.current = true;
      reloadAccess();
    }
    onError?.();
  };

  const fallbackUri = currentMediaId
    ? `${VIDEO_STREAM_BASE_URL}/${currentMediaId}.m3u8`
    : undefined;
  const videoUri = sourceUrl ?? (lessonId ? streamUrl : fallbackUri);
  const posterUri = currentMediaId
    ? `${VIDEO_THUMBNAIL_BASE_URL}/${currentMediaId}.jpg`
    : undefined;
  const showBuffering = isBuffering || (!!lessonId && accessLoading);

  const displayTime = isSeeking ? seekTime : currentTime;
  const bufferedPct: DimensionValue =
    duration > 0
      ? (`${Math.min(100, (buffered / duration) * 100)}%` as DimensionValue)
      : '0%';

  const handleProgress = (e: Parameters<typeof onProgress>[0]) => {
    onProgress(e);
    if (typeof e.playableDuration === 'number') setBuffered(e.playableDuration);
  };

  const seekBy = (direction: number) => {
    const target = Math.max(0, Math.min(duration, currentTime + 10 * direction));
    videoRef.current?.seek(target);
    flashSeek(direction);
  };

  const pickSpeed = (v: number) => {
    setRate(v);
  };

  const qualities = useMemo(
    () =>
      Array.from(
        new Set(
          videoTracks
            .map(t => t.height)
            .filter((h): h is number => typeof h === 'number' && h > 0),
        ),
      ).sort((a, b) => b - a),
    [videoTracks],
  );

  useEffect(() => {
    if (videoUri) {
      log(
        'Player',
        `source=${
          lessonId ? 'ACCESS(/hipsstream/videos/access/url)' : 'FALLBACK(direct .m3u8)'
        } uri=${videoUri}`,
      );
    }
  }, [videoUri, lessonId]);

  const liveStartedRef = useRef(false);
  useEffect(() => {
    liveStartedRef.current = false;
  }, [videoUri]);
  useEffect(() => {
    if (isLive && videoUri && paused && !liveStartedRef.current) {
      liveStartedRef.current = true;
      togglePlay();
    }
  }, [isLive, videoUri, paused, togglePlay]);

  const controlsOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(controlsOpacity, {
      toValue: controlsVisible ? 1 : 0,
      duration: controlsVisible ? 140 : 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, controlsOpacity]);

  useEffect(() => {
    onFullscreenChange?.(fullscreen);
  }, [fullscreen, onFullscreenChange]);

  useEffect(() => {
    StatusBar.setHidden(fullscreen);
    return () => StatusBar.setHidden(false);
  }, [fullscreen]);

  useEffect(() => {
    if (!IS_Android) return;
    if (fullscreen) {
      SystemNavigationBar.setNavigationColor('transparent', 'dark');
      SystemNavigationBar.immersive();
    } else {
      SystemNavigationBar.setNavigationColor('#111111', 'dark');
      SystemNavigationBar.stickyImmersive(false);
    }
    return () => {
      SystemNavigationBar.stickyImmersive(false);
    };
  }, [fullscreen]);

  useEffect(() => {
    if (fullscreen) {
      isVerticalVideo
        ? Orientation.lockToPortrait()
        : Orientation.unlockAllOrientations();
    } else {
      Orientation.lockToPortrait();
    }
    return () => Orientation.lockToPortrait();
  }, [fullscreen, isVerticalVideo]);

  const styles = useMemo(
    () =>
      makeStyles({
        fullscreen,
        scale,
        verticalScale,
        insetsTop: insets.top,
        insetsBottom: insets.bottom,
      }),
    [fullscreen, scale, verticalScale, insets.top, insets.bottom],
  );

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.videoWrapper}>
          <View style={styles.videoInner}>
            {isAudio && (
              <Image
                source={{ uri: `${VIDEO_THUMBNAIL_BASE_URL}/${currentMediaId}.jpg` }}
                style={styles.audioThumbnail}
              />
            )}

            {videoUri && (
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                poster={posterUri}
                style={[styles.video, isAudio && styles.hiddenVideo]}
                paused={paused}
                rate={rate}
                selectedVideoTrack={selectedTrack}
                onVideoTracks={e => setVideoTracks(e.videoTracks ?? [])}
                resizeMode="contain"
                onLoad={onLoad}
                onBuffer={onBuffer}
                onProgress={handleProgress}
                onEnd={onEnd}
                onError={handleVideoError}
                repeat={false}
                progressUpdateInterval={250}
                playInBackground={true}
                ignoreSilentSwitch="ignore"
              />
            )}

            {showBuffering && (
              <View style={styles.buffering} pointerEvents="none">
                <ActivityIndicator size="large" color="white" />
              </View>
            )}

            {!!lessonId && !!accessError && !accessLoading && (
              <View style={styles.errorBox} pointerEvents="none">
                <AppText fontSize={AppFontSize.body} style={styles.errorText}>
                  {accessError}
                </AppText>
              </View>
            )}

            {/* tap zones (single = show/hide, double = seek ±10) */}
            <View style={styles.doubleTapRow} pointerEvents="box-none">
              <TouchableOpacity
                activeOpacity={1}
                style={styles.doubleTapZone}
                onPress={onLeftPress}
              />
              <TouchableOpacity
                activeOpacity={1}
                style={styles.doubleTapZone}
                onPress={onRightPress}
              />
            </View>

            {/* double-tap ripple indicators */}
            <View style={styles.fxWrap} pointerEvents="none">
              <View style={styles.fxSide}>
                <Animated.View style={[styles.fxBadge, { opacity: leftFx }]}>
                  <View style={styles.fxCircle}>
                    <Ionicons name="play-back" size={26} color="#fff" />
                  </View>
                  <AppText style={styles.fxText}>10 วินาที</AppText>
                </Animated.View>
              </View>
              <View style={styles.fxSide}>
                <Animated.View style={[styles.fxBadge, { opacity: rightFx }]}>
                  <View style={styles.fxCircle}>
                    <Ionicons name="play-forward" size={26} color="#fff" />
                  </View>
                  <AppText style={styles.fxText}>10 วินาที</AppText>
                </Animated.View>
              </View>
            </View>

            {/* all control chrome fades together */}
            <Animated.View
              style={[styles.controlsLayer, { opacity: controlsOpacity }]}
              pointerEvents={controlsVisible ? 'box-none' : 'none'}
            >
              {/* top scrim + back (fullscreen) */}
              <LinearGradient
                colors={['rgba(0,0,0,0.55)', 'transparent']}
                style={styles.topScrim}
                pointerEvents="box-none"
              >
                {fullscreen && (
                  <TouchableOpacity
                    onPress={() => setFullscreen(false)}
                    style={styles.backButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="chevron-down" size={26} color="#fff" />
                  </TouchableOpacity>
                )}
              </LinearGradient>

              {/* center: skip -10 / play / skip +10 */}
              <View style={styles.centerControls} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.centerSkip}
                  onPress={() => seekBy(-1)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="play-back" size={30} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={hasEnded ? replay : togglePlay}
                  style={styles.centerPlayButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={hasEnded ? 'refresh' : paused ? 'play' : 'pause'}
                    size={34}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.centerSkip}
                  onPress={() => seekBy(1)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="play-forward" size={30} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* bottom scrim: time + speed + fullscreen + progress */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.bottomScrim}
                pointerEvents="box-none"
              >
                <View style={styles.controlRow}>
                  {isLive ? (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <AppText style={styles.liveText}>LIVE</AppText>
                    </View>
                  ) : (
                    <AppText style={styles.timeText}>
                      {formatTime(displayTime)} / {formatTime(duration)}
                    </AppText>
                  )}

                  {isLive ? (
                    <View style={styles.progressWrap} />
                  ) : (
                    <View style={styles.progressWrap}>
                      <View style={styles.trackBase} />
                      <View
                        style={[styles.trackBuffered, { width: bufferedPct }]}
                      />
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={duration || 0}
                        value={displayTime}
                        onValueChange={setSeekTime}
                        onSlidingStart={onStartSeek}
                        onSlidingComplete={onSeekComplete}
                        minimumTrackTintColor={AppColors.primary}
                        maximumTrackTintColor="transparent"
                        thumbTintColor="#FFFFFF"
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => setShowSpeedMenu(true)}
                    style={styles.iconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <AppText style={styles.speedLabel}>{rate}x</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setFullscreen(v => !v)}
                    style={styles.iconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={fullscreen ? 'contract' : 'expand'}
                      size={22}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* speed menu */}
            {showSpeedMenu && (
              <TouchableWithoutFeedback onPress={() => setShowSpeedMenu(false)}>
                <View style={styles.menuBackdrop}>
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={styles.menuCard}>
                      <AppText style={styles.menuTitle}>ความเร็ว</AppText>
                      {SPEED_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt}
                          style={styles.menuItem}
                          onPress={() => pickSpeed(opt)}
                        >
                          <AppText style={styles.menuItemText}>
                            {opt === 1 ? 'ปกติ' : `${opt}x`}
                          </AppText>
                          {rate === opt && (
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color={AppColors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                      <AppText style={styles.menuTitle}>คุณภาพ</AppText>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() =>
                          setSelectedTrack({ type: SelectedVideoTrackType.AUTO })
                        }
                      >
                        <AppText style={styles.menuItemText}>อัตโนมัติ</AppText>
                        {selectedTrack.type === SelectedVideoTrackType.AUTO && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={AppColors.primary}
                          />
                        )}
                      </TouchableOpacity>
                      {qualities.map(h => {
                        const active =
                          selectedTrack.type ===
                            SelectedVideoTrackType.RESOLUTION &&
                          selectedTrack.value === h;
                        return (
                          <TouchableOpacity
                            key={h}
                            style={styles.menuItem}
                            onPress={() =>
                              setSelectedTrack({
                                type: SelectedVideoTrackType.RESOLUTION,
                                value: h,
                              })
                            }
                          >
                            <AppText style={styles.menuItemText}>{h}p</AppText>
                            {active && (
                              <Ionicons
                                name="checkmark"
                                size={18}
                                color={AppColors.primary}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Player;
