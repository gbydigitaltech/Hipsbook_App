import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import AppBackButton from '../../components/buttons/AppBackButton';
import AppText from '../../components/texts/AppText';
import { IS_Android, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import {
  androidSafeTop,
  AppFontSize,
  iosSafeTop,
} from '../../styles/sharedstyles';

export interface AppScreenHeaderProps {
  /** Screen title, centered. */
  title?: string;
  /** Show the back button on the left (default: shown). */
  showBack?: boolean;
  /** Right-side action/element, e.g. a save or menu button. */
  rightAction?: React.ReactNode;
  containerStyle?: ViewStyle;
}

/** Back-button size — used as the equal left/right slot width so the title is truly centered. */
const SIDE_SIZE = IS_TABLET ? 48 : 40;

/**
 * Standard screen header.
 *
 * Laid out as a row [back] [title] [right], same as the course detail page.
 * The back button takes real space in the row instead of floating absolutely
 * like other screens, which let long titles overlap it and leave no room for a right button.
 *
 * Left and right slots are always equal width, so the title stays centered even without a right button.
 */
const AppScreenHeader: React.FC<AppScreenHeaderProps> = ({
  title,
  showBack = true,
  rightAction,
  containerStyle,
}) => {
  const { scale, verticalScale } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: IS_Android
            ? verticalScale(androidSafeTop)
            : verticalScale(iosSafeTop),
        },
        side: {
          width: scale(SIDE_SIZE),
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          flex: 1,
          textAlign: 'center',
          marginHorizontal: scale(8),
        },
      }),
    [scale, verticalScale],
  );

  return (
    <View style={[styles.row, containerStyle]}>
      <View style={styles.side}>
        {showBack ? <AppBackButton size={SIDE_SIZE} /> : null}
      </View>

      {!!title && (
        <AppText
          fontSize={AppFontSize.h1}
          fontWeight="semiBold"
          style={styles.title}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </AppText>
      )}

      <View style={styles.side}>{rightAction}</View>
    </View>
  );
};

export default AppScreenHeader;
