import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import DatePicker from 'react-native-date-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import HidePasswordIcon from '../../assets/icons/auth/HidePasswordIcon';
import ShowPasswordIcon from '../../assets/icons/auth/ShowPasswordIcon';
import CalendarIcon from '../../assets/icons/CalendarIcon';

import AppBackground from '../../components/background/AppBackground';
import AppButton from '../../components/buttons/AppButton';
import AppCheckbox from '../../components/inputs/AppCheckbox';
import AppTextInputController from '../../components/inputs/AppTextInputController';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import TermsModal from '../../components/modals/TermsModal';
import AppText from '../../components/texts/AppText';
import AppSafeView from '../../components/views/AppSafeView';

import { IMAGES } from '../../constants/images-paths';
import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  PRESSED_OPACITY,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';

import { useSignUpForm } from '../../hooks/auth/signup/useSignUpForm';
import { useTermOfService } from '../../hooks/terms/useTermOfService';
import { useAuth } from '../../stores/auth';
import { AuthStackParamList } from '../../types/data/navigation/navigation.types';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

type AuthStackNavProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

const SignUpScreen = () => {
  const navigation = useNavigation<AuthStackNavProp>();
  const { scale, verticalScale } = useResponsive();

  const {
    data: tosData,
    loading: tosLoading,
    error: tosError,
    refetch: refetchTos,
  } = useTermOfService();

  const [openTerms, setOpenTerms] = useState(false);

  const setPendingOtpEmail = useAuth(s => s.setPendingOtpEmail);

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    clearErrors,
    isSubmitting,
    isValidating,
    openDate,
    setOpenDate,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isChecked,
    setIsChecked,
    helperColor,
    safeDate,
    todayEnd,
    setBirthdayFromDate,
    onSubmit,
  } = useSignUpForm({
    onPendingActivation: (email: string) => {
      setPendingOtpEmail(email);
      navigation.navigate('ConfirmOTP', { email });
    },
  });

  useFocusEffect(
    useCallback(() => {
      AvoidSoftInput.setEnabled(true);
      AvoidSoftInput.setAvoidOffset(0);

      return () => {
        AvoidSoftInput.setAvoidOffset(0);
        AvoidSoftInput.setEnabled(false);
      };
    }, []),
  );

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        width: '100%',
        paddingHorizontal: scale(sharedPaddingHorizontal),
      },
      flex1: {
        flex: 1,
      },
      appLogo: {
        alignSelf: 'center',
        width: '72%',
        height: verticalScale(IS_TABLET ? 116 : 100),
        marginTop: verticalScale(IS_TABLET ? -46 : -40),
        marginBottom: verticalScale(4),
      },
      title: {
        alignSelf: 'center',
        textAlign: 'center',
      },
      brandText: {
        color: AppColors.primary,
      },
      lead: {
        alignSelf: 'center',
        textAlign: 'center',
        color: AppColors.textSecondary,
        marginTop: verticalScale(4),
        marginBottom: verticalScale(4),
      },
      inputField: {
        width: '100%',
        marginTop: verticalScale(IS_TABLET ? 10 : 8),
        gap: verticalScale(IS_TABLET ? 4 : 2),
      },
      checkBoxArea: {
        flexDirection: 'row',
        gap: scale(IS_TABLET ? 14 : 12),
        alignItems: 'flex-start',
        marginTop: verticalScale(10),
        marginLeft: IS_IOS ? scale(4) : 0,
      },
      checkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      termsTextWrap: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,
      },
      termsText: {
        color: AppColors.textSecondary,
      },
      termsLink: {
        color: AppColors.primary,
        textDecorationLine: 'underline',
      },
      buttonArea: {
        marginTop: verticalScale(IS_TABLET ? 20 : 16),
      },
      button: {
        paddingVertical: verticalScale(IS_IOS ? 18 : 16),
      },
      toSignIn: {
        flexDirection: 'row',
        alignSelf: 'center',
        marginTop: verticalScale(IS_TABLET ? 20 : 16),
        marginBottom: verticalScale(35),
      },
      scrollContent: {
        flexGrow: 1,
        paddingBottom: verticalScale(24),
      },
    });
  }, [scale, verticalScale]);

  const termsContent = useMemo(() => {
    if (tosLoading) return 'กำลังโหลดข้อกำหนดการใช้งาน...';
    if (tosError) {
      return 'ไม่สามารถโหลดข้อกำหนดการใช้งานได้ กรุณาปิดแล้วลองใหม่อีกครั้ง';
    }
    return tosData?.value || 'ไม่พบข้อมูลข้อกำหนดการใช้งาน';
  }, [tosLoading, tosError, tosData]);

  const termsContentType = useMemo(() => {
    if (!tosLoading && !tosError && tosData?.value) return 'html' as const;
    return 'text' as const;
  }, [tosLoading, tosError, tosData]);

  const openTermsModal = async () => {
    Keyboard.dismiss();
    if (!tosData || tosError) {
      await refetchTos();
    }
    setOpenTerms(true);
  };

  const handleOpenBirthdayPicker = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      setOpenDate(true);
    }, 150);
  };

  return (
    <View style={styles.flex1}>
      <AppBackground pointerEvents="none" />

      <AppSafeView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.flex1}>
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            enableOnAndroid
            enableAutomaticScroll
            extraScrollHeight={20}
            extraHeight={120}
            keyboardOpeningTime={250}
          >
            <AppScreenHeader />

            <Image
              source={IMAGES.appLogoFull}
              style={styles.appLogo}
              resizeMode="contain"
            />

            <AppText
              fontSize={AppFontSize.h1}
              fontWeight="semiBold"
              style={styles.title}
            >
              สมัครสมาชิก
              <AppText
                fontSize={AppFontSize.h1}
                fontWeight="semiBold"
                style={styles.brandText}
              >
                {' '}
                HIPSBOOK
              </AppText>
            </AppText>

            <AppText fontSize={AppFontSize.body} style={styles.lead}>
              สร้างบัญชีเพื่อเริ่มเรียนคอร์สดนตรีของคุณ
            </AppText>

            <View style={styles.inputField}>
              <AppTextInputController
                control={control}
                name="email"
                label="อีเมล"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                placeholder="กรุณากรอกอีเมล"
                inputProps={{
                  inputWrapperStyle: {
                    minHeight: verticalScale(IS_TABLET ? 64 : 54),
                  },
                  autoCapitalize: 'none',
                  keyboardType: 'email-address',
                  returnKeyType: 'next',
                  onEndEditing: async (e: any) => {
                    const value = e?.nativeEvent?.text?.trim() ?? '';
                    if (value) await trigger('email');
                    else clearErrors('email');
                  },
                }}
              />

              <AppTextInputController
                control={control}
                name="firstName"
                label="ชื่อ"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                placeholder="กรุณากรอกชื่อ"
                inputProps={{
                  inputWrapperStyle: {
                    minHeight: verticalScale(IS_TABLET ? 64 : 54),
                  },
                  returnKeyType: 'next',
                }}
              />

              <AppTextInputController
                control={control}
                name="lastName"
                label="นามสกุล"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                placeholder="กรุณากรอกนามสกุล"
                inputProps={{
                  inputWrapperStyle: {
                    minHeight: verticalScale(IS_TABLET ? 64 : 54),
                  },
                  returnKeyType: 'next',
                }}
              />

              <AppTextInputController
                control={control}
                name="phone"
                label="เบอร์โทรศัพท์"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                placeholder="กรุณากรอกเบอร์โทรศัพท์"
                inputProps={{
                  inputWrapperStyle: {
                    minHeight: verticalScale(IS_TABLET ? 64 : 54),
                  },
                  keyboardType: 'phone-pad',
                  maxLength: 10,
                  returnKeyType: 'next',
                  onEndEditing: async (e: any) => {
                    const value = e?.nativeEvent?.text?.trim() ?? '';
                    if (value) await trigger('phone');
                    else clearErrors('phone');
                  },
                }}
              />

              <TouchableOpacity
                activeOpacity={1}
                onPress={handleOpenBirthdayPicker}
              >
                <View pointerEvents="none">
                  <AppTextInputController
                    control={control}
                    name="birthday"
                    label="วันเกิด"
                    labelFontSize={IS_TABLET ? 20 : 16}
                    fontSize={AppFontSize.subtitle}
                    errorFontSize={IS_TABLET ? 14 : 12}
                    placeholder="เลือกวัน"
                    formatValue={v => (typeof v === 'string' ? v : '')}
                    inputProps={{
                      inputWrapperStyle: {
                        minHeight: verticalScale(IS_TABLET ? 64 : 54),
                      },
                      editable: false,
                      rightIcon: <CalendarIcon size={IS_TABLET ? 24 : 20} />,
                    }}
                  />
                </View>
              </TouchableOpacity>

              <DatePicker
                modal
                open={openDate}
                date={safeDate}
                mode="date"
                locale="th"
                confirmText="ยืนยัน"
                cancelText="ยกเลิก"
                maximumDate={todayEnd}
                onConfirm={d => {
                  setBirthdayFromDate(d);
                  setOpenDate(false);
                }}
                onCancel={() => setOpenDate(false)}
              />

              <AppTextInputController
                control={control}
                name="password"
                label="รหัสผ่าน"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                placeholder="กรุณากรอกรหัสผ่าน"
                showErrorText={false}
                inputProps={{
                  inputWrapperStyle: {
                    minHeight: verticalScale(IS_TABLET ? 64 : 54),
                  },
                  secureTextEntry: !showPassword,
                  autoCapitalize: 'none',
                  returnKeyType: 'next',
                  rightIcon: showPassword ? (
                    <ShowPasswordIcon size={IS_TABLET ? 24 : 20} />
                  ) : (
                    <HidePasswordIcon size={IS_TABLET ? 24 : 20} />
                  ),
                  onPressRightIcon: () => setShowPassword(s => !s),
                  onChange: async (e: any) => {
                    const text =
                      typeof e === 'string' ? e : e?.nativeEvent?.text ?? '';
                    setValue('password', text, { shouldDirty: true });
                    if (text.trim()) await trigger('password');
                    else clearErrors('password');
                  },
                }}
              />

              <AppText
                fontSize={AppFontSize.caption}
                fontWeight="regular"
                style={{ color: helperColor, marginTop: verticalScale(4) }}
              >
                รหัสผ่านต้องมี 8 - 20 ตัวอักษร และประกอบด้วย a-z, A-Z และตัวเลข
                0-9
              </AppText>

              <AppTextInputController
                control={control}
                name="confirmPassword"
                label="ยืนยันรหัสผ่าน"
                labelFontSize={IS_TABLET ? 20 : 16}
                fontSize={AppFontSize.subtitle}
                errorFontSize={IS_TABLET ? 14 : 12}
                placeholder="กรุณากรอกรหัสผ่าน"
                inputProps={{
                  inputWrapperStyle: {
                    minHeight: verticalScale(IS_TABLET ? 64 : 54),
                  },
                  secureTextEntry: !showConfirmPassword,
                  autoCapitalize: 'none',
                  returnKeyType: 'done',
                  rightIcon: showConfirmPassword ? (
                    <ShowPasswordIcon size={IS_TABLET ? 24 : 20} />
                  ) : (
                    <HidePasswordIcon size={IS_TABLET ? 24 : 20} />
                  ),
                  onPressRightIcon: () => setShowConfirmPassword(s => !s),
                  onEndEditing: async (e: any) => {
                    const value = e?.nativeEvent?.text?.trim() ?? '';
                    if (value) await trigger('confirmPassword');
                    else clearErrors('confirmPassword');
                  },
                }}
              />

              <View style={styles.checkBoxArea}>
                <View>
                  <AppCheckbox
                    value={!!isChecked}
                    onValueChange={async () => {
                      if (!isChecked) {
                        await openTermsModal();
                        return;
                      }
                      setIsChecked(false);
                    }}
                    size={IS_TABLET ? 24 : 20}
                  />

                  {!isChecked && (
                    <TouchableOpacity
                      activeOpacity={PRESSED_OPACITY}
                      onPress={openTermsModal}
                      style={styles.checkOverlay}
                    />
                  )}
                </View>

                <View style={styles.termsTextWrap}>
                  <AppText fontSize={AppFontSize.caption} style={styles.termsText}>
                    การสมัครใช้งาน เราถือว่าคุณยอมรับ{' '}
                    <AppText
                      fontSize={AppFontSize.caption}
                      fontWeight="medium"
                      style={styles.termsLink}
                      accessibilityRole="link"
                      onPress={openTermsModal}
                    >
                      ข้อกำหนดการใช้งาน
                    </AppText>{' '}
                    ของ Hipsbook แล้ว
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.buttonArea}>
              <AppButton
                title="สมัครสมาชิก"
                fontSize={AppFontSize.subtitle}
                loading={isSubmitting && !isValidating}
                disabled={!isChecked}
                onPress={handleSubmit(onSubmit)}
                contentStyle={styles.button}
              />
            </View>

            <View style={styles.toSignIn}>
              <AppText fontSize={AppFontSize.subtitle}>มีบัญชีแล้ว </AppText>
              <AppText
                onPress={() => navigation.navigate('SignIn')}
                accessibilityRole="link"
                style={{ color: AppColors.primary }}
                fontSize={AppFontSize.subtitle}
              >
                เข้าสู่ระบบ
              </AppText>
            </View>
          </KeyboardAwareScrollView>
        </View>
        </TouchableWithoutFeedback>

        <TermsModal
          visible={openTerms}
          onClose={() => setOpenTerms(false)}
          title="เงื่อนไขและข้อตกลงในการใช้บริการจาก Hipsbook ของผู้ใช้บริการ"
          content={termsContent}
          contentType={termsContentType}
          onAccept={() => setIsChecked(true)}
        />

        <AppLoadingOverlay
          visible={isSubmitting && !isValidating}
          message="กำลังสมัครสมาชิก..."
        />
      </AppSafeView>
    </View>
  );
};

export default SignUpScreen;
