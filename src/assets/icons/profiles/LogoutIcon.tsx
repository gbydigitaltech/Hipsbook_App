import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const LogoutIcon: React.FC<Props> = ({
  size = 20,
  color = AppColors.danger,
}) => {
  const { scale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={scale(size)}
      viewBox="0 0 18 18"
      fill="none"
    >
      <Path
        d="M9 12L12 9M12 9L9 6M12 9H1M6 4.249V4.2C6 3.08 6 2.52 6.218 2.092C6.41 1.715 6.715 1.41 7.092 1.218C7.52 1 8.08 1 9.2 1H13.8C14.92 1 15.48 1 15.907 1.218C16.284 1.41 16.59 1.715 16.782 2.092C17 2.519 17 3.079 17 4.197V13.804C17 14.922 17 15.481 16.782 15.908C16.59 16.2845 16.2837 16.5904 15.907 16.782C15.48 17 14.921 17 13.803 17H9.197C8.079 17 7.519 17 7.092 16.782C6.71569 16.5903 6.40974 16.2843 6.218 15.908C6 15.48 6 14.92 6 13.8V13.75"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default LogoutIcon;
