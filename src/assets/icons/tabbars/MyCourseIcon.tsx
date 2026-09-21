import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const MyCourseIcon: React.FC<Props> = ({
  size = 19,
  color = AppColors.white,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size + 2)}
      viewBox="0 0 22 17"
      fill="none"
    >
      <Path
        d="M1.00021 10.8462L10.8464 15.7692L20.6925 10.8462M10.8464 1L1.00021 5.92308L10.8464 10.8462L20.6925 5.92308L10.8464 1Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default MyCourseIcon;
