import React, { useMemo } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IS_Android, IS_IOS } from '../../constants/platform';
import { AppSafeViewProps } from '../../types/ui/views/view.props';

const AppSafeView: React.FC<AppSafeViewProps> = ({
  children,
  style,
  backgroundColor = 'transparent', // Safe-area background color
}) => {
  // Memoized safe-area style to avoid recreating array/object on every render
  const containerStyle = useMemo(
    () => [styles.safeArea, { backgroundColor }],
    [backgroundColor],
  );

  // Apply safe area on top + horizontal edges (bottom handled by screen/layout)
  const edges = ['top', 'left', 'right'] as const;

  return (
    <>
      <StatusBar
        translucent={IS_IOS || IS_Android} // Draw content under translucent status bar
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SafeAreaView style={containerStyle} edges={edges}>
        {/* Main content wrapper */}
        <View style={[styles.container, style]}>{children}</View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default AppSafeView;
