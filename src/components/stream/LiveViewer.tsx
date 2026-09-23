import { Ionicons } from '@react-native-vector-icons/ionicons';
import { log, logWarn } from '../../helpers/logger';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import AppText from '../texts/AppText';
import liveStreamService from './liveStreamService';
import Player from '../videos/Player';
import LiveChat from './LiveChat';
import { getHlsUrl, normalizeHlsPlaybackUrl } from './streamConfig';
import { AppFontSize } from '../../styles/sharedstyles';

type LiveViewerProps = {
  visible: boolean;
  onClose: () => void;
  streamId?: string;
  streamKey?: string;
  title?: string;
};

const LiveViewer = ({
  visible,
  onClose,
  streamId,
  streamKey,
  title: initialTitle,
}: LiveViewerProps) => {
  const insets = useSafeAreaInsets();
  const { scale, verticalScale } = useResponsive();
  const [, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hlsUrl, setHlsUrl] = useState('');
  const [title, setTitle] = useState(initialTitle ?? '');
  const [viewerCount, setViewerCount] = useState(0);
  const [away, setAway] = useState(false);
  const [, setStatus] = useState('');

  useEffect(() => {
    if (!visible) return;

    if (streamId) {
      (async () => {
        try {
          const data = await liveStreamService.getById(streamId);
          setTitle(data.title);
          setStatus(data.status);
          setViewerCount(data.currentViewers ?? 0);

          const playback = await liveStreamService.getPlayback(streamId);
          let url = normalizeHlsPlaybackUrl(playback.hlsUrl);
          if (!url && data.streamKey?.trim()) {
            url = normalizeHlsPlaybackUrl(getHlsUrl(data.streamKey.trim()));
          }
          if (url) {
            log('Stream', '[LiveViewer] HLS:', url);
          }
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

  const handleError = (e: {
    error?: {
      localizedDescription?: string;
      errorString?: string;
      errorCode?: string;
    };
  }) => {
    const msg =
      e?.error?.errorString ??
      e?.error?.localizedDescription ??
      e?.error?.errorCode;
    logWarn('Stream', '[LiveViewer] Video error', msg ?? JSON.stringify(e));
    setHasError(true);
    setIsBuffering(false);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsBuffering(true);
  };

  const handleClose = () => {
    setHasError(false);
    setIsBuffering(true);
    setAway(false);
    setHlsUrl('');
    setTitle(initialTitle ?? '');
    setViewerCount(0);
    onClose();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#000',
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
        titleContainer: {
          flex: 1,
          marginLeft: scale(8),
        },
        liveTag: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
        },
        liveDot: {
          width: scale(8),
          height: scale(8),
          borderRadius: scale(4),
          backgroundColor: AppColors.danger,
        },
        statsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
          marginTop: verticalScale(2),
        },
        videoContainer: {
          flex: 1,
          backgroundColor: '#000',
        },
        brbOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.82)',
          justifyContent: 'center',
          alignItems: 'center',
          gap: verticalScale(10),
          paddingHorizontal: scale(32),
        },
        brbTitle: { color: AppColors.white, textAlign: 'center' },
        brbSubtitle: { color: AppColors.grayLight, textAlign: 'center' },
        chatOverlay: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          bottom: 0,
        },
        bufferingOverlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: AppColors.scrim,
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: scale(40),
        },
        retryBtn: {
          marginTop: verticalScale(16),
          paddingVertical: verticalScale(10),
          paddingHorizontal: scale(24),
          backgroundColor: AppColors.primary,
          borderRadius: scale(8),
        },
      }),
    [insets.top, scale, verticalScale],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons
              name="arrow-back"
              size={IS_TABLET ? 32 : 24}
              color="white"
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            {title ? (
              <AppText
                fontWeight="medium"
                fontSize={AppFontSize.subtitle}
                numberOfLines={1}
              >
                {title}
              </AppText>
            ) : null}
            <View style={styles.statsRow}>
              {/* <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <AppText
                  fontSize={AppFontSize.caption}
                  style={{ color: AppColors.danger }}
                  fontWeight="bold"
                >
                  LIVE
                </AppText>
              </View> */}
              {viewerCount > 0 && (
                <>
                  <Ionicons
                    name="eye"
                    size={IS_TABLET ? 14 : 11}
                    color={AppColors.grayLight}
                  />
                  <AppText
                    fontSize={AppFontSize.overline}
                    style={{ color: AppColors.grayLight }}
                  >
                    {viewerCount}
                  </AppText>
                </>
              )}
            </View>
          </View>
        </View>

        {hasError ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="cloud-offline"
              size={IS_TABLET ? 80 : 60}
              color={AppColors.grayLight}
            />
            <AppText
              fontSize={AppFontSize.body}
              style={{
                color: AppColors.grayLight,
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              ไม่สามารถโหลด Live ได้
            </AppText>
            <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
              <AppText fontWeight="medium" fontSize={AppFontSize.body}>
                ลองใหม่
              </AppText>
            </TouchableOpacity>
          </View>
        ) : hlsUrl ? (
          <View style={styles.videoContainer}>
            <Player
              sourceUrl={hlsUrl}
              isLive
              onError={() => handleError({})}
              onStalled={setAway}
            />

            {away && (
              <View style={styles.brbOverlay} pointerEvents="none">
                <Ionicons
                  name="cafe"
                  size={IS_TABLET ? 72 : 52}
                  color={AppColors.white}
                />
                <AppText
                  fontWeight="medium"
                  fontSize={AppFontSize.subtitle}
                  style={styles.brbTitle}
                >
                  โฮสต์ไม่อยู่แป๊บนึง
                </AppText>
                <AppText fontSize={AppFontSize.body} style={styles.brbSubtitle}>
                  เดี๋ยวกลับมา ไม่ต้องปิดหนีนะ 💜
                </AppText>
              </View>
            )}

            <View style={styles.chatOverlay} pointerEvents="box-none">
              <LiveChat streamId={streamId} bottomInset={insets.bottom} />
            </View>
          </View>
        ) : (
          <View style={styles.bufferingOverlay}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <AppText
              fontSize={AppFontSize.body}
              style={{ marginTop: 12, color: AppColors.grayLight }}
            >
              กำลังเตรียม Stream...
            </AppText>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default LiveViewer;
