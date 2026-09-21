// src/assets/icons/ForwardChevronIcon.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const ForwardChevronIcon: React.FC<Props> = ({
  size = 20,
  color = AppColors.white,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 8 14"
      fill="none"
    >
      <Path
        d="M5.47189 6.71169L0.265641 1.50544C0.0885571 1.32835 0.00284803 1.12176 0.00851474 0.885646C0.0141815 0.649535 0.105793 0.442938 0.283348 0.265854C0.460904 0.0887705 0.667501 0.000228517 0.90314 0.000228496C1.13878 0.000228476 1.34538 0.0887704 1.52293 0.265853L6.9771 5.70231C7.11877 5.84398 7.22502 6.00335 7.29585 6.18044C7.36668 6.35752 7.4021 6.5346 7.4021 6.71169C7.4021 6.88877 7.36668 7.06585 7.29585 7.24294C7.22502 7.42002 7.11877 7.5794 6.9771 7.72106L1.52293 13.1752C1.34585 13.3523 1.13618 13.438 0.893933 13.4324C0.651683 13.4267 0.442253 13.3351 0.265642 13.1575C0.0890302 12.98 0.0004887 12.7734 1.66111e-05 12.5377C-0.000455478 12.3021 0.088086 12.0955 0.265642 11.9179L5.47189 6.71169Z"
        fill={color}
      />
    </Svg>
  );
};

export default ForwardChevronIcon;
