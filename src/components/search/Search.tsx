import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import CloseIcon from '../../assets/icons/CloseIcon';
import SearchIcon from '../../assets/icons/search/SearchIcon';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import AppTextInput from '../inputs/AppTextInput';

export type SearchProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  trailingAction?: React.ReactNode;
  withHorizontalPadding?: boolean;
  containerStyle?: ViewStyle;
};

export const SEARCH_BAR_HEIGHT = IS_TABLET ? 58 : 48;

const Search: React.FC<SearchProps> = ({
  value,
  onChangeText,
  placeholder = 'ค้นหาคอร์ส',
  onSubmit,
  trailingAction,
  withHorizontalPadding = true,
  containerStyle,
}) => {
  const { scale, verticalScale } = useResponsive();
  const barHeight = verticalScale(SEARCH_BAR_HEIGHT);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(10),
          paddingHorizontal: withHorizontalPadding
            ? scale(sharedPaddingHorizontal)
            : 0,
        },
        field: { flex: 1 },
        inputWrapper: { height: barHeight },
      }),
    [scale, barHeight, withHorizontalPadding],
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.field}>
        <AppTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          leftIcon={
            <SearchIcon size={IS_TABLET ? 24 : 20} color={AppColors.primary} />
          }
          rightIcon={
            value ? (
              <TouchableOpacity
                onPress={() => onChangeText('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="ล้างคำค้นหา"
              >
                <CloseIcon size={IS_TABLET ? 16 : 14} />
              </TouchableOpacity>
            ) : undefined
          }
          radius={AppRadius.md}
          placeholderTextColor={AppColors.textTertiary}
          returnKeyType="search"
          enterKeyHint="search"
          onSubmitEditing={onSubmit}
          fontSize={AppFontSize.subtitle}
          inputWrapperStyle={styles.inputWrapper}
        />
      </View>

      {trailingAction}
    </View>
  );
};

export default Search;
