// ProfileIcon.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const ProfileIcon: React.FC<Props> = ({
  size = 20,
  color = AppColors.white,
  strokeWidth = 2,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size * 0.8)}
      height={verticalScale(size)}
      viewBox="0 0 16 20"
      fill="none"
    >
      <Path
        d="M15 19V17C15 15.9391 14.5786 14.9217 13.8284 14.1716C13.0783 13.4214 12.0609 13 11 13H5C3.93913 13 2.92172 13.4214 2.17157 14.1716C1.42143 14.9217 1 15.9391 1 17V19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 9C10.2091 9 12 7.20914 12 5C12 2.79086 10.2091 1 8 1C5.79086 1 4 2.79086 4 5C4 7.20914 5.79086 9 8 9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default ProfileIcon;
