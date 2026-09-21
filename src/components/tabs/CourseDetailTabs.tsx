import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { IS_Android } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import AppText from '../texts/AppText';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  PRESSED_OPACITY,
} from '../../styles/sharedstyles';

// Enable LayoutAnimation on Android
if (IS_Android && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TabItem {
  key: string; // Unique tab key
  label?: string; // Optional text label under the icon
  icon: React.ReactElement<{ color?: string }>; // Tab icon (supports color prop)
}

interface ContentTabsProps {
  tabs: TabItem[]; // Tabs to render
  onChange?: (key: string) => void; // Called when active tab changes
}

const INACTIVE_TINT = AppColors.textTertiary;

const CourseDetailTabs: React.FC<ContentTabsProps> = ({ tabs, onChange }) => {
  const [active, setActive] = useState(tabs[0]?.key);
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          marginTop: verticalScale(20),
          marginBottom: verticalScale(10),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: AppColors.border,
        },
        tabItem: {
          flex: 1,
          alignItems: 'center',
          paddingBottom: verticalScale(8),
        },
        iconWrapper: {
          width: scale(34),
          height: verticalScale(34),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: verticalScale(5),
        },
        label: {
          textAlign: 'center',
        },
        activeLine: {
          position: 'absolute',
          bottom: -StyleSheet.hairlineWidth,
          width: '100%',
          height: verticalScale(3),
          borderRadius: responsiveRadius(AppRadius.lg),
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const handlePress = (key: string) => {
    LayoutAnimation.easeInEaseOut();
    setActive(key);
    onChange?.(key);
  };

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive = active === tab.key;
        const tint = isActive ? AppColors.primary : INACTIVE_TINT;
        const coloredIcon = React.cloneElement(tab.icon, { color: tint });

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            activeOpacity={PRESSED_OPACITY}
            onPress={() => handlePress(tab.key)}
          >
            <View style={styles.iconWrapper}>{coloredIcon}</View>

            {tab.label ? (
              <AppText
                fontSize={AppFontSize.body}
                fontWeight={isActive ? 'medium' : 'regular'}
                numberOfLines={1}
                style={[styles.label, { color: tint }]}
              >
                {tab.label}
              </AppText>
            ) : null}

            <View
              style={[
                styles.activeLine,
                {
                  backgroundColor: isActive ? AppColors.primary : 'transparent',
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CourseDetailTabs;
