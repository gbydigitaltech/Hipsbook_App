import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const BellIcon: React.FC<Props> = ({ size = 19, color = AppColors.white }) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size + 2)} // 21px height
      viewBox="0 0 19 21"
      fill="none"
    >
      <Path
        d="M12.6873 15.9167H6.14394M12.6873 15.9167H16.6024C18.6348 15.9167 18.2914 13.9017 17.2633 12.879C13.5604 9.20108 18.82 0.75 9.41561 0.75C0.0111915 0.75 5.27186 9.2 1.56903 12.879C0.579942 13.8627 0.158526 15.9167 2.22986 15.9167H6.14394M12.6873 15.9167C12.6873 18.0021 11.9853 20.25 9.41561 20.25C6.84594 20.25 6.14394 18.0021 6.14394 15.9167"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default BellIcon;
