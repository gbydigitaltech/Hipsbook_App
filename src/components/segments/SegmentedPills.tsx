import React, { memo, useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  Option,
  SegmentedPillsProps,
} from '../../types/ui/segments/segmented-pills.props';
import AppText from '../texts/AppText';
import { PRESSED_OPACITY } from '../../styles/sharedstyles';

/** Normalize option to { label, value } shape */
const normalizeOption = <V extends string | number>(option: Option<V>) =>
  typeof option === 'string' ? { label: option, value: option as V } : option;

function SegmentedPills<V extends string | number>({
  options, // Pill options
  value, // Selected value
  onChange, // Selection callback
  spacing = 10, // Gap between pills
  radius = 999, // Pill border radius
  paddingVertical = 4, // Pill vertical padding
  paddingHorizontal = 22, // Pill horizontal padding
  fontSize = 14, // Text size
  activeBackgroundColor = AppColors.primary, // Selected pill background
  inactiveBackgroundColor = AppColors.backgroundInteractive, // Unselected pill background
  activeTextColor = AppColors.white, // Selected text color
  inactiveTextColor = AppColors.white, // Unselected text color
}: SegmentedPillsProps<V>) {
  const { moderateScale, responsiveSpacing, responsiveRadius } =
    useResponsive();

  const listRef = useRef<FlatList<Option<V>> | null>(null);

  const renderItem = ({ item, index }: { item: Option<V>; index: number }) => {
    const { label, value: optionValue } = normalizeOption(item);
    const isSelected = value === optionValue;

    return (
      <Pressable
        key={`${String(optionValue)}-${index}`}
        onPress={() => onChange(optionValue)}
        style={({ pressed }) => [
          styles.pillButton,
          {
            marginRight:
              index === options.length - 1 ? 0 : responsiveSpacing(spacing),
            paddingVertical: moderateScale(paddingVertical),
            paddingHorizontal: moderateScale(paddingHorizontal),
            borderRadius: responsiveRadius(radius),
            backgroundColor: isSelected
              ? activeBackgroundColor
              : inactiveBackgroundColor,
            opacity: pressed ? PRESSED_OPACITY : 1,
          },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isSelected }}
      >
        <AppText
          fontSize={fontSize}
          style={[
            styles.text,
            { color: isSelected ? activeTextColor : inactiveTextColor },
          ]}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </Pressable>
    );
  };

  // Keep selected pill near center when value changes
  useEffect(() => {
    if (!listRef.current) return;

    const index = options.findIndex(opt => {
      const { value: optionValue } = normalizeOption(opt);
      return optionValue === value;
    });

    if (index < 0) return;

    try {
      listRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    } catch {
      // Ignore out-of-range / not-yet-measured index errors
    }
  }, [value, options]);

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={options}
      renderItem={renderItem}
      keyExtractor={(item, i) =>
        typeof item === 'string' ? item : `${item.value}-${i}`
      }
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pillButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});

export default memo(SegmentedPills) as <V extends string | number>(
  props: SegmentedPillsProps<V>,
) => React.ReactElement;
