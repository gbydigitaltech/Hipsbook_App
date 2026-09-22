import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';

import { AppColors } from '../../styles/colors';

type ResizeModeKey = 'cover' | 'contain' | 'stretch' | 'center';
type PriorityKey = 'low' | 'normal' | 'high';

type Props = {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ResizeModeKey;
  priority?: PriorityKey;
  placeholderColor?: string;
  /** Local icon shown centered on the placeholder while loading / on error. */
  placeholderIcon?: ImageSourcePropType;
  accessibilityLabel?: string;
};

/**
 * Cached remote image with a loading placeholder and error fallback.
 *
 * Wraps @d11/react-native-fast-image (disk + memory cache, no flicker on
 * re-render). Shows a solid placeholder while loading, when there is no URI,
 * or when the image fails to load. Pass `placeholderIcon` to show the app
 * icon (or any local image) centered on that placeholder. The parent
 * controls size and corner radius.
 */
const AppImage: React.FC<Props> = ({
  uri,
  style,
  resizeMode = 'cover',
  priority = 'normal',
  placeholderColor = AppColors.surfaceSubtle,
  placeholderIcon,
  accessibilityLabel,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const hasUri = !!(uri && uri.trim().length > 0);
  const showImage = hasUri && !failed;

  return (
    <View style={[styles.wrap, style]}>
      {showImage && (
        <FastImage
          style={StyleSheet.absoluteFill}
          source={{
            uri: uri as string,
            priority: FastImage.priority[priority],
            cache: FastImage.cacheControl.immutable,
          }}
          resizeMode={FastImage.resizeMode[resizeMode]}
          accessibilityLabel={accessibilityLabel}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}

      {(!showImage || !loaded) && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.placeholder,
            { backgroundColor: placeholderColor },
          ]}
        >
          {placeholderIcon && (
            <Image
              source={placeholderIcon}
              style={styles.placeholderIcon}
              resizeMode="contain"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    width: '45%',
    height: '45%',
    opacity: 0.35,
  },
});

export default AppImage;
