import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const LockIcon: React.FC<Props> = ({
  size = 24,
  color = AppColors.primary,
  strokeWidth = 2,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size * 0.95)}
      viewBox="0 0 18 20"
      fill="none"
    >
      <Path
        d="M1 11C1 9.114 1 8.172 1.586 7.586C2.172 7 3.114 7 5 7H13C14.886 7 15.828 7 16.414 7.586C17 8.172 17 9.114 17 11V13C17 15.828 17 17.243 16.121 18.121C15.243 19 13.828 19 11 19H7C4.172 19 2.757 19 1.879 18.121C1 17.243 1 15.828 1 13V11Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13 6V5C13 3.93913 12.5786 2.92172 11.8284 2.17157C11.0783 1.42143 10.0609 1 9 1C7.93913 1 6.92172 1.42143 6.17157 2.17157C5.42143 2.92172 5 3.93913 5 5V6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="13" r="2" fill={color} />
    </Svg>
  );
};

export default LockIcon;
