import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const EditLocationIcon: React.FC<Props> = ({
  size = 24,
  color = AppColors.primary,
  strokeWidth = 2,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 22 22"
      fill="none"
    >
      <Path
        d="M16.97 8.30785C16.7916 6.25349 15.8268 4.34737 14.2769 2.98718C12.727 1.62699 10.7118 0.917809 8.65168 1.00759C6.59154 1.09738 4.64564 1.9792 3.21998 3.46906C1.79432 4.95893 0.999011 6.94176 1 9.00385C1 13.6938 5.887 18.5658 8.022 20.4718M20.378 15.6298C20.7764 15.2315 21.0001 14.6912 21.0001 14.1278C21.0001 13.5645 20.7764 13.0242 20.378 12.6258C19.9796 12.2275 19.4394 12.0037 18.876 12.0037C18.3126 12.0037 17.7724 12.2275 17.374 12.6258L13.364 16.6378C13.1262 16.8755 12.9522 17.1692 12.858 17.4918L12.021 20.3618C11.9959 20.4479 11.9944 20.5391 12.0166 20.6259C12.0389 20.7128 12.0841 20.792 12.1474 20.8554C12.2108 20.9188 12.2901 20.964 12.3769 20.9862C12.4637 21.0084 12.555 21.0069 12.641 20.9818L15.511 20.1448C15.8337 20.0506 16.1274 19.8766 16.365 19.6388L20.378 15.6298Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12.0039C10.6569 12.0039 12 10.6608 12 9.00391C12 7.34705 10.6569 6.00391 9 6.00391C7.34315 6.00391 6 7.34705 6 9.00391C6 10.6608 7.34315 12.0039 9 12.0039Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default React.memo(EditLocationIcon);
