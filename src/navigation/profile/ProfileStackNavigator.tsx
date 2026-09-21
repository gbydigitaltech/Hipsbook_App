import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ProfileAddressScreen from '../../screens/profile/ProfileAddressScreen';
import ProfileChangePasswordScreen from '../../screens/profile/ProfileChangePasswordScreen';
import ProfileEditInfoScreen from '../../screens/profile/ProfileEditInfoScreen';
import ProfileManageAddressScreen from '../../screens/profile/ProfileManageAddressScreen';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import { AppColors } from '../../styles/colors';
import { ProfileStackParamList } from '../../types/data/navigation/navigation.types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * Profile flow stack navigator.
 */
export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: AppColors.black,
        },
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={ProfileEditInfoScreen} />
      <Stack.Screen name="ProfileAddress" component={ProfileAddressScreen} />
      <Stack.Screen
        name="ProfileManageAddress"
        component={ProfileManageAddressScreen}
      />
      <Stack.Screen
        name="ProfileChangePassword"
        component={ProfileChangePasswordScreen}
      />
    </Stack.Navigator>
  );
}
