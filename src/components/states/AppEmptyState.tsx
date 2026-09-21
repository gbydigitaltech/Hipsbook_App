import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface AppEmptyStateProps {
  /** Icon from the Ionicons set (same set as the bottom tab bar). */
  icon: IoniconName;
  /** Primary text: says there is nothing here right now. */
  title: string;
  /** Secondary text: says how to get data to show up. */
  description?: string;
  /** Optional button or element below the text. */
  action?: React.ReactNode;
  containerStyle?: ViewStyle;
}

/**
 * Standard empty state for the app.
 *
 * Unifies the "no data" look across screens — previously each screen did its
 * own thing (or none), making the app look unfinished.
 */
const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  containerStyle,
}) => {
  const { scale, verticalScale } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: scale(24),
        },
        /** Thin-outlined circle, same visual language as the app cards (flat, no shadow). */
        iconCircle: {
          width: scale(80),
          height: scale(80),
          borderRadius: AppRadius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: AppColors.surfaceSubtle,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          marginBottom: verticalScale(18),
        },
        title: {
          textAlign: 'center',
          color: AppColors.textSecondary,
        },
        description: {
          textAlign: 'center',
          color: AppColors.textTertiary,
          marginTop: verticalScale(8),
        },
        actionSlot: {
          marginTop: verticalScale(20),
        },
      }),
    [scale, verticalScale],
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={scale(34)} color={AppColors.textTertiary} />
      </View>

      <AppText fontSize={AppFontSize.title} style={styles.title}>
        {title}
      </AppText>

      {!!description && (
        <AppText fontSize={AppFontSize.body} style={styles.description}>
          {description}
        </AppText>
      )}

      {action ? <View style={styles.actionSlot}>{action}</View> : null}
    </View>
  );
};

export default AppEmptyState;
