import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { Ionicons } from '@react-native-vector-icons/ionicons';
import LikeIcon from '../../assets/icons/LikeIcon';
import RatingIcon from '../../assets/icons/RatingIcon';
import ReplyIcon from '../../assets/icons/ReplyIcon';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import RoundProfileImage from '../profiles/RoundProfileImage';
import AppText from '../texts/AppText';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';

interface Props {
  name?: string;
  content?: string;
  avatarUri?: string;
  rating?: number;
  initialLiked?: boolean;
  initialLikeCount?: number;
  initialReplyCount?: number;
  onToggleLike?: (liked: boolean) => void;
  onLongPress?: () => void;
  onPressReply?: () => void;
}

const ReviewItem: React.FC<Props> = ({
  name = 'User',
  content = '',
  avatarUri,
  rating = 0,
  initialLiked = false,
  initialLikeCount = 0,
  initialReplyCount = 0,
  onToggleLike,
  onLongPress,
  onPressReply,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const translateY = useRef(new Animated.Value(0)).current;

  const filledCount = Math.max(0, Math.min(5, Math.floor(rating)));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: AppColors.surfaceSubtle,
          borderWidth: 1,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.lg),
          padding: scale(IS_TABLET ? 18 : 14),
          gap: verticalScale(12),
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(12),
        },
        headerCol: { flex: 1, gap: verticalScale(6) },
        ratingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(IS_TABLET ? 6 : 4),
        },
        content: {
          color: AppColors.white,
          lineHeight: verticalScale(IS_TABLET ? 26 : 22),
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: AppColors.border,
        },
        actionsRow: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: scale(18),
        },
        actionBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          paddingVertical: verticalScale(2),
        },
        moreBtn: {
          width: scale(32),
          height: scale(32),
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: responsiveRadius(AppRadius.pill),
          marginTop: verticalScale(-2),
          marginRight: scale(-4),
        },
        actionText: { color: AppColors.textSecondary },
        actionTextActive: { color: AppColors.primary },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const animateLike = () => {
    translateY.setValue(0);
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: 4,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleToggleLike = () => {
    animateLike();
    const next = !liked;
    setLiked(next);
    setLikeCount(count => Math.max(0, count + (next ? 1 : -1)));
    onToggleLike?.(next);
  };

  return (
    <Pressable onLongPress={onLongPress} style={styles.card}>
      <View style={styles.headerRow}>
        <RoundProfileImage
          size={IS_TABLET ? 52 : 44}
          name={name}
          imageUrl={avatarUri}
        />

        <View style={styles.headerCol}>
          <AppText
            fontWeight="semiBold"
            fontSize={AppFontSize.subtitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {name}
          </AppText>

          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <RatingIcon
                key={i}
                size={IS_TABLET ? 18 : 15}
                color={i < filledCount ? '#F4A700' : AppColors.borderStrong}
              />
            ))}
          </View>
        </View>

        {!!onLongPress && (
          <Pressable
            onPress={onLongPress}
            hitSlop={8}
            style={styles.moreBtn}
            accessibilityRole="button"
            accessibilityLabel="จัดการความคิดเห็น"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={IS_TABLET ? 22 : 18}
              color={AppColors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {!!content && (
        <AppText fontSize={AppFontSize.body} style={styles.content}>
          {content}
        </AppText>
      )}

      <View style={styles.divider} />

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={onPressReply}>
          <ReplyIcon
            size={IS_TABLET ? 22 : 18}
            color={AppColors.textSecondary}
          />
          <AppText fontSize={AppFontSize.caption} style={styles.actionText}>
            {initialReplyCount}
          </AppText>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleToggleLike}>
          <LikeIcon
            color={liked ? AppColors.primary : AppColors.textSecondary}
            size={IS_TABLET ? 22 : 18}
          />
          <Animated.View style={{ transform: [{ translateY }] }}>
            <AppText
              fontSize={AppFontSize.caption}
              style={[styles.actionText, liked && styles.actionTextActive]}
            >
              {likeCount}
            </AppText>
          </Animated.View>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default ReviewItem;
