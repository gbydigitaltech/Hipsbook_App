import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';

type Props = {
  size?: number;
  color?: string;
};

const CloseIcon: React.FC<Props> = ({ size = 12, color = '#D9D9D9' }) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 12 13"
      fill="none"
    >
      <Path
        d="M5.99998 5.05561L10.6667 0L12 1.44445L7.3333 6.50004L12 11.5556L10.6667 13L5.99998 7.94448L1.33334 13L0 11.5556L4.66666 6.50004L0 1.44445L1.33334 0L5.99998 5.05561Z"
        fill={color}
      />
    </Svg>
  );
};

export default CloseIcon;
