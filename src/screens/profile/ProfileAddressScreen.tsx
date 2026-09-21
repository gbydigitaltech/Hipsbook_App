import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EditLocationIcon from '../../assets/icons/profiles/EditLocationIcon';
import TrashIcon from '../../assets/icons/TrashIcon';
import AppBackground from '../../components/background/AppBackground';
import AppButton from '../../components/buttons/AppButton';
import AppIconButton from '../../components/buttons/AppIconButton';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import AppText from '../../components/texts/AppText';
import AppScrollView from '../../components/views/AppScrollView';

import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { useAddressesProfile } from '../../hooks/profile/useProfileAddress';
import { AppColors } from '../../styles/colors';
import { AppFontSize, AppRadius } from '../../styles/sharedstyles';
import { ProfileStackParamList } from '../../types/data/navigation/navigation.types';
import { AddressItem } from '../../types/data/profile/profileAddress.types';
import AppScreenHeader from '../../components/sections/AppScreenHeader';
import AppEmptyState from '../../components/states/AppEmptyState';

type ProfileNavStackProp = StackNavigationProp<
  ProfileStackParamList,
  'ProfileAddress'
>;

const safe = (s?: string) => s ?? '';

const formatAddressTH = (a: AddressItem) => {
  const sub = a.join_Subdistrict;
  const dist = a.join_District;
  const prov = a.join_Province;

  return `${safe(a.address)} ต.${safe(sub?.name_th)} อ.${safe(
    dist?.name_th,
  )} จ.${safe(prov?.name_th)} ${safe(sub?.zip_code)}`;
};

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));
const nextFrame = () =>
  new Promise<void>(res => requestAnimationFrame(() => res()));
const flushUI = async (frames = 1) => {
  for (let i = 0; i < frames; i++) await nextFrame();
};

const ProfileAddressScreen = () => {
  const navigation = useNavigation<ProfileNavStackProp>();
  const { scale, verticalScale, responsiveRadius } = useResponsive();
  const insets = useSafeAreaInsets();

  const { items, loading, error, deleteProfileAddress, refetch } =
    useAddressesProfile();

  const [opLoading, setOpLoading] = useState(false);
  const busy = loading || opLoading;

  const [showOverlay, setShowOverlay] = useState(false);
  const overlayStartRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch?.();
    }, [refetch]),
  );

  useEffect(() => {
    if (busy) {
      if (!showOverlay) {
        setShowOverlay(true);
        overlayStartRef.current = Date.now();
      }
      return;
    }

    if (showOverlay) {
      const start = overlayStartRef.current ?? Date.now();
      const elapsed = Date.now() - start;
      const minDuration = 500;
      const remaining = minDuration - elapsed;

      if (remaining <= 0) {
        setShowOverlay(false);
        overlayStartRef.current = null;
      } else {
        const timeout = setTimeout(() => {
          setShowOverlay(false);
          overlayStartRef.current = null;
        }, remaining);

        return () => clearTimeout(timeout);
      }
    }
  }, [busy, showOverlay]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: { flex: 1 },
        infoAddressEmpty: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: verticalScale(IS_TABLET ? 48 : 40),
        },
        infoAddress: {
          backgroundColor: AppColors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: AppColors.border,
          marginTop: verticalScale(IS_TABLET ? 20 : 16),
          borderRadius: responsiveRadius(AppRadius.lg),
          paddingVertical: verticalScale(IS_TABLET ? 18 : 16),
          paddingHorizontal: scale(IS_TABLET ? 20 : 16),
        },
        cardDivider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: AppColors.border,
          marginTop: verticalScale(14),
        },
        addressTypeText: {
          color: AppColors.primary,
        },
        infoAddressHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        buttonHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(IS_TABLET ? 12 : 10),
        },
        infoContent: {
          marginTop: verticalScale(14),
          gap: verticalScale(12),
        },
        infoRow: {
          gap: verticalScale(2),
        },
        infoLabel: {
          color: AppColors.textTertiary,
        },
        footer: {
          paddingTop: verticalScale(12),
          paddingBottom: verticalScale(12) + Math.max(insets.bottom, 0),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: AppColors.border,
        },
        buttonContent: {
          paddingVertical: verticalScale(16),
        },
      }),
    [scale, verticalScale, responsiveRadius, insets.bottom],
  );

  const handleEdit = useCallback(
    (id: string) => {
      if (busy) return;
      navigation.navigate('ProfileManageAddress', { id });
    },
    [navigation, busy],
  );

  const confirmDelete = useCallback(
    (id: string) => {
      if (busy) return;

      Alert.alert('ยืนยันการลบ', 'คุณต้องการลบที่อยู่นี้หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              setOpLoading(true);
              await deleteProfileAddress(id);

              setOpLoading(false);
              await flushUI(2);
              await sleep(1000);

              Alert.alert('สำเร็จ', 'ลบที่อยู่เรียบร้อยแล้ว');
              refetch?.();
            } catch {
              setOpLoading(false);
              await flushUI(2);
              await sleep(1000);

              Alert.alert('ผิดพลาด', 'ไม่สามารถลบที่อยู่ได้');
            }
          },
        },
      ]);
    },
    [busy, deleteProfileAddress, refetch],
  );

  const goCreate = useCallback(() => {
    if (busy) return;
    navigation.navigate('ProfileManageAddress', {});
  }, [navigation, busy]);

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppScrollView
        withHorizontalPadding
        footer={
          <View style={styles.footer}>
            <AppButton
              title="เพิ่มที่อยู่ใหม่"
              onPress={goCreate}
              contentStyle={styles.buttonContent}
              disabled={busy}
              fontSize={AppFontSize.subtitle}
            />
          </View>
        }
      >
        <AppScreenHeader title="ที่อยู่" />

        {error ? (
          <AppEmptyState
            containerStyle={styles.infoAddressEmpty}
            icon="alert-circle-outline"
            title="โหลดที่อยู่ไม่สำเร็จ"
            description="ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองเปิดหน้านี้ใหม่อีกครั้ง"
          />
        ) : items.length === 0 ? (
          <AppEmptyState
            containerStyle={styles.infoAddressEmpty}
            icon="location-outline"
            title="ยังไม่มีที่อยู่"
            description="เพิ่มที่อยู่ไว้เพื่อใช้ตอนสั่งซื้อคอร์สได้เร็วขึ้น"
          />
        ) : (
          <>
            {items.map(a => (
              <View key={a.id} style={styles.infoAddress}>
                <View>
                  <View style={styles.infoAddressHeader}>
                    <AppText
                      fontWeight="semiBold"
                      style={styles.addressTypeText}
                      fontSize={AppFontSize.title}
                    >
                      {a.join_MasterAddressStatus?.label}
                    </AppText>

                    <View style={styles.buttonHeader}>
                      <AppIconButton
                        iconSize={IS_TABLET ? 24 : 20}
                        buttonWidth={IS_TABLET ? 44 : 38}
                        buttonHeight={IS_TABLET ? 44 : 38}
                        bgColor={AppColors.surfaceStrong}
                        icon={<EditLocationIcon />}
                        onPress={() => handleEdit(a.id)}
                        disabled={busy}
                      />
                      <AppIconButton
                        iconSize={IS_TABLET ? 24 : 20}
                        buttonWidth={IS_TABLET ? 44 : 38}
                        buttonHeight={IS_TABLET ? 44 : 38}
                        bgColor={AppColors.danger + '22'}
                        icon={<TrashIcon color={AppColors.danger} />}
                        onPress={() => confirmDelete(a.id)}
                        disabled={busy}
                      />
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Label is secondary text, the value is primary.
                      Previously both were the same size and color, hard to scan. */}
                  <View style={styles.infoContent}>
                    <View style={styles.infoRow}>
                      <AppText
                        fontSize={AppFontSize.caption}
                        style={styles.infoLabel}
                      >
                        ชื่อ-สกุล
                      </AppText>
                      <AppText fontSize={AppFontSize.body}>
                        {safe(a.first_name)} {safe(a.last_name)}
                      </AppText>
                    </View>

                    <View style={styles.infoRow}>
                      <AppText
                        fontSize={AppFontSize.caption}
                        style={styles.infoLabel}
                      >
                        เบอร์โทรศัพท์
                      </AppText>
                      <AppText fontSize={AppFontSize.body}>
                        {safe(a.phone_number)}
                      </AppText>
                    </View>

                    <View style={styles.infoRow}>
                      <AppText
                        fontSize={AppFontSize.caption}
                        style={styles.infoLabel}
                      >
                        ที่อยู่
                      </AppText>
                      <AppText fontSize={AppFontSize.body}>
                        {formatAddressTH(a)}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

      </AppScrollView>

      <AppLoadingOverlay
        visible={showOverlay}
        message="กำลังโหลดข้อมูลที่อยู่..."
      />
    </View>
  );
};

export default ProfileAddressScreen;
