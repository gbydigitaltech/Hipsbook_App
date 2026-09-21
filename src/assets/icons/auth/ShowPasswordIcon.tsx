import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const ShowPasswordIcon: React.FC<Props> = ({
  size = 20,
  color = AppColors.grayLight,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 20 20"
      fill="none"
    >
      <Path
        d="M12.52 16.6302C11.71 16.8402 10.87 16.9402 10 16.9402C6.73 16.9402 3.8 15.4102 1.8 12.9902C0.4 11.3002 0.4 8.69018 1.8 7.01018C1.96 6.81018 2.14 6.62018 2.32 6.43018"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.2 12.9901C17.4 13.9501 16.45 14.7701 15.4 15.4101L4.59003 4.59006C6.18003 3.61006 8.02003 3.06006 10 3.06006C13.27 3.06006 16.2 4.59006 18.2 7.01006C19.6 8.69006 19.6 11.3101 18.2 12.9901Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.08 9.99992C13.08 10.8499 12.73 11.6199 12.18 12.1799L7.82001 7.81992C8.37001 7.25992 9.15001 6.91992 10 6.91992C11.71 6.91992 13.08 8.28992 13.08 9.99992Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M0.75 0.75L4.59 4.59L7.82 7.82L12.18 12.18L15.41 15.41L19.25 19.25"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default ShowPasswordIcon;
