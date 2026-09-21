import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import CommentIcon from '../../../../assets/icons/CommentIcon';
import ReviewItem from '../../../../components/reviews/ReviewItem';
import AppText from '../../../../components/texts/AppText';
import { IS_TABLET } from '../../../../constants/platform';
import { useResponsive } from '../../../../helpers/responsive';
import { AppColors } from '../../../../styles/colors';
import { AppFontSize, AppRadius } from '../../../../styles/sharedstyles';

type Props = {
  loading: boolean;
  items: any[];
  hasMore: boolean;
  onLoadMore: () => void;
  onToggleLike: (reviewId: string) => Promise<any>;
  onLongPressItem?: (item: any) => void;
  onPressReply?: (item: any) => void;
  myReviewId?: string | null;
};

const INITIAL_RENDER_COUNT = 5;
const RENDER_MORE_STEP = 5;

const getDisplayName = (item: any) => {
  const personal = item?.join_User?.join_PersonalInfo?.[0];

  return (
    personal?.full_name ||
    personal?.fullname ||
    personal?.display_name ||
    personal?.name ||
    [personal?.first_name, personal?.last_name].filter(Boolean).join(' ') ||
    item?.join_User?.email ||
    'User'
  );
};

const getAvatarUri = (item: any) => {
  const personal = item?.join_User?.join_PersonalInfo?.[0];

  const raw =
    personal?.profile_image ||
    personal?.avatar ||
    personal?.avatar_url ||
    personal?.image ||
    personal?.image_url ||
    item?.join_User?.profile_image ||
    item?.join_User?.avatar ||
    item?.join_User?.avatar_url;

  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
};

const CourseCommentsSection: React.FC<Props> = ({
  loading,
  items,
  hasMore,
  onLoadMore,
  onToggleLike,
  onLongPressItem,
  onPressReply,
  myReviewId,
}) => {
  const { verticalScale, scale, responsiveRadius } = useResponsive();
  const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT);
  const [loadingMore, setLoadingMore] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        emptyContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: verticalScale(40),
        },
        loadMoreWrap: {
          alignItems: 'center',
          marginTop: verticalScale(IS_TABLET ? 20 : 16),
          marginBottom: verticalScale(IS_TABLET ? 10 : 8),
        },
        loadMoreBtn: {
          paddingHorizontal: verticalScale(16),
          paddingVertical: scale(10),
          borderRadius: responsiveRadius(AppRadius.sm),
          backgroundColor: AppColors.backgroundInteractive,
        },
        loadMoreText: {
          color: AppColors.white,
        },
      }),
    [verticalScale, scale, responsiveRadius],
  );

  const sortedItems = useMemo(() => {
    if (!items?.length) return [];

    return [...items].sort((a, b) => {
      const aIsMine = a.id === myReviewId;
      const bIsMine = b.id === myReviewId;

      if (aIsMine && !bIsMine) return -1;
      if (!aIsMine && bIsMine) return 1;
      return 0;
    });
  }, [items, myReviewId]);

  const visibleItems = useMemo(
    () => sortedItems.slice(0, visibleCount),
    [sortedItems, visibleCount],
  );

  const handleLoadMoreVisible = async () => {
    const stillHasLocalItems = visibleCount < sortedItems.length;

    if (stillHasLocalItems) {
      setVisibleCount(prev => prev + RENDER_MORE_STEP);
      return;
    }

    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      await onLoadMore();
      setVisibleCount(prev => prev + RENDER_MORE_STEP);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <AppText>กำลังโหลดรีวิว...</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleItems}
        keyExtractor={item => String(item.id)}
        scrollEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={{ height: verticalScale(IS_TABLET ? 20 : 16) }} />
        )}
        renderItem={({ item }) => {
          const isMyReview = item.id === myReviewId;

          return (
            <ReviewItem
              name={getDisplayName(item)}
              avatarUri={getAvatarUri(item)}
              content={item.content}
              rating={item.rating}
              initialLiked={item.liked_by_me}
              initialLikeCount={item.like_count ?? 0}
              initialReplyCount={item.reply_count ?? item.replier_count ?? 0}
              onToggleLike={() => onToggleLike(item.id)}
              onPressReply={() => onPressReply?.(item)}
              onLongPress={
                isMyReview ? () => onLongPressItem?.(item) : undefined
              }
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CommentIcon size={IS_TABLET ? 96 : 80} />
            <AppText
              style={{ color: AppColors.white }}
              fontSize={AppFontSize.subtitle}
            >
              ยังไม่มีความคิดเห็น
            </AppText>
          </View>
        }
      />

      {(visibleCount < sortedItems.length || hasMore) && (
        <View style={styles.loadMoreWrap}>
          <Pressable style={styles.loadMoreBtn} onPress={handleLoadMoreVisible}>
            <AppText
              style={styles.loadMoreText}
              fontSize={AppFontSize.subtitle}
            >
              {loadingMore ? 'กำลังโหลด...' : 'ดูความคิดเห็นเพิ่มเติม'}
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default CourseCommentsSection;
