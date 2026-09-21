import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const EditUserIcon: React.FC<Props> = ({
  size = 24,
  color = AppColors.primary,
  strokeWidth = 2,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size * 0.95)}
      viewBox="0 0 18 21"
      fill="none"
    >
      <Path
        d="M1 19V17C1 15.9391 1.42143 14.9217 2.17157 14.1716C2.92172 13.4214 3.93913 13 5 13H8.5M3 5C3 6.06087 3.42143 7.07828 4.17157 7.82843C4.92172 8.57857 5.93913 9 7 9C8.06087 9 9.07828 8.57857 9.82843 7.82843C10.5786 7.07828 11 6.06087 11 5C11 3.93913 10.5786 2.92172 9.82843 2.17157C9.07828 1.42143 8.06087 1 7 1C5.93913 1 4.92172 1.42143 4.17157 2.17157C3.42143 2.92172 3 3.93913 3 5ZM13.42 13.61C13.615 13.415 13.8465 13.2603 14.1013 13.1548C14.3561 13.0492 14.6292 12.9949 14.905 12.9949C15.1808 12.9949 15.4539 13.0492 15.7087 13.1548C15.9635 13.2603 16.195 13.415 16.39 13.61C16.585 13.805 16.7397 14.0365 16.8452 14.2913C16.9508 14.5461 17.0051 14.8192 17.0051 15.095C17.0051 15.3708 16.9508 15.6439 16.8452 15.8987C16.7397 16.1535 16.585 16.385 16.39 16.58L13 20H10V17L13.42 13.61Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default EditUserIcon;
