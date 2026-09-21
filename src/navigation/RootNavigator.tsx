import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';

import AppLoadingOverlay from '../components/loading/AppLoadingOverlay';
import { useAuth } from '../stores/auth';
import { AppColors } from '../styles/colors';
import { RootStackParamList } from '../types/data/navigation/navigation.types';
import AppStack from './AppStack';
import AuthStackNavigator from './auth/AuthStackNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isAuthenticated = useAuth(s => s.isAuthenticated);
  const loading = useAuth(s => s.loading);
  const initialized = useAuth(s => s.initialized);

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: AppColors.black }}>
        <AppLoadingOverlay visible />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.black }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: AppColors.black },
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="AppStack" component={AppStack} />
        ) : (
          <Stack.Screen name="AuthStack" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>

      <AppLoadingOverlay visible={loading} />
    </View>
  );
}
