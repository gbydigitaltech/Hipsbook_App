import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  opticalScale?: number;
};

const InfoCircleIcon: React.FC<Props> = ({
  size = 24,
  color = AppColors.primary,
  strokeWidth = 2,
  opticalScale = 1.15,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size * opticalScale)}
      height={verticalScale(size * opticalScale)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <G
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      >
        <Path d="M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0" />
        <Path d="M12 16v-5h-.5m0 5h1M12 8.5V8" />
      </G>
    </Svg>
  );
};

export default InfoCircleIcon;
