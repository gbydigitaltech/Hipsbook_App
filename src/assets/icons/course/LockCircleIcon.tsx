import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../../../helpers/responsive';
import { AppColors } from '../../../styles/colors';

type Props = {
  size?: number;
  color?: string;
};

// Solid circle with a lock cut out (even-odd), so the thumbnail shows through
// the glyph — the locked twin of PlayCircleIcon.
const LOCK_CIRCLE_PATH = [
  // circle
  'M28 14A14 14 0 1 1 0 14A14 14 0 1 1 28 14Z',
  // lock body (hole)
  'M10.8 13H17.2A1.6 1.6 0 0 1 18.8 14.6V18.6A1.6 1.6 0 0 1 17.2 20.2H10.8A1.6 1.6 0 0 1 9.2 18.6V14.6A1.6 1.6 0 0 1 10.8 13Z',
  // shackle: outer (hole) + inner (filled again)
  'M10.6 13V10.4A3.4 3.4 0 0 1 17.4 10.4V13Z',
  'M12.2 13V10.4A1.8 1.8 0 0 1 15.8 10.4V13Z',
  // keyhole (filled again)
  'M14 15.2A1.1 1.1 0 1 1 14 17.4A1.1 1.1 0 1 1 14 15.2Z',
].join('');

const LockCircleIcon: React.FC<Props> = ({
  size = 28,
  color = AppColors.white,
}) => {
  const { scale, verticalScale } = useResponsive();

  return (
    <Svg
      width={scale(size)}
      height={verticalScale(size)}
      viewBox="0 0 28 28"
      fill="none"
    >
      <Path d={LOCK_CIRCLE_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
};

export default LockCircleIcon;
