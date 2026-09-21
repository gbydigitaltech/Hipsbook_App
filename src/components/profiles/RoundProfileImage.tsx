import React, { useMemo } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
} from 'react-native';
import RoundProfileIcon from '../../assets/icons/RoundProfileIcon';
import { useResponsive } from '../../helpers/responsive';
import { AppColors, AVATAR_COLORS } from '../../styles/colors';
import { RoundProfileImageProps } from '../../types/ui/profiles/round-profile-image.props';
import AppText from '../texts/AppText';
import { PRESSED_OPACITY } from '../../styles/sharedstyles';

let splitGraphemes: (s: string) => string[];
try {
  const GraphemeSplitter = require('grapheme-splitter');
  const splitter = new GraphemeSplitter();
  splitGraphemes = (s: string) => splitter.splitGraphemes(s ?? '');
} catch {
  splitGraphemes = (s: string) => Array.from((s ?? '').normalize('NFC'));
}

const getInitials = (name?: string, max = 2) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    const a = splitGraphemes(parts[0])[0] ?? '';
    const b = splitGraphemes(parts[1])[0] ?? '';
    return (a + b).toUpperCase();
  }

  const chars = splitGraphemes(parts[0] ?? '');
  return chars.slice(0, max).join('').toUpperCase();
};

const getColorFromName = (name?: string, palette = AVATAR_COLORS) => {
  if (!name) return palette[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = Math.imul(hash, 31) + name.charCodeAt(i);
  }

  const index = Math.abs(hash) % palette.length;
  return palette[index];
};

const RoundProfileImage: React.FC<RoundProfileImageProps> = ({
  source,
  imageUrl,
  size = 50,
  onPress,
  onLongPress,
  disabled,
  hitSlop = 6,
  name,
}) => {
  const { moderateScale, responsiveRadius, clamp } = useResponsive();

  const scaledSize = clamp(moderateScale(size), 48, 160);
  const radius = responsiveRadius(scaledSize / 2);

  const resolvedSource = useMemo<ImageSourcePropType | undefined>(() => {
    if (source) return source;

    if (typeof imageUrl === 'string' && imageUrl.trim()) {
      return { uri: imageUrl.trim() };
    }

    return undefined;
  }, [source, imageUrl]);

  const hasImage = !!resolvedSource;

  const initials = useMemo(() => getInitials(name, 2), [name]);
  const bgColor = useMemo(() => getColorFromName(name), [name]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="imagebutton"
      accessibilityLabel="Profile image"
      style={({ pressed }) => [
        {
          width: scaledSize,
          height: scaledSize,
          borderRadius: radius,
          opacity: pressed ? PRESSED_OPACITY : 1,
          transform: [{ scale: pressed ? PRESSED_OPACITY : 1 }],
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: hasImage
            ? AppColors.cardBackgroundSecondary
            : bgColor,
          overflow: 'hidden',
        },
      ]}
    >
      {hasImage ? (
        <Image
          source={resolvedSource}
          resizeMode="cover"
          style={[
            styles.image,
            { width: scaledSize, height: scaledSize, borderRadius: radius },
          ]}
        />
      ) : name ? (
        <AppText
          fontWeight="semiBold"
          fontSize={scaledSize / 2.5}
          style={{ color: AppColors.white }}
        >
          {initials || '?'}
        </AppText>
      ) : (
        <RoundProfileIcon size={scaledSize * 0.6} color={AppColors.white} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: 'transparent',
  },
});

export default React.memo(RoundProfileImage);
