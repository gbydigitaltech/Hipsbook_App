import { VIDEO_STREAM_BASE_URL, VIDEO_THUMBNAIL_BASE_URL } from '@env';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import Video, { VideoRef } from 'react-native-video';
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

type PlayerProps = {
  mediaId?: string;
  lessonId?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  initialFullscreen?: boolean;
};

type ControlsProps = {
  mode: 'overlay' | 'inline';
  paused: boolean;
  togglePlay: () => void;
  currentTime: number;
  duration: number;
  isSeeking: boolean;
  seekTime: number;
  setSeekTime: (v: number) => void;
  onStartSeek: () => void;
  onSeekComplete: (v: number) => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  styles: ReturnType<typeof makeStyles>;
};

/* ---------- Controls ---------- */
const Controls = React.memo(
  ({
    mode,
    paused,
    togglePlay,
    currentTime,
    duration,
    isSeeking,
    seekTime,
    setSeekTime,
    onStartSeek,
    onSeekComplete,
    fullscreen,
    onToggleFullscreen,
    styles,
  }: ControlsProps) => {
    const containerStyle =
      mode === 'overlay'
        ? styles.bottomControlsOverlay
        : styles.bottomControlsInline;

    return (
      <View style={containerStyle}>
        <View style={styles.leftGroup}>
          <TouchableOpacity
            onPress={togglePlay}
            style={styles.iconButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={paused ? 'play' : 'pause'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <AppText fontSize={AppFontSize.body} style={styles.timeText}>
            {formatTime(currentTime)}
          </AppText>
        </View>

        <View style={styles.sliderGroup}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 0}
            value={isSeeking ? seekTime : currentTime}
            onValueChange={v => setSeekTime(v)}
            onSlidingStart={onStartSeek}
            onSlidingComplete={onSeekComplete}
            minimumTrackTintColor={AppColors.primary}
            maximumTrackTintColor={AppColors.progressTrack}
            thumbTintColor="#FFFFFF"
          />
        </View>

        <View style={styles.rightGroup}>
          <AppText fontSize={AppFontSize.body} style={styles.timeText}>
            {formatTime(duration)}
          </AppText>
          <TouchableOpacity
            onPress={onToggleFullscreen}
            style={styles.iconButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={fullscreen ? 'contract' : 'expand'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

Controls.displayName = 'Controls';

/* ---------- styles ---------- */
const makeStyles = (params: {
  fullscreen: boolean;
  scale: (v: number) => number;
  verticalScale: (v: number) => number;
  insetsTop: number;
  insetsBottom: number;
}) => {
  const { fullscreen, scale, verticalScale, insetsBottom } = params;
  const controlsBottomPad = IS_Android
    ? Math.max(insetsBottom, verticalScale(12))
    : verticalScale(6);
  const controlsSidePad = scale(8);

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
    // Don't use display:'none' here, otherwise audio stops playing.
    hiddenVideo: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
    },
    buffering: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    doubleTapRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
    },
    doubleTapZone: { flex: 1 },
    centerControls: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerPlayButton: {
      backgroundColor: AppColors.scrim,
      padding: 18,
      borderRadius: 60,
    },
    bottomControlsOverlay: {
      position: 'absolute',
      backgroundColor: AppColors.scrim,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 9999,
      paddingBottom: controlsBottomPad,
      paddingTop: verticalScale(4),
      paddingHorizontal: controlsSidePad,
    },
    bottomControlsInline: {
      width: '100%',
      backgroundColor: AppColors.scrim,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: controlsSidePad,
      paddingVertical: verticalScale(2),
    },
    leftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      width: scale(85),
    },
    sliderGroup: {
      flex: 1,
      paddingHorizontal: scale(8),
    },
    rightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      width: scale(85),
      justifyContent: 'flex-end',
    },
    iconButton: {
      paddingVertical: verticalScale(10),
      paddingHorizontal: scale(10),
    },
    timeText: {
      color: AppColors.textPrimary,
      paddingHorizontal: scale(6),
    },
    slider: { flex: 1 },
    controlsFadeWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  });
};

/* ---------- Player ---------- */
const Player = ({
  mediaId,
  lessonId,
  onFullscreenChange,
  initialFullscreen = false,
}: PlayerProps) => {
  const videoRef = useRef<VideoRef>(null);
  const { scale, verticalScale } = useResponsive();
  const insets = useSafeAreaInsets();
  const [fullscreen, setFullscreen] = useState(initialFullscreen);

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
  } = useVideoPlayer({ videoRef, mediaId });

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
  };

  const fallbackUri = currentMediaId
    ? `${VIDEO_STREAM_BASE_URL}/${currentMediaId}.m3u8`
    : undefined;
  const videoUri = lessonId ? streamUrl : fallbackUri;

  const showBuffering = isBuffering || (!!lessonId && accessLoading);

  useEffect(() => {
    if (videoUri) {
      log(
        'Player',
        `source=${
          lessonId
            ? 'ACCESS(/hipsstream/videos/access/url)'
            : 'FALLBACK(direct .m3u8)'
        } uri=${videoUri}`,
      );
    }
  }, [videoUri, lessonId]);

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
                source={{
                  uri: `${VIDEO_THUMBNAIL_BASE_URL}/${currentMediaId}.jpg`,
                }}
                style={styles.audioThumbnail}
              />
            )}

            {videoUri && (
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                poster={`${VIDEO_THUMBNAIL_BASE_URL}/${currentMediaId}.jpg`}
                style={[styles.video, isAudio && styles.hiddenVideo]}
                paused={paused}
                resizeMode="contain"
                onLoad={onLoad}
                onBuffer={onBuffer}
                onProgress={onProgress}
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
              <View style={styles.buffering} pointerEvents="none">
                <AppText fontSize={AppFontSize.body} style={styles.timeText}>
                  {accessError}
                </AppText>
              </View>
            )}

            <View style={styles.doubleTapRow} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.doubleTapZone}
                onPress={onLeftPress}
              />
              <TouchableOpacity
                style={styles.doubleTapZone}
                onPress={onRightPress}
              />
            </View>

            <Animated.View
              style={[styles.centerControls, { opacity: controlsOpacity }]}
              pointerEvents={controlsVisible ? 'auto' : 'none'}
            >
              <TouchableOpacity
                onPress={hasEnded ? replay : togglePlay}
                style={styles.centerPlayButton}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              >
                <Ionicons
                  name={hasEnded ? 'refresh' : paused ? 'play' : 'pause'}
                  size={52}
                  color="white"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View
            style={[styles.controlsFadeWrapper, { opacity: controlsOpacity }]}
            pointerEvents={controlsVisible ? 'auto' : 'none'}
          >
            {fullscreen ? (
              <Controls
                mode="overlay"
                paused={paused}
                togglePlay={togglePlay}
                currentTime={isSeeking ? seekTime : currentTime}
                duration={duration}
                isSeeking={isSeeking}
                seekTime={seekTime}
                setSeekTime={setSeekTime}
                onStartSeek={onStartSeek}
                onSeekComplete={onSeekComplete}
                fullscreen={fullscreen}
                onToggleFullscreen={() => setFullscreen(v => !v)}
                styles={styles}
              />
            ) : (
              <View
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
              >
                <Controls
                  mode="inline"
                  paused={paused}
                  togglePlay={togglePlay}
                  currentTime={isSeeking ? seekTime : currentTime}
                  duration={duration}
                  isSeeking={isSeeking}
                  seekTime={seekTime}
                  setSeekTime={setSeekTime}
                  onStartSeek={onStartSeek}
                  onSeekComplete={onSeekComplete}
                  fullscreen={fullscreen}
                  onToggleFullscreen={() => setFullscreen(v => !v)}
                  styles={styles}
                />
              </View>
            )}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Player;
