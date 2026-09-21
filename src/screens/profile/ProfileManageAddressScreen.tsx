import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppBackground from '../../components/background/AppBackground';
import AppButton from '../../components/buttons/AppButton';
import AppTextInputController from '../../components/inputs/AppTextInputController';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import AppSelectController from '../../components/selects/AppSelectController';
import AppScrollView from '../../components/views/AppScrollView';

import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';

import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';

import { useProfileAddressForm } from '../../hooks/profile/useProfileAddressForm';
import type { ProfileStackParamList } from '../../types/data/navigation/navigation.types';
import type {
  AddressForm,
  CreateAddressPayload,
} from '../../types/data/profile/profileAddress.types';

import {
  apiCreateProfileAddress,
  apiUpdateProfileAddress,
} from '../../services/profile/profileAddress';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

type ProfileNavStackProp = StackNavigationProp<
  ProfileStackParamList,
  'ProfileManageAddress'
>;

type ProfileManageAddressRouteProps = RouteProp<
  ProfileStackParamList,
  'ProfileManageAddress'
>;

type LoadingMode = 'idle' | 'load' | 'submit';

const nextFrame = () =>
  new Promise<void>(res => requestAnimationFrame(() => res()));

const flushUI = async (frames = 1) => {
  for (let i = 0; i < frames; i++) {
    await nextFrame();
  }
};

const ProfileManageAddressScreen = () => {
  const navigation = useNavigation<ProfileNavStackProp>();
  const route = useRoute<ProfileManageAddressRouteProps>();

  // If id exists -> edit mode, otherwise create mode
  const editingId = route.params?.id;
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  // Shared form hook:
  // - loads initial data when editing
  // - provides province/district/subdistrict cascading options
  // - exposes form control utilities
  const {
    control,
    handleSubmit,
    trigger,
    clearErrors,
    busy: hookBusy,
    provinceId,
    districtId,
    provinceItems,
    districtItems,
    subdistrictItems,
  } = useProfileAddressForm(editingId);

  // Local loading state for create/update request
  const [submitLoading, setSubmitLoading] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);
  const { scale, verticalScale } = useResponsive();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: { flex: 1 },
        form: {
          marginTop: verticalScale(IS_TABLET ? 38 : 32),
          gap: verticalScale(IS_TABLET ? 4 : 2),
        },
        row: { flexDirection: 'row', gap: scale(IS_TABLET ? 12 : 10) },
        col: { flex: 1 },
        footer: {
          flexDirection: 'row',
          gap: scale(IS_IOS ? 12 : 10),
          paddingHorizontal: scale(sharedPaddingHorizontal),
          paddingTop: verticalScale(12),
          paddingBottom: verticalScale(12) + Math.max(insets.bottom, 0),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: AppColors.border,
        },
        button: { flex: 1 },
        buttonContent: {
          paddingVertical: verticalScale(16),
        },
      }),
    [scale, verticalScale, insets.bottom],
  );

  const loadingMode: LoadingMode = submitLoading
    ? 'submit'
    : hookBusy
    ? 'load'
    : 'idle';

  const busy = loadingMode !== 'idle';

  const overlayMessage =
    loadingMode === 'submit'
      ? 'กำลังบันทึกข้อมูล...'
      : 'กำลังโหลดข้อมูลที่อยู่...';

  const mapToPayload = (v: AddressForm): CreateAddressPayload => {
    if (v.province == null || v.district == null || v.subdistrict == null) {
      throw new Error('กรุณาเลือกจังหวัด/อำเภอ/ตำบลให้ครบ');
    }

    return {
      first_name: (v.firstName ?? '').trim(),
      last_name: (v.lastName ?? '').trim(),
      phone_number: (v.phone ?? '').trim(),
      address: (v.address ?? '').trim(),
      province_id: String(v.province),
      district_id: String(v.district),
      subdistrict_id: String(v.subdistrict),
    };
  };

  const normalizeErr = (err: any) =>
    err?.message ||
    err?.response?.data?.message ||
    'เกิดข้อผิดพลาด กรุณาลองใหม่';

  const onSubmit: SubmitHandler<AddressForm> = async values => {
    if (busy) return;
    setSubmitLoading(true);
    const ctrl = new AbortController();

    const showAlertAfterHidingOverlay = async (
      title: string,
      message: string,
      onOk?: () => void,
    ) => {
      setSubmitLoading(false);
      await flushUI(2);

      Alert.alert(title, message, [{ text: 'ตกลง', onPress: onOk }]);
    };

    try {
      const payload = mapToPayload(values);

      if (editingId) {
        await apiUpdateProfileAddress({
          id: editingId,
          payload,
          signal: ctrl.signal,
        });
      } else {
        await apiCreateProfileAddress({ payload, signal: ctrl.signal });
      }

      await showAlertAfterHidingOverlay(
        'สำเร็จ',
        editingId ? 'แก้ไขที่อยู่เรียบร้อยแล้ว' : 'เพิ่มที่อยู่เรียบร้อยแล้ว',
        goBack,
      );
    } catch (err: any) {
      await showAlertAfterHidingOverlay('ไม่สำเร็จ', normalizeErr(err));
    }
  };

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppScrollView ref={scrollRef} withHorizontalPadding>
        <AppScreenHeader title={editingId ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่'} />

        <View style={styles.form}>
          <AppTextInputController
            control={control}
            name="firstName"
            label="ชื่อ"
            labelFontSize={IS_TABLET ? 20 : 16}
            fontSize={AppFontSize.subtitle}
            errorFontSize={IS_TABLET ? 14 : 12}
            placeholder="กรอกชื่อ"
            inputProps={{
              inputWrapperStyle: {
                minHeight: verticalScale(IS_TABLET ? 64 : 54),
              },
            }}
            disabled={busy}
          />

          <AppTextInputController
            control={control}
            name="lastName"
            label="นามสกุล"
            labelFontSize={IS_TABLET ? 20 : 16}
            fontSize={AppFontSize.subtitle}
            errorFontSize={IS_TABLET ? 14 : 12}
            placeholder="กรอกนามสกุล"
            inputProps={{
              inputWrapperStyle: {
                minHeight: verticalScale(IS_TABLET ? 64 : 54),
              },
            }}
            disabled={busy}
          />

          <AppTextInputController
            control={control}
            name="phone"
            label="เบอร์โทรศัพท์"
            labelFontSize={IS_TABLET ? 20 : 16}
            fontSize={AppFontSize.subtitle}
            errorFontSize={IS_TABLET ? 14 : 12}
            placeholder="กรอกเบอร์โทรศัพท์"
            inputProps={{
              inputWrapperStyle: {
                minHeight: verticalScale(IS_TABLET ? 64 : 54),
              },
              keyboardType: 'phone-pad',
              maxLength: 10,
              onEndEditing: async e => {
                const value = (e.nativeEvent.text ?? '').trim();
                if (value) {
                  await trigger?.('phone');
                } else {
                  clearErrors?.('phone');
                }
              },
            }}
            disabled={busy}
          />

          <AppTextInputController
            control={control}
            name="address"
            label="ที่อยู่"
            labelFontSize={IS_TABLET ? 20 : 16}
            fontSize={AppFontSize.subtitle}
            errorFontSize={IS_TABLET ? 14 : 12}
            placeholder="กรอกที่อยู่"
            inputProps={{
              inputWrapperStyle: {
                minHeight: verticalScale(IS_TABLET ? 64 : 54),
              },
            }}
            disabled={busy}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <AppSelectController<AddressForm, number>
                control={control}
                name="province"
                label="จังหวัด"
                placeholder="เลือกจังหวัด"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                items={provinceItems}
                disabled={busy}
                rules={{ required: 'กรุณาเลือกจังหวัด' }}
                inputWrapperStyle={{
                  minHeight: verticalScale(IS_TABLET ? 64 : 54),
                }}
              />
            </View>

            <View style={styles.col}>
              <AppSelectController<AddressForm, number>
                control={control}
                name="district"
                label="อำเภอ/เขต"
                placeholder="เลือกอำเภอ/เขต"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                items={districtItems}
                disabled={!provinceId || busy}
                rules={{ required: 'กรุณาเลือกอำเภอ/เขต' }}
                inputWrapperStyle={{
                  minHeight: verticalScale(IS_TABLET ? 64 : 54),
                }}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <AppSelectController<AddressForm, number>
                control={control}
                name="subdistrict"
                label="ตำบล/แขวง"
                placeholder="เลือกตำบล/แขวง"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                items={subdistrictItems}
                disabled={!districtId || busy}
                rules={{ required: 'กรุณาเลือกตำบล/แขวง' }}
                inputWrapperStyle={{
                  minHeight: verticalScale(IS_TABLET ? 64 : 54),
                }}
              />
            </View>

            <View style={styles.col}>
              <AppTextInputController
                control={control}
                name="zip"
                label="รหัสไปรษณีย์"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                placeholder="เช่น 10160"
                inputProps={{
                  inputWrapperStyle: {
                    minHeight: verticalScale(IS_TABLET ? 64 : 54),
                  },
                  keyboardType: 'number-pad',
                  maxLength: 5,
                  editable: false,
                }}
                disabled
              />
            </View>
          </View>

        </View>
      </AppScrollView>

      <View style={styles.footer}>
        <AppButton
          title="ยกเลิก"
          secondary
          containerStyle={styles.button}
          contentStyle={styles.buttonContent}
          fontSize={AppFontSize.subtitle}
          onPress={goBack}
          disabled={busy}
        />

        <AppButton
          title="บันทึก"
          containerStyle={styles.button}
          contentStyle={styles.buttonContent}
          fontSize={AppFontSize.subtitle}
          onPress={handleSubmit(onSubmit)}
          loading={submitLoading}
          disabled={busy}
        />
      </View>

      <AppLoadingOverlay
        key={loadingMode}
        visible={loadingMode !== 'idle'}
        message={overlayMessage}
      />
    </View>
  );
};

export default ProfileManageAddressScreen;
