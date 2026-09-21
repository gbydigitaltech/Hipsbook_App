import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const BackChevronIcon: React.FC<Props> = ({
  size = 20,
  color = AppColors.primary,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 17 17"
      fill="none"
    >
      <Path
        d="M6.76456 8.49998L11.9708 13.7062C12.1479 13.8833 12.2336 14.0899 12.2279 14.326C12.2223 14.5621 12.1307 14.7687 11.9531 14.9458C11.7755 15.1229 11.5689 15.2114 11.3333 15.2114C11.0977 15.2114 10.8911 15.1229 10.7135 14.9458L5.25935 9.50936C5.11768 9.36769 5.01143 9.20832 4.9406 9.03123C4.86977 8.85415 4.83435 8.67707 4.83435 8.49998C4.83435 8.3229 4.86977 8.14582 4.9406 7.96873C5.01143 7.79165 5.11768 7.63227 5.25935 7.49061L10.7135 2.03644C10.8906 1.85936 11.1003 1.77365 11.3425 1.77932C11.5848 1.78498 11.7942 1.87659 11.9708 2.05415C12.1474 2.23171 12.236 2.4383 12.2364 2.67394C12.2369 2.90958 12.1484 3.11618 11.9708 3.29373L6.76456 8.49998Z"
        fill={color}
      />
    </Svg>
  );
};

export default BackChevronIcon;
