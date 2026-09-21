import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const ChevronDownIcon: React.FC<Props> = ({
  size = 20,
  color = AppColors.white,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 14 8"
      fill="none"
    >
      <Path
        d="M6.72093 5.47165L11.9272 0.265398C12.1043 0.0883142 12.3109 0.00260511 12.547 0.00827184C12.7831 0.0139386 12.9897 0.10555 13.1668 0.283106C13.3438 0.460661 13.4324 0.667258 13.4324 0.902898C13.4324 1.13854 13.3438 1.34513 13.1668 1.52269L7.73031 6.97686C7.58864 7.11852 7.42926 7.22477 7.25218 7.29561C7.0751 7.36644 6.89801 7.40186 6.72093 7.40186C6.54385 7.40186 6.36676 7.36644 6.18968 7.29561C6.0126 7.22477 5.85322 7.11852 5.71155 6.97686L0.257389 1.52269C0.0803052 1.34561 -0.00540303 1.13594 0.000263644 0.893689C0.00593031 0.651439 0.0975414 0.442008 0.275097 0.265398C0.452653 0.0887861 0.65925 0.000244625 0.894889 -0.000227441C1.13053 -0.000699507 1.33712 0.087842 1.51468 0.265398L6.72093 5.47165Z"
        fill={color}
      />
    </Svg>
  );
};

export default ChevronDownIcon;
