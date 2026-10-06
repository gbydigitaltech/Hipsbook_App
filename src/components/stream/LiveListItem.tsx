import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize, PRESSED_OPACITY } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';
import { formatViewers } from './liveFormat';
import { LiveStreamSession } from './liveStreamService';

type Props = {
  stream: LiveStreamSession;
  following: boolean;
  onPress: (stream: LiveStreamSession) => void;
  onToggleFollow: (stream: LiveStreamSession) => void;
};

/** One live in the list (Figma: thumbnail left, title/host right, follow button) */
const LiveListItem: React.FC<Props> = ({
  stream,
  following,
  onPress,
  onToggleFollow,
}) => {
  const { scale } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          padding: scale(6),
          gap: scale(14),
          borderRadius: scale(8),
          backgroundColor: AppColors.sheet,
        },
        thumb: {
          width: scale(164),
          height: scale(106),
          borderRadius: scale(6),
          overflow: 'hidden',
          backgroundColor: AppColors.sheetRaised,
          alignItems: 'center',
          justifyContent: 'center',
        },
        fill: { ...StyleSheet.absoluteFillObject },
        livePill: {
          position: 'absolute',
          top: scale(6),
          left: scale(5),
          height: scale(18),
          paddingHorizontal: scale(7),
          borderRadius: 99,
          backgroundColor: AppColors.danger,
          justifyContent: 'center',
        },
        viewers: {
          position: 'absolute',
          left: scale(5),
          bottom: scale(5),
          height: scale(26),
          paddingHorizontal: scale(9),
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(4),
          borderRadius: 99,
          backgroundColor: AppColors.mediaScrim,
        },
        white: { color: AppColors.white },
        info: { flex: 1, paddingVertical: scale(2) },
        hostRow: {
          marginTop: scale(6),
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(9),
        },
        avatar: {
          width: scale(24),
          height: scale(24),
          borderRadius: scale(12),
          backgroundColor: AppColors.surfaceStrong,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarImg: { width: '100%', height: '100%' },
        hostName: { flex: 1, color: AppColors.textSecondary },
        followBtn: {
          position: 'absolute',
          right: 0,
          bottom: 0,
          height: scale(32),
          paddingHorizontal: scale(15),
          borderRadius: 99,
          justifyContent: 'center',
          backgroundColor: AppColors.surface,
        },
        followBtnOn: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: AppColors.primary,
        },
        followTextOn: { color: AppColors.primary },
      }),
    [scale],
  );

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
      <View style={styles.thumb}>
        {stream.thumbnailUrl ? (
          <Image source={{ uri: stream.thumbnailUrl }} style={styles.fill} />
        ) : (
          <Ionicons
            name="radio-outline"
            size={scale(28)}
            color={AppColors.textTertiary}
          />
        )}
        <View style={styles.livePill}>
          <AppText fontSize={AppFontSize.overline} style={styles.white}>
            Live
          </AppText>
        </View>
        <View style={styles.viewers}>
          <Ionicons
            name="eye-outline"
            size={scale(11)}
            color={AppColors.white}
          />
          <AppText fontSize={AppFontSize.caption} style={styles.white}>
            {formatViewers(stream.currentViewers)}
          </AppText>
        </View>
      </View>

      <View style={styles.info}>
        <AppText
          fontSize={AppFontSize.subtitle}
          fontWeight="medium"
          numberOfLines={1}
        >
          {stream.title}
        </AppText>

        <View style={styles.hostRow}>
          <View style={styles.avatar}>
            {stream.logoUrl ? (
              <Image
                source={{ uri: stream.logoUrl }}
                style={styles.avatarImg}
              />
            ) : (
              <Ionicons
                name="person"
                size={scale(13)}
                color={AppColors.textSecondary}
              />
            )}
          </View>
          <AppText
            fontSize={AppFontSize.caption}
            numberOfLines={1}
            style={styles.hostName}
          >
            {stream.hostName || 'ผู้ไลฟ์'}
          </AppText>
        </View>

        <Pressable
          onPress={() => onToggleFollow(stream)}
          hitSlop={6}
          style={[styles.followBtn, following && styles.followBtnOn]}
          accessibilityRole="button"
        >
          <AppText
            fontSize={AppFontSize.caption}
            style={following ? styles.followTextOn : styles.white}
          >
            {following ? 'ติดตามแล้ว' : 'ติดตาม'}
          </AppText>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default React.memo(LiveListItem);
