import type { ImageSourcePropType } from 'react-native';

/** Props for teacher avatar component */
export interface TeacherAvatarProps {
  /** Optional teacher ID (for keying/tracking) */
  id?: string;

  /** Avatar image source (remote/local) */
  source: ImageSourcePropType;

  /** Avatar size (diameter) in pixels */
  size?: number;

  /** Avatar border color */
  borderColor?: string;

  /** Avatar border width in pixels */
  borderWidth?: number;
}
