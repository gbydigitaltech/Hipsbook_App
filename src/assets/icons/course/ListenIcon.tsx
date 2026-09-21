import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

const ListenIcon: React.FC<Props> = ({
  size = 36,
  color = AppColors.white,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale((size * 24) / 36)}
      viewBox="0 0 36 24"
      fill="none"
    >
      <Path
        d="M34.5727 10.1508H35.9375V13.2711H34.5727V10.1508ZM31.8831 14.1847H33.248V9.23719H31.8831V14.1847ZM29.2388 16.7438H30.6036V6.67813H29.2388V16.7438ZM26.7249 18.7184H28.0898V4.79555H26.7249V18.7151V18.7184ZM24.0337 15.3184H25.3985V8.10352H24.0337V15.3184ZM21.2998 20.7777H22.6646V2.33547H21.2955V20.7777H21.2998ZM18.6094 23.4219H19.9742V0H18.6094V23.4219ZM15.965 19.8059H17.3298V3.61586H15.965V19.806V19.8059ZM13.2294 15.2083H14.5942V8.38406H13.2294V15.2083ZM10.5851 13.5815H11.9499V9.83437H10.5851V13.5877V13.5815ZM7.9407 15.5862H9.30555V7.83305H7.9407V15.5887V15.5862ZM5.33898 19.3393H6.70383V3.63891H5.33906V19.342L5.33898 19.3393ZM2.69469 16.9407H4.05953V6.34633H2.69469V16.9434V16.9407ZM0 14.1847H1.36484V9.23719H0V14.1847Z"
        fill={color}
      />
    </Svg>
  );
};

export default ListenIcon;
