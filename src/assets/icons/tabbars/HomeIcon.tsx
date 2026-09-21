// HomeIcon.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const HomeIcon: React.FC<Props> = ({
  size = 22,
  color = AppColors.white,
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
        d="M9.614 0.491422C10.0059 0.173506 10.4953 0 11 0C11.5047 0 11.9941 0.173506 12.386 0.491422L20.7768 7.28847C21.1583 7.5974 21.4661 7.98755 21.6777 8.4305C21.8893 8.87345 21.9994 9.35802 22 9.84891V19.8003C22 20.3837 21.7682 20.9432 21.3556 21.3557C20.9431 21.7682 20.3835 22 19.8 22H16.5C15.9165 22 15.3569 21.7682 14.9444 21.3557C14.5318 20.9432 14.3 20.3837 14.3 19.8003V14.3011C14.3 14.0094 14.1841 13.7296 13.9778 13.5234C13.7715 13.3171 13.4917 13.2012 13.2 13.2012H8.8C8.50826 13.2012 8.22847 13.3171 8.02218 13.5234C7.81589 13.7296 7.7 14.0094 7.7 14.3011V19.8003C7.7 20.3837 7.46821 20.9432 7.05563 21.3557C6.64305 21.7682 6.08348 22 5.5 22H2.2C1.61652 22 1.05695 21.7682 0.644365 21.3557C0.231785 20.9432 0 20.3837 0 19.8003V9.85111C0 9.35948 0.109683 8.87404 0.321316 8.43029C0.532949 7.98653 0.841086 7.59566 1.2232 7.28627L9.614 0.491422Z"
        fill={color}
      />
    </Svg>
  );
};

export default HomeIcon;
