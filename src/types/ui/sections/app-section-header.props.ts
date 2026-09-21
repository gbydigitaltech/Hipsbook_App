import type { StyleProp, ViewStyle } from 'react-native';

/** Props for reusable section header component */
export interface AppSectionHeaderProps {
  /** Section title text */
  title: string;

  /** Optional handler for "See all" action */
  onPressSeeAll?: () => void;

  /** Custom label for the action button (default usually "See all") */
  seeAllLabel?: string;

  /** Optional container style override */
  containerStyle?: StyleProp<ViewStyle>;

  /** Title font size in pixels */
  titleFontSize?: number;

  /** "See all" label font size in pixels */
  seeAllFontSize?: number;
}
