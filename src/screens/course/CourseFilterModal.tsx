import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import AppButton from '../../components/buttons/AppButton';
import AppText from '../../components/texts/AppText';
import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { useCourseFilter } from '../../hooks/course/useCourseFilter';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';
import { GetCourseListParams } from '../../types/data/courses/course.query.types';

export type CourseFilterState = Omit<
  GetCourseListParams,
  'search' | 'page' | 'limit' | 'signal' | 'priceMin' | 'priceMax'
> & {
  price?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: CourseFilterState) => void;
};

const { height: screenHeight } = Dimensions.get('window');

const PRICE_OPTIONS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: '0-0', label: 'ฟรี' },
  { id: '1-1000', label: '1-1,000' },
  { id: '1000-3000', label: '1,000-3,000' },
  { id: '3000+', label: 'มากกว่า 3,000' },
];

const CourseFilterModal: React.FC<Props> = ({ visible, onClose, onApply }) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const [shouldRender, setShouldRender] = useState(visible);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const {
    filterData,

    selectedMenuId,
    selectedSubmenuId,
    handleMenuPress,
    handleSubmenuPress,
    isMenuSelected,
    isSubmenuSelected,
    resetCourseType,

    selectedPriceId,
    handlePricePress,

    selectedLevelId,
    handleLevelPress,
    resetLevel,
    levelOptions,

    resetFilterState,
  } = useCourseFilter();

  useEffect(() => {
    if (visible) {
      setShouldRender(true);

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
      });
    }
  }, [visible, translateY, backdropOpacity]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: AppColors.scrim,
        },
        flex1: {
          flex: 1,
        },
        bottomWrap: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: AppColors.sheet,
          borderTopWidth: 1,
          borderColor: AppColors.border,
          borderTopLeftRadius: responsiveRadius(AppRadius.sheet),
          borderTopRightRadius: responsiveRadius(AppRadius.sheet),
          paddingHorizontal: scale(16),
          paddingTop: verticalScale(14),
          paddingBottom: verticalScale(24),
          maxHeight: '80%',
        },
        handle: {
          alignSelf: 'center',
          width: scale(IS_TABLET ? 54 : 44),
          height: verticalScale(5),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.surfaceStrong,
          marginBottom: verticalScale(IS_TABLET ? 24 : 20),
        },
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: verticalScale(IS_TABLET ? 18 : 14),
        },
        closeButton: {
          marginRight: scale(-8),
          paddingHorizontal: scale(8),
          paddingVertical: verticalScale(4),
        },
        scrollContent: {
          paddingBottom: verticalScale(10),
        },
        submenuContainer: {
          marginTop: verticalScale(12),
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: scale(10),
        },
        tabBar: {
          marginTop: verticalScale(12),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: AppColors.border,
        },
        tabBarContent: {
          gap: scale(22),
          paddingRight: scale(8),
        },
        tabItem: {
          alignItems: 'center',
          paddingTop: verticalScale(2),
        },
        tabText: {
          color: AppColors.textSecondary,
        },
        tabTextActive: {
          color: AppColors.white,
        },
        tabUnderline: {
          marginTop: verticalScale(8),
          height: verticalScale(3),
          alignSelf: 'stretch',
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: 'transparent',
        },
        tabUnderlineActive: {
          backgroundColor: AppColors.primary,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(6),
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(9),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.surface,
          borderWidth: 1,
          borderColor: AppColors.border,
        },
        chipSelected: {
          backgroundColor: AppColors.primary,
          borderColor: AppColors.primary,
          shadowColor: AppColors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius: 5,
          elevation: 3,
        },
        chipText: {
          color: AppColors.textSecondary,
        },
        chipTextSelected: {
          color: AppColors.white,
        },
        sectionLabel: {
          color: AppColors.white,
          marginBottom: verticalScale(2),
        },
        sectionSpacing: {
          marginTop: verticalScale(24),
        },
        footer: {
          marginTop: verticalScale(20),
          paddingTop: verticalScale(16),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: AppColors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        footerBtn: {
          flex: 1,
          marginBottom: verticalScale(10),
        },
        footerGap: {
          width: scale(12),
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const handleClear = () => {
    resetFilterState();
    onApply({});
  };

  const handleConfirm = () => {
    let category: string[] | undefined;

    if (selectedSubmenuId) {
      category = [selectedSubmenuId];
    } else if (selectedMenuId) {
      category = [selectedMenuId];
    }

    const level = selectedLevelId ? [selectedLevelId] : undefined;
    const price =
      selectedPriceId && selectedPriceId !== 'all'
        ? selectedPriceId
        : undefined;

    const payload: CourseFilterState = {
      category,
      level,
      price,
    };

    onApply(payload);
    onClose();
  };

  const selectedMenu =
    filterData?.menu?.find(menu => menu.id === selectedMenuId) ?? null;
  const selectedSubmenu =
    selectedMenu?.submenu && selectedMenu.submenu.length > 0
      ? selectedMenu.submenu
      : [];

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
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={styles.flex1} onPress={onClose} />
        </Animated.View>

        <View style={styles.bottomWrap} pointerEvents="box-none">
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
          >
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <AppText fontSize={AppFontSize.title} fontWeight="semiBold">
                ตัวกรองการค้นหา
              </AppText>
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <AppText
                style={styles.sectionLabel}
                fontSize={AppFontSize.subtitle}
                fontWeight="medium"
              >
                ประเภทคอร์ส
              </AppText>

              <View style={styles.tabBar}>
                <ScrollView
                  horizontal
                  bounces={false}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabBarContent}
                >
                  <TouchableOpacity
                    activeOpacity={PRESSED_OPACITY}
                    style={styles.tabItem}
                    onPress={resetCourseType}
                  >
                    <AppText
                      fontSize={AppFontSize.body}
                      fontWeight={
                        selectedMenuId === null ? 'semiBold' : 'medium'
                      }
                      style={
                        selectedMenuId === null
                          ? styles.tabTextActive
                          : styles.tabText
                      }
                    >
                      ทั้งหมด
                    </AppText>
                    <View
                      style={[
                        styles.tabUnderline,
                        selectedMenuId === null && styles.tabUnderlineActive,
                      ]}
                    />
                  </TouchableOpacity>

                  {filterData?.menu?.map(menu => {
                    const hasSubmenu =
                      !!menu.submenu && menu.submenu.length > 0;
                    const selected = isMenuSelected(menu.id);

                    return (
                      <TouchableOpacity
                        key={menu.id}
                        activeOpacity={PRESSED_OPACITY}
                        style={styles.tabItem}
                        onPress={() =>
                          hasSubmenu
                            ? handleSubmenuPress(menu.id, null)
                            : handleMenuPress(menu.id, false)
                        }
                      >
                        <AppText
                          fontSize={AppFontSize.body}
                          fontWeight={selected ? 'semiBold' : 'medium'}
                          style={
                            selected ? styles.tabTextActive : styles.tabText
                          }
                        >
                          {menu.label}
                        </AppText>
                        <View
                          style={[
                            styles.tabUnderline,
                            selected && styles.tabUnderlineActive,
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {!!selectedMenu && selectedSubmenu.length > 0 && (
                <View style={styles.submenuContainer}>
                  <TouchableOpacity
                    activeOpacity={PRESSED_OPACITY}
                    style={[
                      styles.chip,
                      isSubmenuSelected(selectedMenu.id, null) &&
                        styles.chipSelected,
                    ]}
                    onPress={() => handleSubmenuPress(selectedMenu.id, null)}
                  >
                    <AppText
                      fontSize={AppFontSize.body}
                      fontWeight="medium"
                      style={
                        isSubmenuSelected(selectedMenu.id, null)
                          ? styles.chipTextSelected
                          : styles.chipText
                      }
                    >
                      ทั้งหมด
                    </AppText>
                  </TouchableOpacity>

                  {selectedSubmenu.map(sub => {
                    const selected = isSubmenuSelected(selectedMenu.id, sub.id);

                    return (
                      <TouchableOpacity
                        key={sub.id}
                        activeOpacity={PRESSED_OPACITY}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() =>
                          handleSubmenuPress(selectedMenu.id, sub.id)
                        }
                      >
                        <AppText
                          fontSize={AppFontSize.body}
                          fontWeight="medium"
                          style={
                            selected ? styles.chipTextSelected : styles.chipText
                          }
                        >
                          {sub.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.sectionSpacing}>
                <AppText
                  style={styles.sectionLabel}
                  fontSize={AppFontSize.subtitle}
                  fontWeight="medium"
                >
                  ช่วงราคา
                </AppText>

                <View style={styles.submenuContainer}>
                  {PRICE_OPTIONS.map(opt => {
                    const selected = selectedPriceId === opt.id;

                    return (
                      <TouchableOpacity
                        key={opt.id}
                        activeOpacity={PRESSED_OPACITY}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => handlePricePress(opt.id)}
                      >
                        <AppText
                          fontSize={AppFontSize.body}
                          fontWeight="medium"
                          style={
                            selected ? styles.chipTextSelected : styles.chipText
                          }
                        >
                          {opt.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.sectionSpacing}>
                <AppText
                  style={styles.sectionLabel}
                  fontSize={AppFontSize.subtitle}
                  fontWeight="medium"
                >
                  ระดับ
                </AppText>

                <View style={styles.submenuContainer}>
                  <TouchableOpacity
                    activeOpacity={PRESSED_OPACITY}
                    style={[
                      styles.chip,
                      selectedLevelId === null && styles.chipSelected,
                    ]}
                    onPress={resetLevel}
                  >
                    <AppText
                      fontSize={AppFontSize.body}
                      fontWeight="medium"
                      style={
                        selectedLevelId === null
                          ? styles.chipTextSelected
                          : styles.chipText
                      }
                    >
                      ทั้งหมด
                    </AppText>
                  </TouchableOpacity>

                  {levelOptions.map(level => {
                    const selected = selectedLevelId === level.id;

                    return (
                      <TouchableOpacity
                        key={level.id}
                        activeOpacity={PRESSED_OPACITY}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => handleLevelPress(level.id)}
                      >
                        <AppText
                          fontSize={AppFontSize.body}
                          fontWeight="medium"
                          style={
                            selected ? styles.chipTextSelected : styles.chipText
                          }
                        >
                          {level.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.footerBtn}>
                <AppButton
                  title="ล้างตัวกรอง"
                  onPress={handleClear}
                  secondary
                  contentStyle={{
                    paddingVertical: verticalScale(IS_IOS ? 18 : 16),
                  }}
                  fontSize={AppFontSize.subtitle}
                />
              </View>

              <View style={styles.footerGap} />

              <View style={styles.footerBtn}>
                <AppButton
                  title="ตกลง"
                  onPress={handleConfirm}
                  contentStyle={{
                    paddingVertical: verticalScale(IS_IOS ? 18 : 16),
                  }}
                  fontSize={AppFontSize.subtitle}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default CourseFilterModal;
