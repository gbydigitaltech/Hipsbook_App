import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import AppBackButton from '../../../components/buttons/AppBackButton';
import MoreVerticalButton from '../../../components/buttons/MoreVerticalButton';
import AppText from '../../../components/texts/AppText';
import Player from '../../../components/videos/Player';

import { useResponsive } from '../../../helpers/responsive';

import MoreMenuPopover from '../../../components/popovers/MoreMenuPopover';
import { IS_TABLET } from '../../../constants/platform';
import { AppColors } from '../../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  sharedPaddingHorizontal,
} from '../../../styles/sharedstyles';

export type ClassroomTabKey = 'ALL' | 'LEARN' | 'BUY_MORE';

type Props = {
  topInset: number;
  backSize: number;

  title?: string;

  // optional callbacks
  onPressLessonDetail?: () => void;
  onPressCourseAbout?: () => void;
  onPressDocuments?: () => void;
  onPressComments?: () => void;

  playingMediaId?: string;
  playingLessonId?: string;
  coverUrl?: string;
  onFullscreenChange: (v: boolean) => void;

  activeTab: ClassroomTabKey;
  onChangeTab: (t: ClassroomTabKey) => void;
};

const GRADIENT_ANGLE = 182.96;

const ClassroomHeader: React.FC<Props> = ({
  topInset,
  backSize,
  title,

  onPressLessonDetail,
  onPressCourseAbout,
  onPressDocuments,
  onPressComments,

  playingMediaId,
  playingLessonId,
  coverUrl,
  onFullscreenChange,

  activeTab,
  onChangeTab,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  // menu state
  const moreRef = React.useRef<View>(null);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const openMenu = React.useCallback(() => {
    requestAnimationFrame(() => {
      moreRef.current?.measureInWindow((x, y, width, height) => {
        setAnchorRect({ x, y, width, height });
        setMenuVisible(true);
      });
    });
  }, []);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        headerRow: {
          marginTop: topInset,
          paddingHorizontal: scale(sharedPaddingHorizontal),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: backSize,
        },

        sideBox: {
          width: backSize,
          height: backSize,
          justifyContent: 'center',
          alignItems: 'flex-start',
        },

        titleBox: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: scale(10),
        },

        headerTitle: {
          color: AppColors.textPrimary,
          textAlign: 'center',
          flexShrink: 1,
          flexWrap: 'wrap',
        },

        playerContainer: {
          marginTop: verticalScale(IS_TABLET ? 24 : 20),
          gap: verticalScale(IS_TABLET ? 18 : 12),
          flexDirection: 'column',
        },
        coverBox: {
          width: '100%',
          aspectRatio: 16 / 9,
          marginHorizontal: 0,
          borderRadius: 0,
          overflow: 'hidden',
        },
        coverImage: { width: '100%', height: '100%' },

        segWrap: {
          paddingHorizontal: scale(sharedPaddingHorizontal),
          paddingTop: verticalScale(4),
          paddingBottom: verticalScale(IS_TABLET ? 18 : 14),
        },
        segContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: AppColors.backgroundInteractive,
          borderRadius: responsiveRadius(AppRadius.pill),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          padding: scale(4),
          gap: scale(4),
        },

        segItem: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: verticalScale(IS_TABLET ? 12 : 10),
          borderRadius: responsiveRadius(AppRadius.pill),
          overflow: 'hidden',
        },

        segGradient: {
          ...StyleSheet.absoluteFillObject,
        },

        segText: { color: AppColors.textSecondary },
        segTextActive: { color: AppColors.white },
      }),
    [scale, verticalScale, topInset, backSize, responsiveRadius],
  );

  const renderSegItem = (key: ClassroomTabKey, label: string) => {
    const isActive = activeTab === key;

    return (
      <Pressable
        key={key}
        onPress={() => onChangeTab(key)}
        style={styles.segItem}
      >
        {isActive && (
          <LinearGradient
            colors={[...AppColors.appButtonGradient]}
            useAngle
            angle={GRADIENT_ANGLE}
            angleCenter={{ x: 0.5, y: 0.5 }}
            style={styles.segGradient}
          />
        )}
        <AppText
          fontSize={AppFontSize.body}
          fontWeight="semiBold"
          style={[styles.segText, isActive ? styles.segTextActive : null]}
        >
          {label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.sideBox}>
          <AppBackButton size={backSize} />
        </View>

        <View style={styles.titleBox}>
          <AppText
            fontSize={AppFontSize.subtitle}
            fontWeight="semiBold"
            numberOfLines={2}
            ellipsizeMode="tail"
            style={styles.headerTitle}
          >
            {title ?? ''}
          </AppText>
        </View>

        {/* wrap with ref for measure */}
        <View style={styles.sideBox} ref={moreRef} collapsable={false}>
          <MoreVerticalButton onPress={openMenu} />
        </View>
      </View>

      <View style={styles.playerContainer}>
        {playingMediaId ? (
          <Player
            key={String(playingMediaId)}
            mediaId={playingMediaId}
            lessonId={playingLessonId}
            onFullscreenChange={onFullscreenChange}
          />
        ) : coverUrl ? (
          <View style={styles.coverBox}>
            <Image
              source={{ uri: coverUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={styles.coverBox} />
        )}

        <View style={styles.segWrap}>
          <View style={styles.segContainer}>
            {renderSegItem('ALL', 'ทั้งหมด')}
            {renderSegItem('LEARN', 'เรียนได้')}
            {renderSegItem('BUY_MORE', 'ซื้อเพิ่ม')}
          </View>
        </View>
      </View>

      <MoreMenuPopover
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorRect={anchorRect}
        items={[
          {
            key: 'lesson_detail',
            label: 'รายละเอียดบทเรียน',
            onPress: () => onPressLessonDetail?.(),
          },
          {
            key: 'course_about',
            label: 'เกี่ยวกับหลักสูตร',
            onPress: () => onPressCourseAbout?.(),
          },
          {
            key: 'documents',
            label: 'เอกสารที่เกี่ยวข้อง',
            onPress: () => onPressDocuments?.(),
          },
          {
            key: 'comments',
            label: 'ความคิดเห็น',
            onPress: () => onPressComments?.(),
          },
        ]}
        width={240}
      />
    </View>
  );
};

export default ClassroomHeader;
