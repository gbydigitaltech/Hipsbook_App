import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';
import AppText from '../texts/AppText';

export interface AppListGroupProps {
  /** Optional group heading, e.g. "My account". */
  label?: string;
  /** Rows in the group — usually several AppListTile items. */
  children: React.ReactNode;
  containerStyle?: ViewStyle;
}

/**
 * A single-card list group.
 *
 * Wraps all rows in one framed card with thin dividers, like a system
 * settings screen, instead of many floating cards that look blocky and
 * waste space; a familiar pattern that reads as one set.
 *
 * Child rows get the `grouped` prop automatically to avoid nested frames.
 */
const AppListGroup: React.FC<AppListGroupProps> = ({
  label,
  children,
  containerStyle,
}) => {
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: { width: '100%' },
        label: {
          color: AppColors.textTertiary,
          marginBottom: verticalScale(8),
          marginLeft: scale(4),
        },
        card: {
          backgroundColor: AppColors.cardBackgroundSecondary,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          borderRadius: responsiveRadius(AppRadius.lg),
          overflow: 'hidden',
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: AppColors.border,
          marginLeft: scale(16),
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  // Keep only truthy children so no divider dangles when a row is hidden.
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {!!label && (
        <AppText fontSize={AppFontSize.caption} style={styles.label}>
          {label}
        </AppText>
      )}

      <View style={styles.card}>
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {React.isValidElement(child)
              ? React.cloneElement(
                  child as React.ReactElement<{ grouped?: boolean }>,
                  { grouped: true },
                )
              : child}
            {index < items.length - 1 ? <View style={styles.divider} /> : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

export default AppListGroup;
