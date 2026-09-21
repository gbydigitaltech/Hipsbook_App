import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppText from '../../components/texts/AppText';
import { IS_Android } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import CourseScreen from '../../screens/course/CourseScreen';
import MyCourseScreen from '../../screens/course/MyCourseScreen/MyCourseScreen';
import HomeScreen from '../../screens/home/HomeScreen';
import LiveScreen from '../../screens/live/LiveScreen';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import { AppColors } from '../../styles/colors';
import { BottomTabParamList } from '../../types/data/navigation/navigation.types';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const INACTIVE_TINT = AppColors.textTertiary;

type TabIconRenderProps = { focused: boolean; color: string; size: number };
type TabLabelProps = { focused: boolean; color: string; children: string };

/**
 * One consistent tab icon.
 * Outline variant when inactive, solid variant when active — a single
 * icon family (Ionicons) shared across the whole app for a unified theme.
 */
const TabBarIcon: React.FC<{
  outline: IoniconName;
  solid: IoniconName;
  focused: boolean;
  color: string;
  size: number;
  highlightSize: number;
  highlightRadius: number;
}> = ({
  outline,
  solid,
  focused,
  color,
  size,
  highlightSize,
  highlightRadius,
}) => (
  <View
    style={[
      styles.iconWrap,
      {
        width: highlightSize,
        height: highlightSize,
        borderRadius: highlightRadius,
      },
    ]}
  >
    <Ionicons
      name={focused ? solid : outline}
      size={size}
      color={focused ? AppColors.primary : color}
    />
  </View>
);

/** Shared tab label (keeps the app font + theme colors). */
const BaseTabLabel: React.FC<TabLabelProps> = ({
  focused,
  color,
  children,
}) => (
  <AppText
    fontSize={AppFontSize.overline}
    fontWeight={focused ? 'medium' : 'regular'}
    numberOfLines={1}
    style={{ color: focused ? AppColors.primary : color }}
  >
    {children}
  </AppText>
);

/**
 * Main app bottom-tab navigator.
 * Handles responsive sizing and safe-area spacing.
 */
export default function AppBottomNavigator() {
  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const iconSize = scale(23);
  const highlightSize = scale(40);
  const highlightRadius = responsiveRadius(AppRadius.md);

  const insets = useSafeAreaInsets();
  const androidBuffer = IS_Android ? verticalScale(2) : 0;
  const safeBottom = Math.max(0, insets.bottom) + androidBuffer;

  const baseHeight = verticalScale(IS_Android ? 70 : 62);
  const basePaddingBottom = verticalScale(8);
  const basePaddingTop = verticalScale(8);

  const makeIcon =
    (outline: IoniconName, solid: IoniconName) =>
    ({ focused, color }: TabIconRenderProps) =>
      (
        <TabBarIcon
          outline={outline}
          solid={solid}
          focused={focused}
          color={color}
          size={iconSize}
          highlightSize={highlightSize}
          highlightRadius={highlightRadius}
        />
      );

  const makeLabel =
    (text: string) =>
    ({ focused, color }: { focused: boolean; color: string }) =>
      (
        <BaseTabLabel focused={focused} color={color}>
          {text}
        </BaseTabLabel>
      );

  return (
    <Tab.Navigator
      initialRouteName="Home"
      safeAreaInsets={{ bottom: safeBottom }}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarLabelPosition: 'below-icon',

        tabBarItemStyle: { justifyContent: 'center', alignItems: 'center' },
        tabBarIconStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },

        tabBarStyle: {
          ...styles.tabBar,
          height: baseHeight + safeBottom,
          paddingBottom: basePaddingBottom + safeBottom,
          paddingTop: basePaddingTop,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: makeIcon('home-outline', 'home'),
          tabBarLabel: makeLabel('หน้าแรก'),
        }}
      />
      <Tab.Screen
        name="Course"
        component={CourseScreen}
        options={{
          tabBarIcon: makeIcon('book-outline', 'book'),
          tabBarLabel: makeLabel('คอร์สทั้งหมด'),
        }}
      />
      <Tab.Screen
        name="Live"
        component={LiveScreen}
        options={{
          tabBarIcon: makeIcon('videocam-outline', 'videocam'),
          tabBarLabel: makeLabel('ไลฟ์สด'),
        }}
      />
      <Tab.Screen
        name="MyCourse"
        component={MyCourseScreen}
        options={{
          tabBarIcon: makeIcon('library-outline', 'library'),
          tabBarLabel: makeLabel('คอร์สของฉัน'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: makeIcon('person-outline', 'person'),
          tabBarLabel: makeLabel('โปรไฟล์'),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: AppColors.tabbarBackground,
    borderTopWidth: 0,
    elevation: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
