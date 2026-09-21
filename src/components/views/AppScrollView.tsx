import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '../../helpers/responsive';
import {
  sharedBottomSpace,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import { AppScrollViewProps } from '../../types/ui/views/view.props';
import AppSafeView from './AppSafeView';

const AppScrollView = forwardRef<any, AppScrollViewProps>(
  (
    {
      children,
      contentContainerStyle,
      withHorizontalPadding = true,
      extraBottomSpace = sharedBottomSpace,
      staticHeader,
      header,
      footer,
      showsVerticalScrollIndicator = false,
      keyboardShouldPersistTaps = 'handled',
      ...restScrollProps
    },
    ref,
  ) => {
    const { scale, verticalScale } = useResponsive();
    const insets = useSafeAreaInsets();

    const [containerHeight, setContainerHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);

    const scrollRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      scrollTo: (options: any) => {
        scrollRef.current?.scrollToPosition?.(
          options?.x ?? 0,
          options?.y ?? 0,
          options?.animated ?? true,
        );
      },
      scrollToEnd: (options?: any) => {
        scrollRef.current?.scrollToEnd?.(options);
      },
      getScrollResponder: () => {
        return scrollRef.current?.getScrollResponder?.();
      },
    }));

    const shouldScroll = contentHeight > containerHeight + 8;

    const bottomSpacer = insets.bottom + extraBottomSpace;

    const styles = useMemo(
      () =>
        StyleSheet.create({
          safeContainer: { flex: 1 },
          innerContainer: {
            flex: 1,
            width: '100%',
            backgroundColor: 'transparent',
            paddingHorizontal: withHorizontalPadding
              ? scale(sharedPaddingHorizontal)
              : 0,
          },
          staticHeaderWrapper: {},
        }),
      [scale, withHorizontalPadding],
    );

    return (
      <AppSafeView style={styles.safeContainer}>
        <View
          style={styles.innerContainer}
          onLayout={(e: LayoutChangeEvent) =>
            setContainerHeight(e.nativeEvent.layout.height)
          }
        >
          {staticHeader ? (
            <View style={styles.staticHeaderWrapper}>{staticHeader}</View>
          ) : null}

          <KeyboardAwareScrollView
            innerRef={(instance: any) => {
              scrollRef.current = instance;
            }}
            scrollEnabled={shouldScroll}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            showsVerticalScrollIndicator={
              shouldScroll && showsVerticalScrollIndicator
            }
            contentInsetAdjustmentBehavior="never"
            scrollIndicatorInsets={{
              bottom: verticalScale(bottomSpacer),
            }}
            enableOnAndroid
            enableAutomaticScroll
            extraHeight={120}
            extraScrollHeight={24}
            keyboardOpeningTime={250}
            {...restScrollProps}
            contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
            onContentSizeChange={(_, h) => setContentHeight(h)}
          >
            {header}
            {children}
            {/* Real spacer at the end — guarantees bottom spacing on every screen */}
            <View style={{ height: verticalScale(bottomSpacer) }} />
          </KeyboardAwareScrollView>

          {footer}
        </View>
      </AppSafeView>
    );
  },
);

export default AppScrollView;
