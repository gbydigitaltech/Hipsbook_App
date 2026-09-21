import {
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/config/queryClient';
import { configureGoogle } from './src/config/google';
import { useAuthAppStateWatcher } from './src/hooks/auth/useAuthAppStateWatcher';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuth } from './src/stores/auth';
import { useProfile } from './src/stores/profile';

function App() {
  const revalidate = useAuth(s => s.revalidate);
  const initialized = useAuth(s => s.initialized);
  const isAuthenticated = useAuth(s => s.isAuthenticated);
  const fetchProfile = useProfile(s => s.fetchProfile);

  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    configureGoogle();
  }, []);

  useEffect(() => {
    revalidate().catch(err => console.error('initial revalidate failed:', err));
  }, [revalidate]);

  useAuthAppStateWatcher();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile().catch(err => console.error('fetchProfile failed:', err));
    }
  }, [isAuthenticated, fetchProfile]);

  useEffect(() => {
    if (navReady && initialized) {
      RNBootSplash.hide({ fade: false }).catch(() => {});
    }
  }, [navReady, initialized]);

  const navigationTheme = useMemo<Theme>(
    () => ({
      ...DefaultTheme,
      dark: true,
      colors: {
        ...DefaultTheme.colors,
        primary: '#FFFFFF',
        background: '#000000',
        card: '#000000',
        text: '#FFFFFF',
        border: '#000000',
        notification: '#E34A42',
      },
      fonts: DefaultTheme.fonts,
    }),
    [],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <NavigationContainer
            theme={navigationTheme}
            onReady={() => {
              setNavReady(true);
            }}
          >
            <RootNavigator />
          </NavigationContainer>
        </View>
      </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default App;
