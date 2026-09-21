import type { ViewProps } from 'react-native';
import type { LinearGradientProps } from 'react-native-linear-gradient';

/** Props for app background gradient wrapper */
export interface AppBackgroundProps
  extends Omit<
    LinearGradientProps,
    'colors' | 'locations' | 'angle' | 'useAngle' | 'angleCenter'
  > {
  /** Gradient start color */
  startColor?: string;

  /** Gradient end color */
  endColor?: string;

  /** Gradient stop positions as percentages (e.g., [0, 60, 100]) */
  stopsPercent?: number[];

  /** Gradient angle in degrees */
  angle?: number;

  /** Extend background to cover status bar area */
  coverStatusBar?: boolean;

  /** Extra top overshoot space in pixels */
  overshootTopExtra?: number;

  /** Extra bottom overshoot space in pixels */
  overshootBottomExtra?: number;

  /** Pointer event behavior passed to wrapping View */
  pointerEvents?: ViewProps['pointerEvents'];
}
