import React from 'react';
import { View } from 'react-native';
import { useResponsive } from '../../../helpers/responsive';

/**
 * Separator
 * Small horizontal spacer used between list/row items.
 */
const Separator: React.FC = () => {
  const { scale } = useResponsive();

  return <View style={{ width: scale(12) }} />;
};

export default React.memo(Separator);
