import React from 'react';
import ReviewActionSheet from '../../../../components/reviews/ReviewActionSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { rating: number; text: string }) => Promise<void> | void;
  initialData?: {
    rating?: number | null;
    text?: string | null;
  };
};

const CourseReviewComposerSheet: React.FC<Props> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
}) => {
  return (
    <ReviewActionSheet
      visible={visible}
      onClose={onClose}
      title={'แชร์ประสบการณ์การเรียนรู้ของคุณ'}
      placeholder="แสดงความคิดเห็น..."
      showRating
      requireRating={false}
      requireText
      onPressBack={onClose}
      onPressSubmit={onSubmit}
      initialRating={initialData?.rating ?? 0}
      initialText={initialData?.text ?? ''}
      submitLabel="เขียนรีวิว"
    />
  );
};

export default CourseReviewComposerSheet;
