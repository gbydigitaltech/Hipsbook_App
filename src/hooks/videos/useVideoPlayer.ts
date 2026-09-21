import { useEffect, useRef, useState } from 'react';
import type {
  OnBufferData,
  OnLoadData,
  OnProgressData,
  VideoRef,
} from 'react-native-video';

interface UseVideoPlayerProps {
  videoRef: React.RefObject<VideoRef | null>;
  mediaId?: string;
}

export const useVideoPlayer = ({ videoRef, mediaId }: UseVideoPlayerProps) => {
  const [paused, setPaused] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [isAudio, setIsAudio] = useState(false);
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [currentMediaId, setCurrentMediaId] = useState<string | undefined>(
    mediaId,
  );
  const [hasEnded, setHasEnded] = useState(false);

  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);

  useEffect(() => {
    if (mediaId) {
      setCurrentMediaId(mediaId);
      setPaused(false);
      setCurrentTime(0);
      setSeekTime(0);
      setIsBuffering(true);
      setHasEnded(false);
    }
  }, [mediaId]);

  const showControlsTemporarily = (timeout = 3000) => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(
      () => setControlsVisible(false),
      timeout,
    );
  };

  const togglePlay = () => {
    // If finished, pressing play restarts from the beginning.
    if (hasEnded) {
      videoRef.current?.seek(0);
      setCurrentTime(0);
      setHasEnded(false);
      setPaused(false);
      showControlsTemporarily();
      return;
    }
    setPaused(prev => !prev);
    showControlsTemporarily();
  };

  // Replay from the start (used by the replay button).
  const replay = () => {
    videoRef.current?.seek(0);
    setCurrentTime(0);
    setHasEnded(false);
    setPaused(false);
    showControlsTemporarily();
  };

  const toggleControls = () => {
    if (controlsVisible) setControlsVisible(false);
    else showControlsTemporarily();
  };

  const onLoad = (meta: OnLoadData) => {
    const width = meta.naturalSize?.width ?? 0;
    const height = meta.naturalSize?.height ?? 0;
    const isAudioOnly = !width || !height;
    setIsAudio(isAudioOnly);
    setIsVerticalVideo(!isAudioOnly && height > width);
    setDuration(meta.duration);
    setIsBuffering(false);
  };

  const onProgress = (progress: OnProgressData) => {
    if (!isSeeking) setCurrentTime(progress.currentTime);
  };

  const onBuffer = ({ isBuffering }: OnBufferData) =>
    setIsBuffering(isBuffering);

  const onEnd = () => {
    setPaused(true);
    setControlsVisible(true);
    setHasEnded(true);
  };

  const onStartSeek = () => setIsSeeking(true);

  const onSeekComplete = (value: number) => {
    setIsSeeking(false);
    videoRef.current?.seek(value);
    setCurrentTime(value);
    showControlsTemporarily();
  };

  const handleDoubleTap = (direction: number) => {
    const jump = 10 * direction;
    const target = Math.max(0, Math.min(duration, currentTime + jump));
    videoRef.current?.seek(target);
    setCurrentTime(target);
    showControlsTemporarily();
  };

  const handleTap = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= 310) {
          toggleControls();
          lastTapRef.current = 0;
        }
      }, 310);
    }
  };

  const onLeftPress = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      handleDoubleTap(-1);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current !== 0) {
          togglePlay();
          lastTapRef.current = 0;
        }
      }, 300);
    }
  };

  const onRightPress = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      handleDoubleTap(1);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current !== 0) {
          togglePlay();
          lastTapRef.current = 0;
        }
      }, 300);
    }
  };

  return {
    paused,
    controlsVisible,
    isBuffering,
    duration,
    currentTime,
    isSeeking,
    seekTime,
    togglePlay,
    toggleControls,
    onLoad,
    onProgress,
    onBuffer,
    onEnd,
    onStartSeek,
    onSeekComplete,
    handleTap,
    onLeftPress,
    onRightPress,
    setSeekTime,
    currentMediaId,
    isAudio,
    isVerticalVideo,
    hasEnded,
    replay,
  };
};
