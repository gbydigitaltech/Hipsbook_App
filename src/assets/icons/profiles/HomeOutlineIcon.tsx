import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const HomeOutlineIcon: React.FC<Props> = ({
  size = 24,
  color = AppColors.primary,
  strokeWidth = 2,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size * 0.95)}
      viewBox="0 0 20 21"
      fill="none"
    >
      <Path
        d="M1.00018 10.49V13C1.00018 16.3 1.00018 17.95 2.02518 18.975C3.05018 20 4.70018 20 8.00018 20H12.0002C15.3002 20 16.9502 20 17.9752 18.975C19.0002 17.95 19.0002 16.3 19.0002 13V10.49C19.0002 8.808 19.0002 7.968 18.6442 7.24C18.2882 6.512 17.6242 5.996 16.2982 4.964L14.2982 3.409C12.2332 1.803 11.2002 1 10.0002 1C8.80018 1 7.76718 1.803 5.70218 3.409L3.70218 4.964C2.37518 5.996 1.71218 6.512 1.35618 7.24C1.00018 7.968 1.00018 8.808 1.00018 10.49Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.0002 20V15C13.0002 13.586 13.0002 12.879 12.5602 12.44C12.1212 12 11.4142 12 10.0002 12C8.58618 12 7.87918 12 7.44018 12.44C7.00018 12.878 7.00018 13.585 7.00018 15V20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default HomeOutlineIcon;
