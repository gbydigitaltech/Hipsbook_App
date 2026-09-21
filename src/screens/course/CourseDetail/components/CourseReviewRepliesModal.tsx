import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import RatingIcon from '../../../../assets/icons/RatingIcon';
import AppLoadingOverlay from '../../../../components/loading/AppLoadingOverlay';
import RoundProfileImage from '../../../../components/profiles/RoundProfileImage';
import AppText from '../../../../components/texts/AppText';
import { IS_TABLET } from '../../../../constants/platform';
import { useResponsive } from '../../../../helpers/responsive';
import { AppColors } from '../../../../styles/colors';
import { AppFontSize, AppRadius } from '../../../../styles/sharedstyles';

type PersonalInfo = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  fullname?: string | null;
  display_name?: string | null;
  name?: string | null;
};

type JoinUser = {
  id?: string;
  email?: string | null;
  join_PersonalInfo?: PersonalInfo[];
};

type ReviewItem = {
  id: string;
  content?: string | null;
  rating?: number | null;
  create_timestamp?: string;
  join_User?: JoinUser;
};

type ReplyItem = {
  id: string;
  content?: string | null;
  create_timestamp?: string;
  join_User?: JoinUser;
};

type ReviewDetailData = {
  review?: ReviewItem;
  replies_flat?: ReplyItem[];
};

type Props = {
  visible: boolean;
  loading?: boolean;
  data?: ReviewDetailData | null;
  onClose: () => void;
};

const { height: screenHeight } = Dimensions.get('window');

const getDisplayName = (user?: JoinUser) => {
  const personal = user?.join_PersonalInfo?.[0];

  return (
    personal?.full_name ||
    personal?.fullname ||
    personal?.display_name ||
    personal?.name ||
    [personal?.first_name, personal?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'User'
  );
};

const formatThaiTimeAgo = (value?: string) => {
  if (!value) return '';

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs) || diffMs < 0) return '';

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'เมื่อสักครู่';

  const minutes = Math.floor(diffMs / minute);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;

  const hours = Math.floor(diffMs / hour);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;

  const days = Math.floor(diffMs / day);
  return `${days} วันที่แล้ว`;
};

const ThreadRow: React.FC<{
  name: string;
  content?: string | null;
  createdAt?: string;
  rating?: number | null;
  isRoot?: boolean;
}> = ({ name, content, createdAt, rating, isRoot = false }) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const filledCount = Math.max(0, Math.min(5, Math.floor(rating ?? 0)));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: verticalScale(12),
        },
        profileRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: scale(16),
        },
        right: {
          flex: 1,
          minWidth: 0,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          minWidth: 0,
        },
        name: {
          flex: 1,
          color: AppColors.white,
          marginRight: scale(8),
        },
        time: {
          color: AppColors.textTertiary,
          marginLeft: 'auto',
          flexShrink: 0,
        },
        ratingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: verticalScale(6),
          gap: scale(IS_TABLET ? 6 : 4),
        },
        commentBox: {
          borderRadius: responsiveRadius(AppRadius.lg),
          backgroundColor: AppColors.backgroundInteractive,
          paddingVertical: verticalScale(IS_TABLET ? 10 : 8),
          paddingHorizontal: scale(IS_TABLET ? 20 : 16),
        },
        content: {
          color: AppColors.white,
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>
        <RoundProfileImage size={IS_TABLET ? 68 : 56} name={name} />

        <View style={styles.right}>
          <View style={styles.header}>
            <AppText
              fontWeight="semiBold"
              style={styles.name}
              numberOfLines={1}
              ellipsizeMode="tail"
              fontSize={AppFontSize.subtitle}
            >
              {name}
            </AppText>

            {!!createdAt && (
              <AppText fontSize={AppFontSize.caption} style={styles.time}>
                {formatThaiTimeAgo(createdAt)}
              </AppText>
            )}
          </View>

          {isRoot && (
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <RatingIcon
                  key={i}
                  size={IS_TABLET ? 20 : 16}
                  color={i < filledCount ? '#F4A700' : '#D9D9D9'}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.commentBox}>
        <AppText style={styles.content} fontSize={AppFontSize.caption}>
          {content}
        </AppText>
      </View>
    </View>
  );
};

const CourseReviewRepliesModal: React.FC<Props> = ({
  visible,
  loading = false,
  data,
  onClose,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const rootReview = data?.review;
  const replies = data?.replies_flat ?? [];
  const hasReplies = replies.length > 0;

  const [shouldRender, setShouldRender] = useState(visible);
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, translateY, backdropOpacity]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        backdrop: {
          backgroundColor: AppColors.scrim,
        },
        flex1: {
          flex: 1,
        },
        sheet: {
          backgroundColor: AppColors.sheet,
          borderTopWidth: 1,
          borderColor: AppColors.border,
          borderTopLeftRadius: responsiveRadius(AppRadius.sheet),
          borderTopRightRadius: responsiveRadius(AppRadius.sheet),
          paddingHorizontal: scale(18),
          paddingTop: verticalScale(14),
          paddingBottom: verticalScale(14),
          maxHeight: '80%',
        },

        handle: {
          alignSelf: 'center',
          backgroundColor: AppColors.surfaceStrong,
          width: scale(IS_TABLET ? 54 : 44),
          height: verticalScale(5),
          borderRadius: responsiveRadius(AppRadius.pill),
          marginBottom: verticalScale(IS_TABLET ? 36 : 30),
        },
        header: {
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: verticalScale(IS_TABLET ? 20 : 16),
        },
        title: {
          color: AppColors.white,
          textAlign: 'center',
        },
        contentScroll: {
          flexGrow: 0,
        },
        contentContainer: {
          paddingBottom: verticalScale(8),
        },
        divider: {
          height: 1,
          backgroundColor: AppColors.surfaceSubtle,
          marginTop: verticalScale(16),
          marginBottom: verticalScale(16),
        },
        sectionTitle: {
          color: AppColors.textSecondary,
          marginBottom: verticalScale(12),
        },
        replyDivider: {
          height: 1,
          backgroundColor: AppColors.surfaceSubtle,
          marginVertical: verticalScale(14),
        },
        emptyWrap: {
          paddingVertical: verticalScale(20),
          alignItems: 'center',
          justifyContent: 'center',
        },
        emptyText: {
          color: AppColors.textSecondary,
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  if (!shouldRender) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={shouldRender}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.backdrop,
            StyleSheet.absoluteFill,
            { opacity: backdropOpacity },
          ]}
        >
          <Pressable style={styles.flex1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <AppLoadingOverlay visible={loading} message="กำลังโหลด..." />

          <View style={styles.handle} />

          <View style={styles.header}>
            <AppText
              fontSize={AppFontSize.title}
              fontWeight="semiBold"
              style={styles.title}
            >
              ตอบกลับความคิดเห็น
            </AppText>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
          >
            {rootReview ? (
              <>
                <ThreadRow
                  name={getDisplayName(rootReview.join_User)}
                  content={rootReview.content}
                  createdAt={rootReview.create_timestamp}
                  rating={rootReview.rating}
                  isRoot
                />

                <View style={styles.divider} />

                {hasReplies && (
                  <>
                    <AppText
                      fontSize={AppFontSize.subtitle}
                      style={styles.sectionTitle}
                    >
                      การตอบกลับ ({replies.length})
                    </AppText>

                    {replies.map((item, index) => (
                      <View key={item.id || String(index)}>
                        <ThreadRow
                          name={getDisplayName(item.join_User)}
                          content={item.content}
                          createdAt={item.create_timestamp}
                        />

                        {index < replies.length - 1 && (
                          <View style={styles.replyDivider} />
                        )}
                      </View>
                    ))}
                  </>
                )}
              </>
            ) : (
              <View style={styles.emptyWrap}>
                <AppText style={styles.emptyText}>
                  ไม่พบข้อมูลความคิดเห็น
                </AppText>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CourseReviewRepliesModal;
