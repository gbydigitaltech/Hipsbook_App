/** Props for whitelist toggle button component */
export interface WhitelistButtonProps {
  /** Current whitelist state */
  isWhitelisted: boolean;

  /** Callback fired when toggle is requested */
  onToggle?: (next: boolean) => void;

  /** Icon size in pixels */
  iconSize?: number;

  /** Button width in pixels */
  buttonWidth?: number;

  /** Button height in pixels */
  buttonHeight?: number;

  /** Button border radius in pixels or fully rounded */
  borderRadius?: number | 'full';

  /** Disable interaction */
  disabled?: boolean;

  /** Test identifier for E2E/UI tests */
  testID?: string;

  /** Icon color when active */
  activeIconColor?: string;

  /** Background color when active */
  activeBgColor?: string;

  /** Icon color when inactive */
  inactiveIconColor?: string;

  /** Background color when inactive */
  inactiveBgColor?: string;

  /** Opacity applied while pressed */
  pressedOpacity?: number;

  /** Scale applied while pressed */
  pressedScale?: number;

  /** Android ripple color */
  rippleColor?: string;
}
