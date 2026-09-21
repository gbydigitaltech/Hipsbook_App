import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import AppText from '../texts/AppText';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';

type MenuItem = {
  key: string;
  label: string;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  anchorRect: { x: number; y: number; width: number; height: number } | null;
  items: MenuItem[];
  width?: number;
};

const MoreMenuPopover: React.FC<Props> = ({
  visible,
  onClose,
  anchorRect,
  items,
  width = 240,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(255, 0, 0, 0)',
        },

        menu: {
          borderRadius: responsiveRadius(AppRadius.lg),
          overflow: 'hidden',
          backgroundColor: AppColors.sheetRaised,
          borderWidth: 1,
          borderColor: AppColors.border,
        },

        item: {
          paddingHorizontal: scale(18),
          height: verticalScale(56),
          justifyContent: 'center',
        },

        itemPressed: {
          backgroundColor: AppColors.surfaceSubtle,
        },

        text: {
          color: AppColors.white,
        },

        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: AppColors.surfaceStrong,
          marginHorizontal: scale(18),
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const positionStyle = React.useMemo<ViewStyle>(() => {
    if (!anchorRect) return { opacity: 0 };

    const padding = scale(12);
    const menuW = scale(width);

    let left = anchorRect.x + anchorRect.width - menuW;
    let top = anchorRect.y + anchorRect.height + verticalScale(10);

    left = Math.max(padding, Math.min(left, screenWidth - menuW - padding));

    const estimatedH =
      verticalScale(56) * items.length + (items.length > 1 ? 1 : 0);

    if (top + estimatedH > screenHeight - padding) {
      top = anchorRect.y - estimatedH - verticalScale(10);
      top = Math.max(padding, top);
    }

    return {
      position: 'absolute',
      left,
      top,
      width: menuW,
    };
  }, [
    anchorRect,
    items.length,
    scale,
    screenWidth,
    screenHeight,
    verticalScale,
    width,
  ]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.menu, positionStyle]} onPress={() => {}}>
          {items.map((it, idx) => (
            <React.Fragment key={it.key}>
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  pressed ? styles.itemPressed : null,
                ]}
                onPress={() => {
                  onClose();
                  it.onPress();
                }}
              >
                <AppText
                  fontSize={AppFontSize.subtitle}
                  fontWeight="semiBold"
                  style={styles.text}
                >
                  {it.label}
                </AppText>
              </Pressable>

              {idx !== items.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </React.Fragment>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default MoreMenuPopover;
