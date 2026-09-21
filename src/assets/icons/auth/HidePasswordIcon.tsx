import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const HidePasswordIcon: React.FC<Props> = ({
  size = 20,
  color = AppColors.grayLight,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size * 0.74)}
      viewBox="0 0 19 14"
      fill="none"
    >
      <Path
        d="M0.793216 7.26867C0.735648 7.09594 0.735593 6.90895 0.79306 6.73619C1.95003 3.2581 5.23092 0.75 9.0976 0.75C12.9625 0.75 16.2421 3.25577 17.4005 6.73134C17.4581 6.90406 17.4581 7.09106 17.4007 7.26381C16.2437 10.7419 12.9628 13.25 9.09614 13.25C5.23125 13.25 1.95162 10.7442 0.793216 7.26867Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11.5969 7C11.5969 8.38071 10.4776 9.5 9.09692 9.5C7.71621 9.5 6.59692 8.38071 6.59692 7C6.59692 5.61929 7.71621 4.5 9.09692 4.5C10.4776 4.5 11.5969 5.61929 11.5969 7Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default HidePasswordIcon;
