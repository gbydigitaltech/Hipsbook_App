import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const MailIcon: React.FC<Props> = ({
  size = 52,
  color = AppColors.primary,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 41 37"
      fill="none"
    >
      <Path
        d="M2.05 0H38.95C40.0822 0 41 0.920313 41 2.05556V34.9444C41 36.0797 40.0822 37 38.95 37H2.05C0.917826 37 0 36.0797 0 34.9444V2.05556C0 0.920313 0.917826 0 2.05 0ZM20.6242 17.8482L7.4768 6.65527L4.8232 9.78917L20.6499 23.2629L36.1915 9.77655L33.5085 6.66789L20.6242 17.8482Z"
        fill={color}
      />
    </Svg>
  );
};

export default MailIcon;
