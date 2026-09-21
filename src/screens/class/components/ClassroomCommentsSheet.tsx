import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import CommentIcon from '../../../assets/icons/CommentIcon';
import ReviewComposerForm from '../../../components/reviews/ReviewComposerForm';
import ReviewLongPressActionSheet from '../../../components/reviews/ReviewLongPressActionSheet';
import AppText from '../../../components/texts/AppText';
import { IS_IOS, IS_TABLET } from '../../../constants/platform';
import { log } from '../../../helpers/logger';
import { useResponsive } from '../../../helpers/responsive';
import { useCourseReviewAll } from '../../../hooks/review/useCourseReviewAll';
import { useCourseReviewDetail } from '../../../hooks/review/useCourseReviewDetail';
import { useCreateCourseReview } from '../../../hooks/review/useCreateCourseReview';
import { useDeleteCourseReview } from '../../../hooks/review/useDeleteCourseReview';
import { useToggleCourseReviewLike } from '../../../hooks/review/useToggleCourseReviewLike';
import { AppColors } from '../../../styles/colors';
import { AppFontSize, AppRadius } from '../../../styles/sharedstyles';
import CourseCommentsSection from '../../course/CourseDetail/components/CourseCommentsSection';
import CourseReviewRepliesModal from '../../course/CourseDetail/components/CourseReviewRepliesModal';

const { height: screenHeight } = Dimensions.get('window');

type Mode = 'list' | 'compose';

type Props = {
  visible: boolean;
  onClose: () => void;
  courseId?: string | number | null;
};

/**
 * Comments sheet for the classroom screen (half-screen height).
 * Tapping "comment" or "edit" swaps the form in place of the list in the same sheet.
 */
const ClassroomCommentsSheet: React.FC<Props> = ({
  visible,
  onClose,
  courseId,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();
  // Keep the sheet mounted through the closing animation, then unmount.
  const [shouldRender, setShouldRender] = useState(visible);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const id = courseId != null ? String(courseId) : '';

  const [mode, setMode] = useState<Mode>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [composeInitial, setComposeInitial] = useState<{
    rating: number;
    text: string;
  }>({ rating: 0, text: '' });

  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [commentActionOpen, setCommentActionOpen] = useState(false);
  const [selectedReplyReviewId, setSelectedReplyReviewId] = useState<
    string | null
  >(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);

  const {
    displayData: reviewItems,
    my_review: myReviewState,
    loading: reviewLoading,
    hasMore: reviewHasMore,
    loadMore: loadMoreReviews,
    refetch: refetchReviews,
  } = useCourseReviewAll(id, { enabled: visible && !!id, page: 1, limit: 5 });

  const { data: reviewDetail, loading: reviewDetailLoading } =
    useCourseReviewDetail(selectedReplyReviewId, {
      enabled: replyModalOpen && !!selectedReplyReviewId,
    });

  const { submit: submitCourseReview } = useCreateCourseReview();
  const { remove: deleteCourseReview } = useDeleteCourseReview();
  const { toggle: toggleLike } = useToggleCourseReviewLike();

  const canCreateReview = myReviewState?.can_create ?? true;
  const canEditReview = myReviewState?.can_edit ?? false;

  const openCompose = useCallback((editReview?: any) => {
    if (editReview) {
      setIsEditing(true);
      setComposeInitial({
        rating: editReview?.rating ?? 0,
        text: editReview?.content ?? '',
      });
    } else {
      setIsEditing(false);
      setComposeInitial({ rating: 0, text: '' });
    }
    setMode('compose');
  }, []);

  const backToList = useCallback(() => {
    Keyboard.dismiss();
    setMode('list');
  }, []);

  const openCommentAction = useCallback((item: any) => {
    setSelectedReview(item);
    setCommentActionOpen(true);
  }, []);
  const closeCommentAction = useCallback(() => setCommentActionOpen(false), []);

  const handlePressReply = useCallback((item: any) => {
    const reviewId = item?.id ? String(item.id) : '';
    if (!reviewId) return;
    setSelectedReplyReviewId(reviewId);
    setReplyModalOpen(true);
  }, []);
  const closeReplyModal = useCallback(() => {
    setReplyModalOpen(false);
    setSelectedReplyReviewId(null);
  }, []);

  const handleSubmit = useCallback(
    async ({ rating, text }: { rating: number; text: string }) => {
      try {
        const res = await submitCourseReview({
          courseId: id,
          rating,
          content: text,
        });
        const ok = !!res?.review?.id || res?.createdNew === true;
        if (!ok) {
          log('Class', 'create/update review failed:', res);
          return;
        }
        Keyboard.dismiss();
        setMode('list');
        await refetchReviews();
      } catch (e) {
        log('Class', 'create/update review error:', e);
      }
    },
    [id, submitCourseReview, refetchReviews],
  );

  // --- keyboard height (push the sheet up while typing) ---
  useEffect(() => {
    const showSub = Keyboard.addListener(
      IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKeyboardHeight(e?.endCoordinates?.height ?? 0),
    );
    const hideSub = Keyboard.addListener(
      IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // --- open/close animation ---
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setMode('list');
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
        setMode('list');
        setKeyboardHeight(0);
        setCommentActionOpen(false);
        setReplyModalOpen(false);
        setSelectedReplyReviewId(null);
      });
    }
  }, [visible, translateY, backdropOpacity]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        backdrop: {
          ...StyleSheet.absoluteFill,
          backgroundColor: AppColors.scrim,
        },
        flex1: { flex: 1 },
        bottomWrap: { flex: 1, justifyContent: 'flex-end' },
        sheet: {
          backgroundColor: AppColors.sheet,
          borderTopWidth: 1,
          borderColor: AppColors.border,
          borderTopLeftRadius: responsiveRadius(AppRadius.sheet),
          borderTopRightRadius: responsiveRadius(AppRadius.sheet),
          paddingHorizontal: scale(18),
          paddingTop: verticalScale(14),
          paddingBottom: verticalScale(20),
          maxHeight: '80%',
        },
        sheetListMin: {
          minHeight: '50%',
        },
        handle: {
          alignSelf: 'center',
          width: scale(44),
          height: verticalScale(5),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.surfaceStrong,
          marginBottom: verticalScale(16),
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: verticalScale(14),
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(8),
        },
        title: { color: AppColors.white },
        list: { flex: 1 },
        listContent: { paddingBottom: verticalScale(16) },
        composeScroll: { flexShrink: 1 },
        composeContent: { paddingBottom: verticalScale(8) },
        composerBar: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(10),
          minHeight: verticalScale(IS_TABLET ? 56 : 46),
          borderRadius: responsiveRadius(AppRadius.md),
          backgroundColor: AppColors.surface,
          borderWidth: 1,
          borderColor: AppColors.border,
          paddingHorizontal: scale(IS_TABLET ? 18 : 14),
          marginTop: verticalScale(10),
        },
        composerText: { flex: 1, color: AppColors.textTertiary },
        emptyWrap: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: verticalScale(12),
        },
        emptyText: { color: AppColors.textSecondary },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const isEmpty = !reviewLoading && (reviewItems?.length ?? 0) === 0;

  if (!shouldRender) return null;

  const composing = mode === 'compose';

  return (
    <Modal
      transparent
      visible={shouldRender}
      animationType="none"
      onRequestClose={composing ? backToList : onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={styles.flex1}
            onPress={composing ? backToList : onClose}
          />
        </Animated.View>

        <View
          style={[styles.bottomWrap, { paddingBottom: keyboardHeight }]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              !composing && styles.sheetListMin, // list keeps min 50% height; compose sizes to content
              { transform: [{ translateY }] },
            ]}
          >
            <View style={styles.handle} />

            {composing ? (
              <ScrollView
                style={styles.composeScroll}
                contentContainerStyle={styles.composeContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <ReviewComposerForm
                  key={isEditing ? 'edit' : 'create'}
                  title={isEditing ? 'แก้ไขความคิดเห็น' : 'เขียนความคิดเห็น'}
                  submitLabel={isEditing ? 'บันทึก' : 'เขียนรีวิว'}
                  initialRating={composeInitial.rating}
                  initialText={composeInitial.text}
                  onSubmit={handleSubmit}
                  onCancel={backToList}
                />
              </ScrollView>
            ) : (
              <>
                <View style={styles.header}>
                  <AppText
                    fontSize={AppFontSize.title}
                    fontWeight="semiBold"
                    style={styles.title}
                  >
                    ความคิดเห็น
                  </AppText>
                </View>

                {isEmpty ? (
                  <View style={styles.emptyWrap}>
                    <CommentIcon size={IS_TABLET ? 96 : 80} />
                    <AppText
                      fontSize={AppFontSize.subtitle}
                      style={styles.emptyText}
                    >
                      ยังไม่มีความคิดเห็น
                    </AppText>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <CourseCommentsSection
                      loading={reviewLoading}
                      items={reviewItems ?? []}
                      hasMore={reviewHasMore}
                      onLoadMore={loadMoreReviews}
                      onToggleLike={toggleLike}
                      onLongPressItem={openCommentAction}
                      onPressReply={handlePressReply}
                      myReviewId={myReviewState?.review_id}
                    />
                  </ScrollView>
                )}

                {canCreateReview && (
                  <Pressable
                    style={styles.composerBar}
                    onPress={() => openCompose()}
                    accessibilityRole="button"
                    accessibilityLabel="เขียนความคิดเห็น"
                  >
                    <AppText
                      fontSize={AppFontSize.body}
                      style={styles.composerText}
                    >
                      แสดงความคิดเห็น...
                    </AppText>
                    <Ionicons
                      name="create-outline"
                      size={IS_TABLET ? 24 : 20}
                      color={AppColors.primary}
                    />
                  </Pressable>
                )}
              </>
            )}
          </Animated.View>
        </View>

        {/* Manage menu (edit/delete) — switches to compose mode in the same sheet on edit */}
        <ReviewLongPressActionSheet
          visible={commentActionOpen}
          onClose={closeCommentAction}
          title="จัดการความคิดเห็น"
          actions={[
            {
              key: 'edit',
              label: 'แก้ไขความคิดเห็น',
              onPress: () => {
                const review = selectedReview;
                if (review?.id !== myReviewState?.review_id || !canEditReview) {
                  closeCommentAction();
                  return;
                }
                closeCommentAction();
                // Wait for the action sheet to finish closing before swapping to compose.
                setTimeout(() => openCompose(review), 320);
              },
            },
            {
              key: 'delete',
              label: 'ลบความคิดเห็น',
              destructive: true,
              onPress: () => {
                const review = selectedReview;
                if (review?.id !== myReviewState?.review_id || !canEditReview) {
                  closeCommentAction();
                  return;
                }
                closeCommentAction();
                setTimeout(() => {
                  Alert.alert(
                    'ลบความคิดเห็น',
                    'ต้องการลบความคิดเห็นนี้ใช่ไหม? การลบไม่สามารถกู้คืนได้',
                    [
                      { text: 'ยกเลิก', style: 'cancel' },
                      {
                        text: 'ลบ',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deleteCourseReview(id);
                            await refetchReviews();
                          } catch (e) {
                            log('Class', 'delete review error:', e);
                          }
                        },
                      },
                    ],
                  );
                }, 320);
              },
            },
          ]}
        />

        <CourseReviewRepliesModal
          visible={replyModalOpen}
          loading={reviewDetailLoading}
          data={reviewDetail}
          onClose={closeReplyModal}
        />
      </View>
    </Modal>
  );
};

export default ClassroomCommentsSheet;
