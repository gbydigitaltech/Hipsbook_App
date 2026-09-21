import { GestureResponderEvent, ImageSourcePropType } from 'react-native';

/** Props for round profile image / avatar component */
export type RoundProfileImageProps = {
  source?: ImageSourcePropType;
  imageUrl?: string | null;
  size?: number;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  hitSlop?: number;
  name?: string;
  palette?: readonly string[];
};
