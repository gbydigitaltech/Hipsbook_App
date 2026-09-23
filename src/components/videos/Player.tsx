import { VIDEO_STREAM_BASE_URL, VIDEO_THUMBNAIL_BASE_URL } from '@env';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { log, logWarn } from '../../helpers/logger';
import { useVideoAccess } from '../../hooks/videos/useVideoAccess';
import { AppColors } from '../../styles/colors';
import { AppFontSize } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

type PlayerProps = {
  mediaId?: string;
  lessonId?: string;
  /** เล่น HLS URL ตรง ๆ (เช่น live) ข้าม access flow */
  sourceUrl?: string;
  /** โหมด live: เล่นทันที */
  isLive?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  initialFullscreen?: boolean;
  onError?: () => void;
  /** live: แจ้งเมื่อสตรีมค้าง/กลับมาเล่น (ใช้โชว์ overlay "เดี๋ยวกลับมา") */
  onStalled?: (stalled: boolean) => void;
};

/**
 * Player แบบใช้ "native controls" ของ react-native-video (prop `controls`)
 * ปุ่ม play/seek/fullscreen เป็นของ OS -> วางตำแหน่งเป๊ะ ไม่มีปัญหา control ตกขอบ
 * fullscreen ใช้ native (หมุน + เต็มจอให้เอง)
 */
const Player = ({
  mediaId,
  lessonId,
  sourceUrl,
  isLive = false,
  onFullscreenChange,
  initialFullscreen = false,
  onError,
  onStalled,
}: PlayerProps) => {
  const videoRef = useRef<VideoRef>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [fatalError, setFatalError] = useState(false);

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
  }, [mediaId, lessonId, sourceUrl]);

  // ล้าง stall timer ตอน unmount
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

  const fallbackUri = mediaId
    ? `${VIDEO_STREAM_BASE_URL}/${mediaId}.m3u8`
    : undefined;
  const videoUri = sourceUrl ?? (lessonId ? streamUrl : fallbackUri);
  const posterUri = mediaId
    ? `${VIDEO_THUMBNAIL_BASE_URL}/${mediaId}.jpg`
    : undefined;

  const showBuffering =
    (isBuffering || (!!lessonId && accessLoading)) && !fatalError;

  useEffect(() => {
    if (videoUri) {
      log(
        'Player',
        `source=${lessonId ? 'ACCESS' : 'DIRECT'} uri=${videoUri}`,
      );
    }
  }, [videoUri, lessonId]);

  // เข้า fullscreen อัตโนมัติถ้าถูกสั่ง (native จะจัดการหมุน/เต็มจอเอง)
  const handleLoad = useCallback(() => {
    setIsBuffering(false);
    if (initialFullscreen) {
      videoRef.current?.presentFullscreenPlayer();
    }
  }, [initialFullscreen]);

  const handleError = useCallback(
    (e: unknown) => {
      // access flow: retry ครั้งเดียว เผื่อ url หมดอายุ
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
    <View style={styles.container}>
      <View style={styles.videoBox}>
        {videoUri && !fatalError ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            poster={isLive ? undefined : posterUri}
            style={styles.video}
            resizeMode="contain"
            controls
            fullscreenOrientation="landscape"
            fullscreenAutorotate
            onLoad={handleLoad}
            onBuffer={({ isBuffering: b }) => {
              setIsBuffering(b);
              if (b) {
                if (!stallTimerRef.current) {
                  stallTimerRef.current = setTimeout(() => onStalled?.(true), 4000);
                }
              } else {
                clearStall();
              }
            }}
            onProgress={() => clearStall()}
            onError={handleError}
            onFullscreenPlayerWillPresent={() => onFullscreenChange?.(true)}
            onFullscreenPlayerWillDismiss={() => onFullscreenChange?.(false)}
            playInBackground={false}
            playWhenInactive={false}
            preventsDisplaySleepDuringVideoPlayback
            ignoreSilentSwitch="ignore"
            progressUpdateInterval={500}
          />
        ) : null}

        {showBuffering && (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator size="large" color={AppColors.primary} />
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
};

const styles = StyleSheet.create({
  container: { width: '100%', backgroundColor: '#000' },
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  video: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: { color: AppColors.textPrimary, textAlign: 'center' },
});

export default Player;
