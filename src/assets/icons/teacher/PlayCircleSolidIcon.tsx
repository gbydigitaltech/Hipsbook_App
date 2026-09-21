import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type PlayCircleSolidIconProps = {
  size?: number;
  color?: string;
};

const PlayCircleSolidIcon = ({
  size = 21,
  color = AppColors.primary,
}: PlayCircleSolidIconProps) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 21 21"
      fill="none"
    >
      <Path
        d="M10.5 21C4.70101 21 0 16.2989 0 10.5C0 4.70101 4.70101 0 10.5 0C16.2989 0 21 4.70101 21 10.5C21 16.2989 16.2989 21 10.5 21ZM9.05299 6.73532C8.98401 6.68932 8.90295 6.66478 8.82 6.66478C8.58805 6.66478 8.4 6.85281 8.4 7.08478V13.9152C8.4 13.9982 8.42457 14.0792 8.47056 14.1482C8.59918 14.3412 8.86001 14.3934 9.05299 14.2647L14.1758 10.8494C14.2219 10.8187 14.2615 10.7791 14.2923 10.733C14.421 10.54 14.3688 10.2792 14.1758 10.1506L9.05299 6.73532Z"
        fill={color}
      />
    </Svg>
  );
};

export default PlayCircleSolidIcon;
