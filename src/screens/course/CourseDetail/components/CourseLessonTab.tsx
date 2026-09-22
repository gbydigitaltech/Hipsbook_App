import React, { useEffect } from 'react';
import { View } from 'react-native';
import CourseDetailLessonCard from '../../../../components/cards/CourseDetailLessonCard';
import AppSectionHeader from '../../../../components/sections/AppSectionHeader';
import { IS_TABLET } from '../../../../constants/platform';
import { useResponsive } from '../../../../helpers/responsive';
import { getVideoThumbnailUrl } from '../../../../helpers/videoThumbnail';
import { preloadThumbnails } from '../../../../helpers/thumbnailPreload';
import { LessonGroup } from '../types/group.types';
import { CourseLesson } from '../types/lesson.types';
import { AppFontSize } from '../../../../styles/sharedstyles';

interface Props {
  groups: LessonGroup[];
  onPressLesson: (lesson: CourseLesson) => void;
}

const CourseLessonTab: React.FC<Props> = ({ groups, onPressLesson }) => {
  const { verticalScale } = useResponsive();

  useEffect(() => {
    preloadThumbnails(
      groups.flatMap(g =>
        g.videos.map(v =>
          getVideoThumbnailUrl(v.media_id, IS_TABLET ? 720 : 480),
        ),
      ),
    );
  }, [groups]);

  return (
    <View>
      {groups.map((group, index) => (
        <View key={index} style={{ marginBottom: verticalScale(24) }}>
          <AppSectionHeader
            title={group.title}
            titleFontSize={AppFontSize.subtitle}
            containerStyle={{ marginBottom: verticalScale(IS_TABLET ? 14 : 12) }}
          />

          <View style={{ gap: verticalScale(IS_TABLET ? 20 : 16) }}>
            {group.videos.map((lesson: CourseLesson) => (
              <CourseDetailLessonCard
                key={lesson.id}
                title={lesson.label}
                description={lesson.description}
                price={lesson.price ?? 0}
                is_free={lesson.is_free}
                activate={lesson.activate}
                mediaId={lesson.media_id}
                onPressStart={() => onPressLesson(lesson)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

export default CourseLessonTab;
