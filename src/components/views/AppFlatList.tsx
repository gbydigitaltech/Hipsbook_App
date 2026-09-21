import React, { forwardRef, useMemo } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '../../helpers/responsive';
import {
  sharedBottomSpace,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import { AppFlatListProps } from '../../types/ui/views/view.props';
import AppSafeView from './AppSafeView';

const AppFlatList = forwardRef<FlatList, AppFlatListProps>(
  (
    {
      withHorizontalPadding = true,
      extraBottomSpace = sharedBottomSpace,
      staticHeader,
      header,
      footer,
      contentContainerStyle,
      ...flatListProps
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets();
    const { scale, verticalScale } = useResponsive();

    const bottomSpacer = insets.bottom + extraBottomSpace;

    const styles = useMemo(
      () =>
        StyleSheet.create({
          keyboardAvoid: { flex: 1 },
          safeContainer: { flex: 1 },
          innerContainer: {
            flex: 1,
            width: '100%',
            paddingHorizontal: withHorizontalPadding
              ? scale(sharedPaddingHorizontal)
              : 0,
          },
          staticHeaderWrapper: {},
        }),
      [scale, withHorizontalPadding],
    );

    const content = (
      <AppSafeView style={styles.safeContainer}>
        <View style={styles.innerContainer}>
          {staticHeader ? (
            <View style={styles.staticHeaderWrapper}>{staticHeader}</View>
          ) : null}

          <FlatList
            ref={ref}
            ListHeaderComponent={header ?? null}
            ListFooterComponent={footer ?? null}
            contentContainerStyle={[
              { paddingBottom: verticalScale(bottomSpacer) },
              contentContainerStyle,
            ]}
            {...flatListProps}
          />
        </View>
      </AppSafeView>
    );

    if (Platform.OS === 'ios') {
      return (
        <KeyboardAvoidingView style={styles.keyboardAvoid} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      );
    }

    return content;
  },
);

export default AppFlatList;
