import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const DocumentIcon: React.FC<Props> = ({
  size = 24,
  color = AppColors.grayLight,
  strokeWidth = 2,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 24 29"
      fill="none"
    >
      <Path
        d="M7.95833 15.7083H15.7083M7.95833 20.875H11.8333M1.5 4.08333V24.75C1.5 25.4351 1.77217 26.0922 2.25664 26.5767C2.74111 27.0612 3.39819 27.3333 4.08333 27.3333H19.5833C20.2685 27.3333 20.9256 27.0612 21.41 26.5767C21.8945 26.0922 22.1667 25.4351 22.1667 24.75V9.69175C22.1666 9.3476 22.0978 9.00692 21.9643 8.68973C21.8308 8.37254 21.6352 8.08523 21.3891 7.84467L15.6541 2.23625C15.1715 1.76435 14.5233 1.50008 13.8483 1.5H4.08333C3.39819 1.5 2.74111 1.77217 2.25664 2.25664C1.77217 2.74111 1.5 3.39819 1.5 4.08333Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.4167 1.5V6.66667C14.4167 7.35181 14.6889 8.00889 15.1734 8.49336C15.6579 8.97783 16.3149 9.25 17.0001 9.25H22.1667"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default DocumentIcon;
