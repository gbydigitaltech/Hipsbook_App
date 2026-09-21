import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import RatingIcon from '../../assets/icons/RatingIcon';
import { useResponsive } from '../../helpers/responsive';
import { PRESSED_OPACITY } from '../../styles/sharedstyles';

type Props = {
  value: number;
  onChange?: (next: number) => void;
  size?: number;
  disabled?: boolean;
  spacing?: number;
};

const clamp = (n: number) => Math.max(0, Math.min(5, n));

const PressableRating: React.FC<Props> = ({
  value,
  onChange,
  size = 22,
  disabled = false,
  spacing = 8,
}) => {
  const { scale } = useResponsive();

  const filled = useMemo(() => clamp(Math.floor(value || 0)), [value]);
  const gap = useMemo(() => scale(spacing), [scale, spacing]);

  const handlePressStar = (starValue: number) => {
    if (disabled) return;

    const next = filled === starValue ? 0 : starValue;
    onChange?.(next);
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = i < filled;

        return (
          <Pressable
            key={i}
            disabled={disabled}
            onPress={() => handlePressStar(starValue)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              { opacity: pressed ? PRESSED_OPACITY : 1 },
              i !== 4 && { marginRight: gap },
            ]}
          >
            <RatingIcon size={size} color={isFilled ? '#F4A700' : '#D9D9D9'} />
          </Pressable>
        );
      })}
    </View>
  );
};

export default PressableRating;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
