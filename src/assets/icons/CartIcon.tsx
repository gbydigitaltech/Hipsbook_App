import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const CartIcon: React.FC<Props> = ({ size = 32, color = AppColors.white }) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size * 0.9)}
      height={verticalScale(size)}
      viewBox="0 0 14 14"
      fill="none"
    >
      <Path
        d="M1.23809 8.90909V1.27273H0V0H1.85714C2.19903 0 2.47619 0.284913 2.47619 0.636366V8.27272H10.1761L11.4142 3.18182H3.71428V1.90909H12.2071C12.549 1.90909 12.8262 2.19401 12.8262 2.54546C12.8262 2.59749 12.82 2.64932 12.8076 2.6998L11.26 9.06341C11.1912 9.34671 10.9436 9.54545 10.6595 9.54545H1.85714C1.51526 9.54545 1.23809 9.26055 1.23809 8.90909ZM2.47619 13.3636C1.79241 13.3636 1.23809 12.7938 1.23809 12.0909C1.23809 11.388 1.79241 10.8182 2.47619 10.8182C3.15997 10.8182 3.71428 11.388 3.71428 12.0909C3.71428 12.7938 3.15997 13.3636 2.47619 13.3636ZM9.90475 13.3636C9.22095 13.3636 8.66665 12.7938 8.66665 12.0909C8.66665 11.388 9.22095 10.8182 9.90475 10.8182C10.5885 10.8182 11.1428 11.388 11.1428 12.0909C11.1428 12.7938 10.5885 13.3636 9.90475 13.3636Z"
        fill={color}
      />
    </Svg>
  );
};

export default CartIcon;
