import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';
import OtpScreen from '../../screens/auth/OtpScreen';
import SignInScreen from '../../screens/auth/SignInScreen';
import SignUpScreen from '../../screens/auth/SignUpScreen';
import { useAuth } from '../../stores/auth';
import { AppColors } from '../../styles/colors';
import { AuthStackParamList } from '../../types/data/navigation/navigation.types';

const Stack = createNativeStackNavigator<AuthStackParamList>();
type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function AuthStackNavigator() {
  const pendingOtpEmail = useAuth(s => s.pendingOtpEmail);
  const navigation = useNavigation<Nav>();
  const lastEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingOtpEmail) {
      lastEmailRef.current = null;
      return;
    }

    if (lastEmailRef.current === pendingOtpEmail) return;
    lastEmailRef.current = pendingOtpEmail;

    navigation.replace('ConfirmOTP', { email: pendingOtpEmail });
  }, [pendingOtpEmail, navigation]);

  return (
    <Stack.Navigator
      initialRouteName="SignIn"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: AppColors.black,
        },
      }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ConfirmOTP" component={OtpScreen} />
    </Stack.Navigator>
  );
}
