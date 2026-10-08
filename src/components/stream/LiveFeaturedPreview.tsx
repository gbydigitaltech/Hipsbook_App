import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';
import AppText from '../texts/AppText';
import Player from '../videos/Player';
import liveStreamService, { LiveStreamSession } from './liveStreamService';
import { getHlsUrl, normalizeHlsPlaybackUrl } from './streamConfig';
import LiveBadge from './LiveBadge';
import { formatViewers } from './liveFormat';

const BOTTOM_FADE = ['rgba(0,0,0,0)', AppColors.scrimStrong];

type Props = {
  stream: LiveStreamSession;
  /** Pause the preview (e.g. while the full viewer/publisher is open) */
  paused?: boolean;
  onPress: (stream: LiveStreamSession) => void;
};

/**
 * Big card at the top of the live page: plays a muted preview of one live
 * (Figma "LIVE NOW" card). Tap to open the full viewer.
 */
const LiveFeaturedPreview: React.FC<Props> = ({ stream, paused, onPress }) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const isFocused = useIsFocused();
  const [hlsUrl, setHlsUrl] = useState('');
  const [videoReady, setVideoReady] = useState(false);

  // Resolve the playback URL of this live (same logic as LiveViewer)
  useEffect(() => {
    let cancelled = false;
    setHlsUrl('');
    setVideoReady(false);
    (async () => {
      let url = normalizeHlsPlaybackUrl(stream.playbackHlsUrl ?? '');
      if (!url) {
        try {
          const playback = await liveStreamService.getPlayback(stream.id);
          url = normalizeHlsPlaybackUrl(playback.hlsUrl);
        } catch {}
      }
      if (!url && stream.streamKey?.trim()) {
        url = normalizeHlsPlaybackUrl(getHlsUrl(stream.streamKey.trim()));
      }
      if (!cancelled) setHlsUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [stream.id, stream.playbackHlsUrl, stream.streamKey]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          height: verticalScale(191),
          borderRadius: responsiveRadius(AppRadius.md),
          overflow: 'hidden',
          backgroundColor: AppColors.cardBackground,
        },
        fill: { ...StyleSheet.absoluteFillObject },
        hidden: { opacity: 0 },
        liveBadge: {
          position: 'absolute',
          top: scale(10),
          left: scale(10),
        },
        white: { color: AppColors.white },
        bottom: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: scale(12),
          paddingTop: verticalScale(24),
          paddingBottom: verticalScale(10),
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: scale(8),
        },
        title: { flex: 1, color: AppColors.white },
        viewers: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(4),
          paddingHorizontal: scale(8),
          height: scale(24),
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.mediaScrim,
        },
        placeholder: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const playing = !!hlsUrl && isFocused && !paused;

  // Fallback: reveal the video even if no progress event arrives
  useEffect(() => {
    if (!playing || videoReady) return;
    const t = setTimeout(() => setVideoReady(true), 4000);
    return () => clearTimeout(t);
  }, [playing, videoReady]);

  return (
    <Pressable
      onPress={() => onPress(stream)}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: PRESSED_OPACITY },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`ดูไลฟ์ ${stream.title}`}
    >
      {/* Poster first; the video covers it once it starts */}
      {stream.thumbnailUrl ? (
        <Image source={{ uri: stream.thumbnailUrl }} style={styles.fill} />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons
            name="radio-outline"
            size={scale(40)}
            color={AppColors.textTertiary}
          />
        </View>
      )}

      {playing && (
        <View
          style={[styles.fill, !videoReady && styles.hidden]}
          pointerEvents="none"
        >
          <Player
            sourceUrl={hlsUrl}
            isLive
            muted
            fill
            nativeControls={false}
            onProgress={() => !videoReady && setVideoReady(true)}
          />
        </View>
      )}

      <LiveBadge size="md" style={styles.liveBadge} />

      <LinearGradient
        colors={BOTTOM_FADE}
        style={styles.bottom}
        pointerEvents="none"
      >
        <AppText
          fontSize={AppFontSize.subtitle}
          fontWeight="medium"
          numberOfLines={1}
          style={styles.title}
        >
          {stream.title}
        </AppText>
        <View style={styles.viewers}>
          <Ionicons
            name="eye-outline"
            size={scale(12)}
            color={AppColors.white}
          />
          <AppText fontSize={AppFontSize.caption} style={styles.white}>
            {formatViewers(stream.currentViewers)}
          </AppText>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

export default React.memo(LiveFeaturedPreview);
