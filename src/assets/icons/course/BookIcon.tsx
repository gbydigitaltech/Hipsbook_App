import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const BookIcon: React.FC<Props> = ({ size = 28, color = AppColors.white }) => {
  const { scale, verticalScale } = useResponsive();

  const width = scale(size);
  const height = verticalScale((23 / 32) * size);

  return (
    <Svg width={width} height={height} viewBox="0 0 32 23" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M30.7143 3.02429C28.2381 1.67476 25.7619 1 23.2857 1C19.5714 1 18.3327 1.676 15.8571 3.02429V21.4286C18.3333 20.1905 20.8095 19.5714 23.2857 19.5714C27 19.5714 28.2387 20.1899 30.7143 21.4286V3.02429Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M27.104 5.24921C25.8325 4.89264 24.5597 4.71436 23.2857 4.71436C21.3747 4.71436 20.7414 4.89264 19.4674 5.24921M27.104 8.9635C25.8325 8.60693 24.5597 8.42864 23.2857 8.42864C21.3747 8.42864 20.7414 8.60693 19.4674 8.9635M27.104 12.6778C25.8325 12.3212 24.5597 12.1429 23.2857 12.1429C21.3747 12.1429 20.7414 12.3212 19.4674 12.6778M27.104 16.3921C25.8325 16.0355 24.5597 15.8572 23.2857 15.8572C21.3747 15.8572 20.7414 16.0355 19.4674 16.3921M12.2469 5.24921C10.9753 4.89264 9.70258 4.71436 8.42858 4.71436C6.51758 4.71436 5.88429 4.89264 4.61029 5.24921M12.2469 8.9635C10.9753 8.60693 9.70258 8.42864 8.42858 8.42864C6.51758 8.42864 5.88429 8.60693 4.61029 8.9635M12.2469 12.6778C10.9753 12.3212 9.70258 12.1429 8.42858 12.1429C6.51758 12.1429 5.88429 12.3212 4.61029 12.6778M12.2469 16.3921C10.9753 16.0355 9.70258 15.8572 8.42858 15.8572C6.51758 15.8572 5.88429 16.0355 4.61029 16.3921"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.8571 3.02429C13.381 1.67476 10.9048 1 8.42857 1C4.71429 1 3.47557 1.676 1 3.02429V21.4286C3.47619 20.1905 5.95238 19.5714 8.42857 19.5714C12.1429 19.5714 13.3816 20.1899 15.8571 21.4286V3.02429Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default BookIcon;
