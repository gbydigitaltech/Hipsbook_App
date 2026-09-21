import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const HeartOutlineIcon: React.FC<Props> = ({
  size = 14,
  color = AppColors.white,
  strokeWidth = 1.5,
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.55 3.084a5.452 5.452 0 0 1 3.852 9.307l-.648.654-.86.854-6.852 6.852L5.19 13.9l-.86-.854-.648-.654a5.453 5.453 0 1 1 7.706-7.712l.654.654.655-.654a5.452 5.452 0 0 1 3.852-1.595Z"
        fill={color}
        fillOpacity={0.16}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default HeartOutlineIcon;
