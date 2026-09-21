import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import CloseIcon from '../../assets/icons/CloseIcon';
import MoreVerticalIcon from '../../assets/icons/search/MoreVerticalIcon';
import SearchIcon from '../../assets/icons/search/SearchIcon';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';
import AppTextInput from '../inputs/AppTextInput';

export type SearchWithFilterBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  iconPosition?: 'left' | 'right';
  onPressMore?: () => void;
  onExpandChange?: (expanded: boolean) => void;
  onSubmit?: () => void;
};

const SearchWithFilterBar: React.FC<SearchWithFilterBarProps> = ({
  value,
  onChangeText,
  placeholder = 'ค้นหา',
  containerStyle,
  iconPosition = 'right',
  onPressMore,
  onExpandChange,
  onSubmit,
}) => {
  const { scale, verticalScale } = useResponsive();

  const [expanded, setExpanded] = useState(false);
  const [inputMounted, setInputMounted] = useState(false);
  const [showRealInput, setShowRealInput] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const progress = useRef(new Animated.Value(0)).current;
  const transitionRef = useRef(false);
  const mountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchIconSize = IS_TABLET ? 34 : 28;
  const moreIconSize = IS_TABLET ? 26 : 22;
  const rowHeight = verticalScale(IS_TABLET ? 64 : 54);

  const searchSlotWidth = scale(40);

  const leadingSlotWidth = iconPosition === 'left' ? searchSlotWidth : 0;
  const trailingSlotWidth = searchSlotWidth;

  const maxSearchWidth =
    containerWidth > 0
      ? Math.max(0, containerWidth - leadingSlotWidth - trailingSlotWidth)
      : 0;

  const clearMountTimer = () => {
    if (mountTimerRef.current) {
      clearTimeout(mountTimerRef.current);
      mountTimerRef.current = null;
    }
  };

  const expand = () => {
    if (expanded || transitionRef.current) {
      return;
    }

    transitionRef.current = true;
    setExpanded(true);
    setInputMounted(true);
    onExpandChange?.(true);

    clearMountTimer();

    if (IS_TABLET) {
      mountTimerRef.current = setTimeout(() => {
        setShowRealInput(true);
      }, 120);
    } else {
      setShowRealInput(true);
    }

    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 1,
      duration: IS_TABLET ? 280 : 230,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start(() => {
      transitionRef.current = false;
    });
  };

  const collapse = () => {
    if (!expanded || transitionRef.current) {
      return;
    }

    transitionRef.current = true;
    clearMountTimer();

    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 0,
      duration: IS_TABLET ? 220 : 180,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start(() => {
      setExpanded(false);
      setInputMounted(false);
      setShowRealInput(false);
      onExpandChange?.(false);
      transitionRef.current = false;
    });
  };

  useEffect(() => {
    return () => {
      clearMountTimer();
      progress.stopAnimation();
    };
  }, [progress]);

  const animatedWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxSearchWidth],
  });

  const inputOpacity = progress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.35, 1],
  });

  const inputTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const leftSearchOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0.15, 0],
  });

  const rightSearchOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0.15, 0],
  });

  const moreOpacity = progress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0.08, 1],
  });

  const handleRootLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: '100%',
          height: rowHeight,
          flexDirection: 'row',
          alignItems: 'center',
        },
        leadingSlot: {
          width: leadingSlotWidth,
          height: rowHeight,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        },
        searchArea: {
          flex: 1,
          height: rowHeight,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minWidth: 0,
        },
        iconButton: {
          width: searchSlotWidth,
          height: rowHeight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedWrapper: {
          height: rowHeight,
          overflow: 'hidden',
          justifyContent: 'center',
        },
        searchInputWrapper: {
          width: maxSearchWidth,
          height: rowHeight,
          justifyContent: 'center',
        },
        trailingSlot: {
          width: trailingSlotWidth,
          height: rowHeight,
          justifyContent: 'center',
          alignItems: 'flex-end',
          position: 'relative',
        },
        overlayFillRight: {
          ...StyleSheet.absoluteFill,
          justifyContent: 'center',
          alignItems: 'flex-end',
        },
        overlayFillCenter: {
          ...StyleSheet.absoluteFill,
          justifyContent: 'center',
          alignItems: 'center',
        },
        trailingButton: {
          width: trailingSlotWidth,
          height: rowHeight,
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
        placeholderInputShell: {
          height: rowHeight,
        },
      }),
    [
      leadingSlotWidth,
      maxSearchWidth,
      rowHeight,
      searchSlotWidth,
      trailingSlotWidth,
    ],
  );

  return (
    <View style={[styles.root, containerStyle]} onLayout={handleRootLayout}>
      {iconPosition === 'left' && (
        <View style={styles.leadingSlot}>
          <Animated.View
            style={[styles.overlayFillCenter, { opacity: leftSearchOpacity }]}
            pointerEvents={!expanded ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={styles.iconButton}
              onPress={expand}
              disabled={expanded || transitionRef.current}
            >
              <SearchIcon color={AppColors.white} size={searchIconSize} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <View style={styles.searchArea}>
        {inputMounted && (
          <Animated.View
            renderToHardwareTextureAndroid
            style={[
              styles.animatedWrapper,
              {
                width: animatedWidth,
                opacity: inputOpacity,
                transform: [{ translateX: inputTranslateX }],
              },
            ]}
            pointerEvents={expanded ? 'auto' : 'none'}
          >
            <View style={styles.searchInputWrapper}>
              {showRealInput ? (
                <AppTextInput
                  value={value}
                  onChangeText={onChangeText}
                  placeholder={placeholder}
                  autoFocus
                  leftIcon={<SearchIcon size={IS_TABLET ? 28 : 24} />}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => {
                        onChangeText('');
                        collapse();
                      }}
                      activeOpacity={PRESSED_OPACITY}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <CloseIcon size={IS_TABLET ? 16 : 14} />
                    </TouchableOpacity>
                  }
                  radius={AppRadius.md}
                  placeholderTextColor={AppColors.primary}
                  returnKeyType="search"
                  enterKeyHint="search"
                  onSubmitEditing={onSubmit}
                  fontSize={AppFontSize.subtitle}
                  inputWrapperStyle={{
                    height: rowHeight,
                    minHeight: rowHeight,
                  }}
                />
              ) : (
                <View style={styles.placeholderInputShell} />
              )}
            </View>
          </Animated.View>
        )}
      </View>

      <View style={styles.trailingSlot}>
        {iconPosition === 'right' && (
          <Animated.View
            style={[styles.overlayFillRight, { opacity: rightSearchOpacity }]}
            pointerEvents={!expanded ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={styles.trailingButton}
              onPress={expand}
              disabled={expanded || transitionRef.current}
            >
              <SearchIcon color={AppColors.white} size={searchIconSize} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View
          style={[styles.overlayFillRight, { opacity: moreOpacity }]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.trailingButton}
            activeOpacity={PRESSED_OPACITY}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onPressMore ?? (() => {})}
            disabled={!expanded}
          >
            <MoreVerticalIcon size={moreIconSize} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default React.memo(SearchWithFilterBar);
