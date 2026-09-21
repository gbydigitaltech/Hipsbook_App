import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppSelectProps,
  SelectItem,
} from '../../types/ui/selects/select.props';
import AppTextInput from '../inputs/AppTextInput';
import AppText from '../texts/AppText';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';

const SELECT_CONSTANTS = {
  LABEL_FONT_SIZE: 16,
  VALUE_FONT_SIZE: 16,
  INPUT_PADDING_HORIZONTAL: 16,
  LABEL_SPACING: 6,
  ROW_PADDING_VERTICAL: 12,
  SHEET_CORNER_RADIUS: 20,
  SHEET_FIXED_HEIGHT: 600,
  INPUT_RADIUS: AppRadius.md,
  ROW_GAP: 8,
  AUTOFOCUS_THRESHOLD: 8,
} as const;

function AppSelect<T extends string | number = string>({
  label,
  labelFontSize,
  value = null,
  items,
  onChange,
  placeholder = 'เลือก',
  textColor = AppColors.white,
  placeholderColor = AppColors.textTertiary,
  fontSize = SELECT_CONSTANTS.VALUE_FONT_SIZE,
  fontWeight = 'regular',
  disabled = false,
  hasError = false,
  style,
  inputWrapperStyle,
  textStyle,
  backgroundColor = AppColors.backgroundInteractive,
  radius = SELECT_CONSTANTS.INPUT_RADIUS,
  searchable = true,
}: AppSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  const listRef = useRef<FlatList<SelectItem<T>>>(null);

  const {
    scale,
    verticalScale,
    moderateScale,
    responsiveRadius,
    responsiveSpacing,
    hairlineWidth,
    MIN_TAP,
  } = useResponsive();

  const styles = useMemo(
    () =>
      createStyles({
        scale,
        verticalScale,
        responsiveSpacing,
        responsiveRadius,
      }),
    [scale, verticalScale, responsiveSpacing, responsiveRadius],
  );

  const labelFontSizeToUse = moderateScale(
    labelFontSize ?? SELECT_CONSTANTS.LABEL_FONT_SIZE,
    0.5,
  );
  const valueFontSizeToUse = moderateScale(fontSize, 0.5);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setKeyboardHeight(0);
    }
  }, [open]);

  useEffect(() => {
    const onShow = (e: any) => {
      setKeyboardHeight(e?.endCoordinates?.height ?? 0);
    };

    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub1 = Keyboard.addListener('keyboardWillShow', onShow);
    const hideSub1 = Keyboard.addListener('keyboardWillHide', onHide);
    const showSub2 = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub2 = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      showSub1.remove();
      hideSub1.remove();
      showSub2.remove();
      hideSub2.remove();
    };
  }, []);

  const selectedItem = useMemo(
    () => items.find(option => String(option.value) === String(value)) ?? null,
    [items, value],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter(option => {
      const labelText = option.label?.toString().toLowerCase() ?? '';
      const valueText = String(option.value ?? '').toLowerCase();

      return (
        labelText.includes(normalizedQuery) ||
        valueText.includes(normalizedQuery)
      );
    });
  }, [items, query]);

  const layout = useMemo(() => {
    const borderColor = disabled
      ? 'transparent'
      : hasError
      ? AppColors.danger
      : open
      ? AppColors.primary
      : AppColors.border;

    const selectInputWrapperStyle: StyleProp<ViewStyle> = {
      backgroundColor,
      borderRadius: responsiveRadius(radius),
      borderColor,
      borderWidth: hairlineWidth,
      opacity: disabled ? 0.6 : 1,
      minHeight: Math.max(MIN_TAP, verticalScale(48)),
      paddingHorizontal: responsiveSpacing(
        SELECT_CONSTANTS.INPUT_PADDING_HORIZONTAL,
      ),
      paddingVertical: 0,
    };

    const sheetHeight = Math.min(
      verticalScale(SELECT_CONSTANTS.SHEET_FIXED_HEIGHT),
      windowHeight * 0.82,
    );

    const listRowMinHeight = Math.max(MIN_TAP, verticalScale(50));

    return {
      labelSpacing: responsiveSpacing(SELECT_CONSTANTS.LABEL_SPACING),
      selectInputWrapperStyle,
      sheetHeight,
      sheetCornerRadius: responsiveRadius(SELECT_CONSTANTS.SHEET_CORNER_RADIUS),
      listRowMinHeight,
      listRowPaddingVertical: responsiveSpacing(
        SELECT_CONSTANTS.ROW_PADDING_VERTICAL,
      ),
      listRowPaddingHorizontal: responsiveSpacing(14),
      rowGap: verticalScale(SELECT_CONSTANTS.ROW_GAP),
      rowStride: listRowMinHeight + verticalScale(SELECT_CONSTANTS.ROW_GAP),
      listBottomPadding:
        verticalScale(8) + (keyboardHeight > 0 ? keyboardHeight : 0),
    };
  }, [
    backgroundColor,
    radius,
    disabled,
    hasError,
    open,
    hairlineWidth,
    verticalScale,
    responsiveRadius,
    responsiveSpacing,
    MIN_TAP,
    windowHeight,
    keyboardHeight,
  ]);

  const iconSize = Math.round(scale(20));

  const handleOpenSelect = () => {
    if (!disabled) setOpen(true);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setOpen(false);
  };

  // Scroll to the currently selected item when the sheet opens.
  useEffect(() => {
    if (!open || !selectedItem) return;
    const index = items.findIndex(
      option => String(option.value) === String(value),
    );
    if (index < 0) return;

    const timer = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0.4,
        });
      } catch {
        // ignore – list may not be laid out yet
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [open, selectedItem, items, value]);

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <AppText
          fontSize={labelFontSizeToUse}
          fontWeight="medium"
          style={[styles.label, { marginBottom: layout.labelSpacing }]}
        >
          {label}
        </AppText>
      ) : null}

      <Pressable
        onPress={handleOpenSelect}
        disabled={disabled}
        style={[
          styles.inputWrapper,
          layout.selectInputWrapperStyle,
          inputWrapperStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ disabled, expanded: open }}
      >
        <AppText
          numberOfLines={1}
          fontSize={valueFontSizeToUse}
          fontWeight={fontWeight}
          style={[
            styles.text,
            { color: selectedItem ? textColor : placeholderColor },
            textStyle,
          ]}
        >
          {selectedItem ? selectedItem.label : placeholder}
        </AppText>

        <Ionicons
          name="chevron-down"
          size={Math.round(scale(18))}
          color={disabled ? AppColors.disabled : AppColors.white}
          style={styles.chevron}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => {
              if (keyboardHeight > 0) {
                Keyboard.dismiss();
                return;
              }
              handleClose();
            }}
          />

          <View style={styles.sheetWrap} pointerEvents="box-none">
            <Pressable
              style={[
                styles.sheet,
                {
                  height: layout.sheetHeight,
                  borderTopLeftRadius: layout.sheetCornerRadius,
                  borderTopRightRadius: layout.sheetCornerRadius,
                },
              ]}
              onPress={Keyboard.dismiss}
            >
              <View style={styles.handle} />

              <View style={styles.sheetHeader}>
                <View style={styles.headerTextWrap}>
                  <AppText fontSize={AppFontSize.title} fontWeight="semiBold">
                    {label || 'เลือก'}
                  </AppText>
                  <AppText
                    fontSize={AppFontSize.caption}
                    style={styles.headerCount}
                  >
                    {items.length} รายการ
                  </AppText>
                </View>
              </View>

              {searchable && (
                <View style={styles.searchWrap}>
                  <AppTextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="พิมพ์เพื่อค้นหา..."
                    placeholderTextColor={AppColors.textTertiary}
                    inputWrapperStyle={styles.searchInputWrapper}
                    inputStyle={styles.searchInputText}
                    backgroundColor={AppColors.backgroundInteractive}
                    radius={AppRadius.md}
                    autoFocus={
                      items.length > SELECT_CONSTANTS.AUTOFOCUS_THRESHOLD
                    }
                    autoCorrect={false}
                    returnKeyType="search"
                    accessibilityLabel="ค้นหา"
                    leftIcon={
                      <Ionicons
                        name="search"
                        size={iconSize}
                        color={AppColors.primary}
                      />
                    }
                    rightIcon={
                      query.length > 0 ? (
                        <Ionicons
                          name="close-circle"
                          size={iconSize}
                          color={AppColors.disabled}
                        />
                      ) : undefined
                    }
                    onPressRightIcon={
                      query.length > 0 ? () => setQuery('') : undefined
                    }
                  />
                </View>
              )}

              <FlatList<SelectItem<T>>
                ref={listRef}
                data={filteredItems}
                keyExtractor={option => String(option.value)}
                style={styles.list}
                contentContainerStyle={[
                  filteredItems.length === 0
                    ? styles.listContentEmpty
                    : styles.listContent,
                  { paddingBottom: layout.listBottomPadding },
                ]}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                overScrollMode="never"
                bounces={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                initialNumToRender={14}
                onScrollToIndexFailed={info => {
                  setTimeout(() => {
                    try {
                      listRef.current?.scrollToOffset({
                        offset: info.averageItemLength * info.index,
                        animated: false,
                      });
                    } catch {
                      // ignore
                    }
                  }, 60);
                }}
                renderItem={({ item }) => {
                  const isSelected = String(item.value) === String(value);

                  return (
                    <Pressable
                      onPress={() => {
                        onChange?.(item.value);
                        handleClose();
                      }}
                      style={[
                        styles.row,
                        {
                          minHeight: layout.listRowMinHeight,
                          paddingVertical: layout.listRowPaddingVertical,
                          paddingHorizontal: layout.listRowPaddingHorizontal,
                          marginBottom: layout.rowGap,
                        },
                        isSelected && styles.rowSelected,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <AppText
                        numberOfLines={2}
                        fontSize={AppFontSize.subtitle}
                        fontWeight={isSelected ? 'semiBold' : 'regular'}
                        style={[
                          styles.rowText,
                          isSelected && styles.rowTextSelected,
                        ]}
                      >
                        {item.label}
                      </AppText>

                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={Math.round(scale(22))}
                          color={AppColors.primary}
                          style={styles.rowCheck}
                        />
                      ) : null}
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Ionicons
                      name="search-outline"
                      size={Math.round(scale(34))}
                      color={AppColors.disabled}
                      style={styles.emptyIcon}
                    />
                    <AppText
                      fontSize={AppFontSize.body}
                      style={styles.emptyText}
                    >
                      ไม่พบรายการที่ตรงกับ “{query}”
                    </AppText>
                  </View>
                }
              />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default AppSelect;

const createStyles = ({
  scale,
  verticalScale,
  responsiveSpacing,
  responsiveRadius,
}: {
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  responsiveSpacing: (size: number) => number;
  responsiveRadius: (size: number) => number;
}) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },

    label: {
      color: AppColors.white,
    },

    inputWrapper: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },

    text: {
      flex: 1,
    },

    chevron: {
      marginLeft: scale(8),
    },

    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },

    sheetWrap: {
      justifyContent: 'flex-end',
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: AppColors.scrim,
    },

    sheet: {
      backgroundColor: AppColors.sheet,
      borderTopWidth: 1,
      borderColor: AppColors.border,
      paddingHorizontal: scale(18),
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(8),
    },

    handle: {
      alignSelf: 'center',
      width: scale(44),
      height: verticalScale(5),
      borderRadius: responsiveRadius(AppRadius.pill),
      backgroundColor: AppColors.surfaceStrong,
      marginBottom: verticalScale(16),
    },

    sheetHeader: {
      marginBottom: verticalScale(12),
    },

    headerTextWrap: {
      paddingRight: 0,
    },

    headerCount: {
      color: AppColors.disabled,
      marginTop: verticalScale(2),
    },

    searchWrap: {
      marginBottom: verticalScale(10),
    },

    searchInputWrapper: {
      width: '100%',
      minHeight: verticalScale(54),
      borderRadius: responsiveRadius(AppRadius.sm),
      paddingHorizontal: responsiveSpacing(14),
      backgroundColor: AppColors.backgroundInteractive,
      borderWidth: 1,
      borderColor: AppColors.border,
    },

    searchInputText: {
      color: AppColors.white,
      fontSize: 16,
    },

    list: {
      flex: 1,
      minHeight: 120,
    },

    listContent: {
      paddingTop: verticalScale(4),
    },

    listContentEmpty: {
      flexGrow: 1,
      justifyContent: 'center',
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: responsiveRadius(AppRadius.md),
      backgroundColor: AppColors.surfaceSubtle,
      borderWidth: 1,
      borderColor: AppColors.border,
    },

    rowSelected: {
      backgroundColor: AppColors.surfaceActive,
      borderColor: AppColors.primary,
    },

    rowText: {
      flex: 1,
      color: AppColors.white,
    },

    rowTextSelected: {
      color: AppColors.white,
    },

    rowCheck: {
      marginLeft: scale(10),
    },

    emptyWrap: {
      alignItems: 'center',
      paddingHorizontal: responsiveSpacing(16),
    },

    emptyIcon: {
      marginBottom: verticalScale(10),
    },

    emptyText: {
      color: AppColors.disabled,
      textAlign: 'center',
      lineHeight: verticalScale(22),
    },
  });
