import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import DocumentOutlineIcon from '../../assets/icons/DocumentOutlineIcon';
import PrivacyPolicyIcon from '../../assets/icons/PrivacyPolicyIcon';
import AppListGroup from '../../components/lists/AppListGroup';
import AppListTile from '../../components/lists/AppListTile';
import AppText from '../../components/texts/AppText';
import AppSafeView from '../../components/views/AppSafeView';
import { IS_IOS } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  sharedPaddingHorizontal,
  AppIconSize,
  adaptiveSize,
} from '../../styles/sharedstyles';
import { AppStackParamList } from '../../types/data/navigation/navigation.types';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

type AboutNavProp = NativeStackNavigationProp<AppStackParamList>;

// Read from the installed app (Xcode Version/Build, Android versionName/versionCode)
const APP_VERSION_LABEL = `เวอร์ชัน ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`;

const AboutScreen = () => {
  const navigation = useNavigation<AboutNavProp>();

  const { scale, verticalScale } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        background: {
          backgroundColor: AppColors.secondary,
          ...StyleSheet.absoluteFill,
        },
        container: {
          flex: 1,
          width: '100%',
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },
        listTileContainer: {
          marginTop: verticalScale(adaptiveSize(24)),
          gap: verticalScale(IS_IOS ? 18 : 14),
        },
        versionText: {
          textAlign: 'center',
          color: AppColors.textTertiary,
          marginTop: verticalScale(adaptiveSize(20)),
        },
      }),
    [scale, verticalScale],
  );

  return (
    <View style={styles.root}>
      <View style={styles.background} pointerEvents="none" />

      <AppSafeView style={styles.container}>
        <AppScreenHeader title="เกี่ยวกับ Hipsbook" />

        <AppListGroup
          label="ข้อกำหนดและนโยบาย"
          containerStyle={styles.listTileContainer}
        >
          <AppListTile
            title="ข้อตกลงผู้ใช้"
            leftIcon={<DocumentOutlineIcon size={AppIconSize.xl} />}
            titleFontSize={AppFontSize.subtitle}
            onPress={() => navigation.navigate('TermOfService')}
          />

          <AppListTile
            title="นโยบายคุ้มครองข้อมูลส่วนบุคคล"
            leftIcon={<PrivacyPolicyIcon size={AppIconSize.xl} />}
            titleFontSize={AppFontSize.subtitle}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </AppListGroup>

        <AppText fontSize={AppFontSize.caption} style={styles.versionText}>
          {APP_VERSION_LABEL}
        </AppText>
      </AppSafeView>
    </View>
  );
};

export default AboutScreen;
