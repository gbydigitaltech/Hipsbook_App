import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Image, StyleSheet, View } from 'react-native';
import AppSpinner from '../loading/AppSpinner';
import Video, { SelectedVideoTrackType, VideoRef } from 'react-native-video';
import { log, logWarn } from '../../helpers/logger';
import { useVideoAccess } from '../../hooks/videos/useVideoAccess';
import { getVideoThumbnailUrl } from '../../helpers/videoThumbnail';
import { AppColors } from '../../styles/colors';
import { AppFontSize } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

type PlayerProps = {
  mediaId?: string;
  lessonId?: string;
  /** Play an HLS URL directly (e.g. live), skipping the access flow */
  sourceUrl?: string;
  /** Live mode: autoplay */
  isLive?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  initialFullscreen?: boolean;
  onError?: () => void;
  /** Live: notifies when the stream stalls/resumes (used for the "be right back" overlay) */
  onStalled?: (stalled: boolean) => void;
  /** Selected height (e.g. 720) | null/undefined = auto */
  quality?: number | null;
  /** Reports the available qualities for this stream (high -> low) */
  onQualities?: (heights: number[]) => void;
  /** External control (for lives that draw their own UI) */
  paused?: boolean;
  muted?: boolean;
  /** Use OS native controls (default: on unless live) */
  nativeControls?: boolean;
  /** Fill the parent instead of a 16:9 box */
  fill?: boolean;
  /** Current playback time (seconds) */
  onProgress?: (currentTime: number) => void;
  /** Video duration (seconds) */
  onDuration?: (duration: number) => void;
  onEnd?: () => void;
};

export type PlayerHandle = {
  seek: (seconds: number) => void;
};

/**
 * Player using react-native-video's native controls (the `controls` prop)
 * play/seek/fullscreen buttons come from the OS -> positioned correctly, no controls off the edge
 * Fullscreen is native (handles rotation and fullscreen itself)
 */
const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  {
    mediaId,
    lessonId,
    sourceUrl,
    isLive = false,
    onFullscreenChange,
    initialFullscreen = false,
    onError,
    onStalled,
    quality,
    onQualities,
    paused,
    muted,
    nativeControls,
    fill = false,
    onProgress,
    onDuration,
    onEnd,
  }: PlayerProps,
  ref,
) {
  const videoRef = useRef<VideoRef>(null);
  useImperativeHandle(
    ref,
    () => ({ seek: (sec: number) => videoRef.current?.seek(sec) }),
    [],
  );
  const useFill = isLive || fill;
  const showNativeControls = nativeControls ?? !isLive;
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [fatalError, setFatalError] = useState(false);
  // We render the poster ourselves: hide it on the first frame (so it doesn't linger over the video)
  const [firstFrameShown, setFirstFrameShown] = useState(false);

  const {
    streamUrl,
    loading: accessLoading,
    error: accessError,
    reload: reloadAccess,
  } = useVideoAccess({ videoId: mediaId, lessonId });

  const accessRetriedRef = useRef(false);
  useEffect(() => {
    accessRetriedRef.current = false;
    setFatalError(false);
    setIsBuffering(true);
    setFirstFrameShown(false);
  }, [mediaId, lessonId, sourceUrl]);

  // Clear the stall timer on unmount
  useEffect(() => {
    return () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    };
  }, []);

  const clearStall = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    onStalled?.(false);
  }, [onStalled]);

  // Lessons always play the signed streamUrl from the video-access API
  // (no direct CDN fallback: JW Player is no longer used)
  const videoUri = sourceUrl ?? (lessonId ? streamUrl : undefined);
  const posterUri = getVideoThumbnailUrl(mediaId);

  const showBuffering =
    (isBuffering || (!!lessonId && accessLoading)) && !fatalError;

  useEffect(() => {
    if (videoUri) {
      log('Player', `source=${lessonId ? 'ACCESS' : 'DIRECT'} uri=${videoUri}`);
    }
  }, [videoUri, lessonId]);

  // Enter fullscreen automatically when requested (native handles rotation/fullscreen)
  const handleLoad = useCallback(
    (e: { duration?: number }) => {
      setIsBuffering(false);
      if (typeof e?.duration === 'number' && e.duration > 0) {
        onDuration?.(e.duration);
      }
      if (initialFullscreen) {
        videoRef.current?.presentFullscreenPlayer();
      }
    },
    [initialFullscreen, onDuration],
  );

  const handleError = useCallback(
    (e: unknown) => {
      // Access flow: retry once in case the URL expired
      if (lessonId && !accessRetriedRef.current) {
        accessRetriedRef.current = true;
        setIsBuffering(true);
        reloadAccess();
        return;
      }
      logWarn('Player', 'video error', JSON.stringify(e));
      setFatalError(true);
      setIsBuffering(false);
      onError?.();
    },
    [lessonId, reloadAccess, onError],
  );

  return (
    <View style={useFill ? styles.containerFill : styles.container}>
      <View style={useFill ? styles.videoBoxFill : styles.videoBox}>
        {videoUri && !fatalError ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode="contain"
            controls={showNativeControls}
            paused={paused}
            muted={muted}
            fullscreenOrientation="landscape"
            fullscreenAutorotate
            onLoad={handleLoad}
            onBuffer={({ isBuffering: b }) => {
              setIsBuffering(b);
              if (b) {
                if (!stallTimerRef.current) {
                  stallTimerRef.current = setTimeout(
                    () => onStalled?.(true),
                    4000,
                  );
                }
              } else {
                clearStall();
              }
            }}
            onReadyForDisplay={() => setFirstFrameShown(true)}
            onProgress={e => {
              clearStall();
              if (e.currentTime > 0) setFirstFrameShown(true);
              onProgress?.(e.currentTime);
            }}
            onEnd={onEnd}
            onError={handleError}
            selectedVideoTrack={
              quality
                ? { type: SelectedVideoTrackType.RESOLUTION, value: quality }
                : { type: SelectedVideoTrackType.AUTO }
            }
            onVideoTracks={e => {
              const heights = Array.from(
                new Set(
                  (e.videoTracks ?? [])
                    .map(t => t.height)
                    .filter((h): h is number => typeof h === 'number' && h > 0),
                ),
              ).sort((a, b) => b - a);
              onQualities?.(heights);
            }}
            onFullscreenPlayerWillPresent={() => onFullscreenChange?.(true)}
            onFullscreenPlayerWillDismiss={() => onFullscreenChange?.(false)}
            playInBackground={false}
            playWhenInactive={false}
            preventsDisplaySleepDuringVideoPlayback
            ignoreSilentSwitch="ignore"
            progressUpdateInterval={500}
          />
        ) : null}

        {!isLive && posterUri && !firstFrameShown && !fatalError && (
          <Image
            source={{ uri: posterUri }}
            style={styles.poster}
            resizeMode="contain"
          />
        )}

        {showBuffering && (
          <View style={styles.overlay} pointerEvents="none">
            <AppSpinner size="large" />
          </View>
        )}

        {fatalError && (
          <View style={styles.overlay} pointerEvents="none">
            <AppText fontSize={AppFontSize.body} style={styles.errorText}>
              ไม่สามารถโหลดวิดีโอได้
            </AppText>
          </View>
        )}

        {!!lessonId && !!accessError && !accessLoading && !fatalError && (
          <View style={styles.overlay} pointerEvents="none">
            <AppText fontSize={AppFontSize.body} style={styles.errorText}>
              {accessError}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { width: '100%', backgroundColor: AppColors.black },
  // Live: fill the parent, no OS controls (UI is drawn in LiveViewer)
  containerFill: { flex: 1, width: '100%', backgroundColor: AppColors.black },
  videoBoxFill: { flex: 1, width: '100%', backgroundColor: AppColors.black },
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: AppColors.black,
    overflow: 'hidden',
  },
  video: { ...StyleSheet.absoluteFillObject },
  poster: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: { color: AppColors.textPrimary, textAlign: 'center' },
});

export default Player;
