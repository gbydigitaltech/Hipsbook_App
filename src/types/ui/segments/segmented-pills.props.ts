/** Select option: plain string or explicit label/value object */
export type Option<V extends string | number = string | number> =
  | string
  | { label: string; value: V };

/** Props for segmented pills selector component */
export interface SegmentedPillsProps<
  V extends string | number = string | number,
> {
  /** List of selectable options */
  options: Option<V>[];

  /** Currently selected value (null = no selection) */
  value: V | null;

  /** Callback fired when selection changes */
  onChange: (val: V) => void;

  /** Space between pills in pixels */
  spacing?: number;

  /** Pill border radius in pixels */
  radius?: number;

  /** Vertical padding inside each pill */
  paddingVertical?: number;

  /** Horizontal padding inside each pill */
  paddingHorizontal?: number;

  /** Label font size in pixels */
  fontSize?: number;

  /** Background color for selected pill */
  activeBackgroundColor?: string;

  /** Background color for unselected pills */
  inactiveBackgroundColor?: string;

  /** Text color for selected pill */
  activeTextColor?: string;

  /** Text color for unselected pills */
  inactiveTextColor?: string;
}
