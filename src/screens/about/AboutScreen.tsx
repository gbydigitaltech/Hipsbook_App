import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import DocumentOutlineIcon from '../../assets/icons/DocumentOutlineIcon';
import PrivacyPolicyIcon from '../../assets/icons/PrivacyPolicyIcon';
import AppListGroup from '../../components/lists/AppListGroup';
import AppListTile from '../../components/lists/AppListTile';
import AppSafeView from '../../components/views/AppSafeView';
import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import { AppStackParamList } from '../../types/data/navigation/navigation.types';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

type AboutNavProp = NativeStackNavigationProp<AppStackParamList>;

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
          marginTop: verticalScale(IS_TABLET ? 32 : 24),
          gap: verticalScale(IS_IOS ? 18 : 14),
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
            leftIcon={<DocumentOutlineIcon size={IS_TABLET ? 28 : 24} />}
            titleFontSize={AppFontSize.subtitle}
            onPress={() => navigation.navigate('TermOfService')}
          />

          <AppListTile
            title="นโยบายคุ้มครองข้อมูลส่วนบุคคล"
            leftIcon={<PrivacyPolicyIcon size={IS_TABLET ? 28 : 24} />}
            titleFontSize={AppFontSize.subtitle}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </AppListGroup>
      </AppSafeView>
    </View>
  );
};

export default AboutScreen;
