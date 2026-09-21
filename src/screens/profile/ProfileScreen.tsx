import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import InfoCircleIcon from '../../assets/icons/InfoCircleIcon';
import EditUserIcon from '../../assets/icons/profiles/EditUserIcon';
import HomeOutlineIcon from '../../assets/icons/profiles/HomeOutlineIcon';
import LockIcon from '../../assets/icons/profiles/LockIcon';
import LogoutIcon from '../../assets/icons/profiles/LogoutIcon';
import AppBackground from '../../components/background/AppBackground';
import AppListGroup from '../../components/lists/AppListGroup';
import AppListTile from '../../components/lists/AppListTile';
import RoundProfileImage from '../../components/profiles/RoundProfileImage';
import AppText from '../../components/texts/AppText';
import AppScrollView from '../../components/views/AppScrollView';

import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { useAuth } from '../../stores/auth';
import { useProfile } from '../../stores/profile';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  AppRadius,
  sharedTopSpace,
} from '../../styles/sharedstyles';
import {
  AppStackParamList,
  BottomTabParamList,
} from '../../types/data/navigation/navigation.types';

type ProfileBottomNavProp = BottomTabNavigationProp<
  BottomTabParamList,
  'Profile'
>;

type ProfileAppNavProp = NativeStackNavigationProp<AppStackParamList>;

type ProfileNavProp = CompositeNavigationProp<
  ProfileBottomNavProp,
  ProfileAppNavProp
>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const { scale, verticalScale, responsiveRadius } = useResponsive();

  const signOut = useAuth(s => s.signOut);
  const provider = useAuth(s => s.provider);
  const isAuthenticated = useAuth(s => s.isAuthenticated);

  const profile = useProfile(s => s.profile);
  const fetchProfile = useProfile(s => s.fetchProfile);
  const isFetchingProfile = useProfile(s => s.isFetchingProfile);
  const fetchProfileError = useProfile(s => s.fetchProfileError);
  const isUploadingProfileImage = useProfile(s => s.isUploadingProfileImage);

  const isHipsbook = (provider ?? '').toLowerCase().includes('hipsbook');

  useFocusEffect(
    useCallback(() => {
      let canceled = false;

      if (!isAuthenticated) return;

      (async () => {
        try {
          if (!canceled) {
            await fetchProfile();
          }
        } catch {}
      })();

      return () => {
        canceled = true;
      };
    }, [fetchProfile, isAuthenticated]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: {
          flex: 1,
        },

        header: {
          marginTop: sharedTopSpace,
          alignItems: 'center',
        },

        profileInfo: {
          backgroundColor: AppColors.cardBackgroundSecondary,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          alignItems: 'center',
          borderRadius: responsiveRadius(AppRadius.lg),
          paddingHorizontal: scale(10),
          gap: verticalScale(8),
          paddingVertical: verticalScale(IS_TABLET ? 36 : 24),
          marginTop: verticalScale(IS_TABLET ? 18 : 10),
        },

        infoContainer: {
          alignItems: 'center',
          gap: verticalScale(IS_TABLET ? 6 : 8),
        },

        nameText: {
          textAlign: 'center',
        },

        emailText: {
          textAlign: 'center',
        },

        skeletonAvatar: {
          width: IS_TABLET ? 130 : 110,
          height: IS_TABLET ? 130 : 110,
          borderRadius: AppRadius.pill,
          backgroundColor: AppColors.sheetRaised,
        },

        skeletonName: {
          width: scale(IS_TABLET ? 220 : 160),
          height: verticalScale(IS_TABLET ? 24 : 18),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.sheetRaised,
        },

        skeletonEmail: {
          width: scale(IS_TABLET ? 260 : 200),
          height: verticalScale(IS_TABLET ? 22 : 16),
          borderRadius: responsiveRadius(AppRadius.pill),
          backgroundColor: AppColors.sheetRaised,
        },

        errorText: {
          marginTop: verticalScale(4),
          textAlign: 'center',
        },

        listGroup: {
          marginTop: verticalScale(IS_TABLET ? 24 : 20),
        },
        tileHintText: {
          color: AppColors.textTertiary,
        },
      }),
    [scale, verticalScale, responsiveRadius],
  );

  const fullName =
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    profile?.email ||
    '—';

  const hasEmail = !!profile?.email?.trim();

  const initialsNameSource = (
    profile?.first_name ??
    profile?.email ??
    ''
  ).trim();

  const goEditProfile = () => navigation.navigate('EditProfile');
  const goAddress = () => navigation.navigate('ProfileAddress');
  const goChangePassword = () => navigation.navigate('ProfileChangePassword');
  const goAboutHipsbook = () => navigation.navigate('About');

  const onSignOut = () => {
    signOut();
  };

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppScrollView withHorizontalPadding>
        <View style={styles.header}>
          <AppText fontSize={AppFontSize.h1} fontWeight="semiBold">
            โปรไฟล์
          </AppText>
        </View>

        <View style={styles.profileInfo}>
          {isFetchingProfile ? (
            <View style={styles.skeletonAvatar} />
          ) : (
            <RoundProfileImage
              name={initialsNameSource || undefined}
              imageUrl={
                typeof profile?.profile_image === 'string'
                  ? profile.profile_image
                  : undefined
              }
              disabled={isUploadingProfileImage}
              size={IS_TABLET ? 130 : 110}
            />
          )}

          <View style={styles.infoContainer}>
            {isFetchingProfile ? (
              <>
                <View style={styles.skeletonName} />
                <View style={styles.skeletonEmail} />
              </>
            ) : (
              <>
                <AppText
                  style={styles.nameText}
                  fontWeight="medium"
                  fontSize={AppFontSize.subtitle}
                >
                  {fullName}
                </AppText>

                {hasEmail && (
                  <AppText style={styles.emailText}>{profile?.email}</AppText>
                )}
              </>
            )}

            {!!fetchProfileError && !isFetchingProfile && (
              <AppText fontSize={AppFontSize.body} style={styles.errorText}>
                {fetchProfileError}
              </AppText>
            )}
          </View>
        </View>

        <AppListGroup label="บัญชีของฉัน" containerStyle={styles.listGroup}>
          <AppListTile
            title="แก้ไขโปรไฟล์"
            leftIcon={<EditUserIcon size={IS_TABLET ? 26 : 22} />}
            onPress={goEditProfile}
            titleFontSize={AppFontSize.subtitle}
          />

          <AppListTile
            title="ที่อยู่"
            leftIcon={<HomeOutlineIcon size={IS_TABLET ? 26 : 22} />}
            onPress={goAddress}
            titleFontSize={AppFontSize.subtitle}
          />

          {isHipsbook ? (
            <AppListTile
              title="รหัสผ่าน"
              leftIcon={<LockIcon size={IS_TABLET ? 26 : 22} />}
              rightContent={
                <AppText
                  fontSize={AppFontSize.caption}
                  style={styles.tileHintText}
                >
                  เปลี่ยนรหัสผ่าน
                </AppText>
              }
              onPress={goChangePassword}
              titleFontSize={AppFontSize.subtitle}
            />
          ) : null}
        </AppListGroup>

        <AppListGroup label="เกี่ยวกับ" containerStyle={styles.listGroup}>
          <AppListTile
            title="เกี่ยวกับ Hipsbook"
            leftIcon={<InfoCircleIcon size={IS_TABLET ? 26 : 22} />}
            onPress={goAboutHipsbook}
            titleFontSize={AppFontSize.subtitle}
          />
        </AppListGroup>

        <AppListGroup containerStyle={styles.listGroup}>
          <AppListTile
            title="ออกจากระบบ"
            leftIcon={<LogoutIcon size={IS_TABLET ? 26 : 22} />}
            rightContent={null}
            destructive
            onPress={onSignOut}
            titleFontSize={AppFontSize.subtitle}
          />
        </AppListGroup>
      </AppScrollView>
    </View>
  );
};

export default ProfileScreen;
