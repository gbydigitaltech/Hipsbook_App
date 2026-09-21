import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import AboutScreen from '../screens/about/AboutScreen';
import ClassroomScreen from '../screens/class/ClassroomScreen';
import CourseDetailScreen from '../screens/course/CourseDetail/CourseDetailScreen';
import PrivacyPolicyScreen from '../screens/policy/PrivacyPolicyScreen';
import ProfileAddressScreen from '../screens/profile/ProfileAddressScreen';
import ProfileChangePasswordScreen from '../screens/profile/ProfileChangePasswordScreen';
import ProfileEditInfoScreen from '../screens/profile/ProfileEditInfoScreen';
import ProfileManageAddressScreen from '../screens/profile/ProfileManageAddressScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';
import TermOfServiceScreen from '../screens/terms/TermOfServiceScreen';
import { useAuth } from '../stores/auth';
import { useWhitelistStore } from '../stores/whitelist';
import { AppColors } from '../styles/colors';
import { AppStackParamList } from '../types/data/navigation/navigation.types';
import AppBottomNavigator from './bottom/AppBottomNavigator';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  const initWhitelist = useWhitelistStore(s => s.initWhitelist);
  const isAuthenticated = useAuth(s => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      initWhitelist();
    }
  }, [isAuthenticated, initWhitelist]);

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
      <Stack.Screen
        name="MainTabs"
        component={AppBottomNavigator}
        options={{ animation: 'none' }}
      />

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

      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="ClassRoom" component={ClassroomScreen} />
      <Stack.Screen name="TeacherProfile" component={TeacherProfileScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="TermOfService" component={TermOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}
