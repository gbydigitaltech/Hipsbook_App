import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

export const HeartSolidIcon: React.FC<Props> = ({
  size = 14,
  color = AppColors.primary,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M7.519 2A6.452 6.452 0 0 0 2.98 13.104l.639.645.863.857.003.003 6.85 6.85a1 1 0 0 0 1.413 0l6.85-6.85.002-.002.858-.852.65-.657.002-.002a6.452 6.452 0 0 0-9.068-9.178A6.453 6.453 0 0 0 7.52 2Z"
        fill={color}
      />
    </Svg>
  );
};

export default HeartSolidIcon;
