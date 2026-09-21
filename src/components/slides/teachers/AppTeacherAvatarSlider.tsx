import React, { memo, useCallback, useMemo } from 'react';
import type { ImageSourcePropType, ListRenderItemInfo } from 'react-native';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { IS_TABLET } from '../../../constants/platform';
import { useResponsive } from '../../../helpers/responsive';
import TeacherAvatar from '../../teachers/TeacherAvatar';
import { PRESSED_OPACITY } from '../../../styles/sharedstyles';

export type TeacherAvatarItem = {
  id: string; // Unique item key
  source: ImageSourcePropType; // Avatar image source
};

type Props = {
  data: TeacherAvatarItem[]; // Avatar items to render
  onItemPress?: (item: TeacherAvatarItem) => void; // Item press callback
};

// Spacing constants for tablet/mobile
const AVATAR_SPACING = IS_TABLET ? 18 : 14;
const AVATAR_EDGE_SPACING = IS_TABLET ? 12 : 10;
const AVATAR_SIZE = IS_TABLET ? 120 : 100;
const LIST_VERTICAL_PADDING = IS_TABLET ? 6 : 4;

const AppTeacherAvatarSlider: React.FC<Props> = ({ data, onItemPress }) => {
  const { scale, responsiveSpacing } = useResponsive();

  const avatarSize = useMemo(() => scale(AVATAR_SIZE), [scale]);
  const avatarSpacing = useMemo(
    () => responsiveSpacing(AVATAR_SPACING),
    [responsiveSpacing],
  );
  const avatarEdgeSpacing = useMemo(
    () => responsiveSpacing(AVATAR_EDGE_SPACING),
    [responsiveSpacing],
  );
  const listVerticalPadding = useMemo(
    () => responsiveSpacing(LIST_VERTICAL_PADDING),
    [responsiveSpacing],
  );

  const itemFullWidth = useMemo(
    () => avatarSize + avatarSpacing,
    [avatarSize, avatarSpacing],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => {
      return {
        length: itemFullWidth,
        offset: itemFullWidth * index,
        index,
      };
    },
    [itemFullWidth],
  );

  const keyExtractor = useCallback((item: TeacherAvatarItem) => item.id, []);

  const renderTeacherAvatar = useCallback(
    ({ item }: ListRenderItemInfo<TeacherAvatarItem>) => {
      const handlePress = () => {
        onItemPress?.(item);
      };

      return (
        <TouchableOpacity activeOpacity={PRESSED_OPACITY} onPress={handlePress}>
          <TeacherAvatar id={item.id} source={item.source} size={avatarSize} />
        </TouchableOpacity>
      );
    },
    [onItemPress, avatarSize],
  );

  const ItemSeparator = useCallback(
    () => <View style={{ width: avatarSpacing }} />,
    [avatarSpacing],
  );

  const ListEdgeSpacer = useCallback(
    () => <View style={{ width: avatarEdgeSpacing }} />,
    [avatarEdgeSpacing],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderTeacherAvatar}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={ListEdgeSpacer}
        ListFooterComponent={ListEdgeSpacer}
        getItemLayout={getItemLayout}
        initialNumToRender={5}
        windowSize={5}
        contentContainerStyle={{
          paddingVertical: listVerticalPadding,
        }}
      />
    </View>
  );
};

export default memo(AppTeacherAvatarSlider);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
});
