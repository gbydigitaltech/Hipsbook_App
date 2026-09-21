import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import HidePasswordIcon from '../../assets/icons/auth/HidePasswordIcon';
import ShowPasswordIcon from '../../assets/icons/auth/ShowPasswordIcon';
import AppBackground from '../../components/background/AppBackground';
import AppButton from '../../components/buttons/AppButton';
import AppTextInputController from '../../components/inputs/AppTextInputController';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import AppText from '../../components/texts/AppText';
import AppScrollView from '../../components/views/AppScrollView';
import { IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { apiUpdatePassword } from '../../services/profile/profilePassword';
import { AppColors } from '../../styles/colors';
import { AppFontSize } from '../../styles/sharedstyles';
import { ProfileStackParamList } from '../../types/data/navigation/navigation.types';
import {
  changePasswordSchema,
  passwordRules,
  type ChangePasswordSchema as FormValues,
} from '../../validation/profile/profileChangePasswordSchema';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { ApiError } from '../../services/asError';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

type UseChangePasswordOptions = {
  onSuccess?: () => void;
  onWrongOldPassword?: () => void;
};

function useChangePasswordForm(opts?: UseChangePasswordOptions) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    clearErrors,
    formState,
    reset,
  } = useForm<FormValues>({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(
    async ({ currentPassword, newPassword: newPwd }) => {
      try {
        await apiUpdatePassword({
          payload: {
            old_password: currentPassword.trim(),
            new_password: newPwd.trim(),
          },
        });

        reset();
        Alert.alert('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อย');
        opts?.onSuccess?.();
      } catch (e: any) {
        const err: ApiError = e;
        const status =
          err && typeof err.status === 'number' ? err.status : undefined;

        const formHasNoLocalErrors =
          !formState.errors?.currentPassword &&
          !formState.errors?.newPassword &&
          !formState.errors?.confirmNewPassword;

        if ((status === 400 || status === 401) && formHasNoLocalErrors) {
          Alert.alert('ไม่สามารถดำเนินการได้', 'รหัสผ่านเดิมไม่ถูกต้อง');
          opts?.onWrongOldPassword?.();
          return;
        }

        const rawMsg = (typeof err?.message === 'string' && err.message) || '';
        const friendly = rawMsg.includes(':')
          ? rawMsg.split(':').slice(1).join(':').trim()
          : rawMsg;

        Alert.alert(
          'ไม่สามารถดำเนินการได้',
          friendly || 'กรุณาลองใหม่อีกครั้งในภายหลัง',
        );
      }
    },
  );

  const disableSubmit = formState.isSubmitting || formState.isValidating;

  return {
    control,
    formState,
    setValue,
    watch,
    trigger,
    clearErrors,
    reset,
    onSubmit,
    disableSubmit,
  };
}

type ProfileNavStackProp = StackNavigationProp<
  ProfileStackParamList,
  'ProfileChangePassword'
>;

export default function ProfileChangePasswordScreen() {
  const navigation = useNavigation<ProfileNavStackProp>();
  const { scale, verticalScale } = useResponsive();
  const scrollRef = useRef<any>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    formState,
    setValue,
    watch,
    trigger,
    clearErrors,
    onSubmit,
    disableSubmit,
  } = useChangePasswordForm({
    onSuccess: () => navigation.goBack(),
    onWrongOldPassword: () => {
      scrollRef.current?.scrollTo?.({ y: 0, animated: true });
    },
  });

  const {
    errors,
    dirtyFields,
    touchedFields,
    isSubmitted,
    isSubmitting,
    isValidating,
  } = formState;

  const showPasswordRuleAsError =
    !!errors.newPassword &&
    (dirtyFields.newPassword || touchedFields.newPassword || isSubmitted);

  const helperColor = showPasswordRuleAsError
    ? AppColors.danger
    : AppColors.white;

  const newPassword = watch('newPassword') ?? '';

  useEffect(() => {
    if (newPassword?.trim()) trigger('confirmNewPassword');
  }, [newPassword, trigger]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: { flex: 1 },
        formContainer: {
          marginTop: verticalScale(40),
          gap: verticalScale(IS_TABLET ? 4 : 2),
        },
        buttonContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(IS_TABLET ? 12 : 10),
          marginTop: verticalScale(IS_TABLET ? 12 : 10),
        },
        button: {
          flex: 1,
        },
        buttonContent: {
          paddingVertical: verticalScale(16),
        },
      }),
    [scale, verticalScale],
  );

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppScrollView
        ref={scrollRef}
        withHorizontalPadding
        keyboardShouldPersistTaps="handled"
      >
        <AppScreenHeader title="เปลี่ยนรหัสผ่าน" />

        <View style={styles.formContainer}>
          <AppTextInputController
            control={control}
            name="currentPassword"
            label="รหัสผ่านเดิม"
            labelFontSize={IS_TABLET ? 20 : 16}
            fontSize={AppFontSize.subtitle}
            errorFontSize={IS_TABLET ? 14 : 12}
            placeholder="กรอกรหัสผ่านเดิม"
            inputProps={{
              inputWrapperStyle: {
                minHeight: verticalScale(IS_TABLET ? 64 : 54),
              },
              secureTextEntry: !showCurrent,
              autoCapitalize: 'none',
              autoCorrect: false,
              returnKeyType: 'next',
              textContentType: 'password',
              autoComplete: 'current-password',
              rightIcon: showCurrent ? (
                <ShowPasswordIcon size={IS_TABLET ? 24 : 20} />
              ) : (
                <HidePasswordIcon size={IS_TABLET ? 24 : 20} />
              ),
              onPressRightIcon: () => setShowCurrent(s => !s),
              onEndEditing: async (e: any) => {
                const value = e?.nativeEvent?.text?.trim() ?? '';
                if (value) await trigger('currentPassword');
                else clearErrors('currentPassword');
              },
            }}
          />

          <AppTextInputController
            control={control}
            name="newPassword"
            label="รหัสผ่านใหม่"
            labelFontSize={IS_TABLET ? 20 : 16}
            fontSize={AppFontSize.subtitle}
            errorFontSize={IS_TABLET ? 14 : 12}
            placeholder="กรอกรหัสผ่านใหม่"
            showErrorText={false}
            inputProps={{
              inputWrapperStyle: {
                minHeight: verticalScale(IS_TABLET ? 64 : 54),
              },
              secureTextEntry: !showNew,
              autoCapitalize: 'none',
              autoCorrect: false,
              returnKeyType: 'next',
              textContentType: 'newPassword',
              autoComplete: 'new-password',
              rightIcon: showNew ? (
                <ShowPasswordIcon size={IS_TABLET ? 24 : 20} />
              ) : (
                <HidePasswordIcon size={IS_TABLET ? 24 : 20} />
              ),
              onPressRightIcon: () => setShowNew(s => !s),
              onChange: async (e: any) => {
                const text =
                  typeof e === 'string' ? e : e?.nativeEvent?.text ?? '';
                setValue('newPassword', text, {
                  shouldDirty: true,
                  shouldValidate: !!text.trim(),
                });

                if (text.trim()) await trigger('newPassword');
                else clearErrors('newPassword');
              },
            }}
          />

          <AppText
            fontSize={AppFontSize.caption}
            fontWeight="regular"
            style={{ color: helperColor, marginTop: verticalScale(4) }}
          >
            {passwordRules}
          </AppText>

          <AppTextInputController
            control={control}
            name="confirmNewPassword"
            label="ยืนยันรหัสผ่านใหม่"
            labelFontSize={IS_TABLET ? 20 : 16}
            fontSize={AppFontSize.subtitle}
            errorFontSize={IS_TABLET ? 14 : 12}
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            inputProps={{
              inputWrapperStyle: {
                minHeight: verticalScale(IS_TABLET ? 64 : 54),
              },
              secureTextEntry: !showConfirm,
              autoCapitalize: 'none',
              autoCorrect: false,
              returnKeyType: 'done',
              textContentType: 'password',
              autoComplete: 'new-password',
              rightIcon: showConfirm ? (
                <ShowPasswordIcon size={IS_TABLET ? 24 : 20} />
              ) : (
                <HidePasswordIcon size={IS_TABLET ? 24 : 20} />
              ),
              onPressRightIcon: () => setShowConfirm(s => !s),
              onEndEditing: async (e: any) => {
                const value = e?.nativeEvent?.text?.trim() ?? '';
                if (value) await trigger('confirmNewPassword');
                else clearErrors('confirmNewPassword');
              },
            }}
          />
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title="ยกเลิก"
            secondary
            fontSize={AppFontSize.subtitle}
            contentStyle={styles.buttonContent}
            containerStyle={styles.button}
            onPress={() => navigation.goBack()}
          />
          <AppButton
            title="บันทึก"
            fontSize={AppFontSize.subtitle}
            contentStyle={styles.buttonContent}
            loading={isSubmitting && !isValidating}
            disabled={disableSubmit}
            containerStyle={styles.button}
            onPress={onSubmit}
          />
        </View>
      </AppScrollView>

      <AppLoadingOverlay
        visible={isSubmitting && !isValidating}
        message="กำลังบันทึกรหัสผ่าน..."
      />
    </View>
  );
}
