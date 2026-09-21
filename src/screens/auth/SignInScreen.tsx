import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AvoidSoftInput } from 'react-native-avoid-softinput';

import HidePasswordIcon from '../../assets/icons/auth/HidePasswordIcon';
import ShowPasswordIcon from '../../assets/icons/auth/ShowPasswordIcon';
import AppBackground from '../../components/background/AppBackground';
import AppButton from '../../components/buttons/AppButton';
import AppCheckbox from '../../components/inputs/AppCheckbox';
import AppCircleIconButton from '../../components/buttons/AppCircleIconButton';
import AppTextInputController from '../../components/inputs/AppTextInputController';
import AppText from '../../components/texts/AppText';
import AppSafeView from '../../components/views/AppSafeView';

import { IMAGES } from '../../constants/images-paths';
import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import useAppleSignIn from '../../hooks/auth/signin/useAppleSignIn';
import useGoogleSignIn from '../../hooks/auth/signin/useGoogleSignIn';
import useLineSignIn from '../../hooks/auth/signin/useLineSignIn';
import { useSignInForm } from '../../hooks/auth/signin/useSignInForm';
import useTwitterSignIn from '../../hooks/auth/signin/useTwitterSignIn';
import { useAuth } from '../../stores/auth';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  PRESSED_OPACITY,
  androidSafeTop,
  iosSafeTop,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import { AuthStackParamList } from '../../types/data/navigation/navigation.types';

type AuthStackNavProp = StackNavigationProp<AuthStackParamList, 'SignIn'>;

const SignInScreen = () => {
  const navigation = useNavigation<AuthStackNavProp>();
  const { scale, verticalScale } = useResponsive();

  const signIn = useAuth(s => s.signIn);
  const setPendingOtpEmail = useAuth(s => s.setPendingOtpEmail);
  const setPendingOtpCredentials = useAuth(s => s.setPendingOtpCredentials);

  const {
    control,
    handleSubmit,
    trigger,
    clearErrors,
    isSubmitting,
    showPassword,
    setShowPassword,
    isChecked,
    setIsChecked,
    onSubmit,
  } = useSignInForm({
    onPendingActivation: ({ email, password, rememberMe }) => {
      setPendingOtpEmail(email);
      setPendingOtpCredentials({ email, password, rememberMe });
      navigation.navigate('ConfirmOTP', { email });
    },
    onSuccess: provider => {
      signIn(provider);
    },
  });

  const { googleLoading, handleGoogleSignIn } = useGoogleSignIn({
    isSubmitting,
    onSuccess: () => signIn(),
  });

  const { twitterLoading, handleTwitterSignIn } = useTwitterSignIn({
    isSubmitting,
    onSuccess: () => signIn(),
  });

  const { lineLoading, handleLineSignIn } = useLineSignIn({
    isSubmitting,
    onSuccess: () => signIn(),
  });

  const { appleLoading, handleAppleSignIn } = useAppleSignIn({
    isSubmitting,
    onSuccess: () => signIn(),
  });

  const isBusy =
    isSubmitting ||
    googleLoading ||
    twitterLoading ||
    lineLoading ||
    appleLoading;

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex1: { flex: 1 },
        primaryText: { color: AppColors.primary },
        linkText: {
          color: AppColors.primary,
        },
        container: {
          flex: 1,
          alignItems: 'center',
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },
        logo: {
          width: '100%',
          height: verticalScale(IS_TABLET ? 144 : 120),
          marginBottom: verticalScale(20),
          marginTop: IS_IOS
            ? verticalScale(iosSafeTop)
            : verticalScale(androidSafeTop),
        },
        inputField: {
          width: '100%',
          marginTop: verticalScale(20),
          gap: verticalScale(IS_TABLET ? 4 : 2),
        },
        forgotPasswordContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        checkBoxArea: {
          flexDirection: 'row',
          gap: scale(12),
          alignItems: 'center',
          marginLeft: IS_IOS ? scale(5) : scale(0),
        },
        buttonArea: {
          marginTop: verticalScale(16),
        },
        button: {
          paddingVertical: verticalScale(16),
        },
        dividerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'stretch',
          gap: scale(12),
        },
        dividerLine: {
          flex: 1,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.16)',
        },
        dividerText: {
          color: AppColors.textTertiary,
        },
        toSignUp: {
          marginTop: verticalScale(IS_TABLET ? 30 : 24),
          flexDirection: 'row',
          alignItems: 'center',
        },
        thirdPartySignIn: {
          alignItems: 'center',
          marginTop: verticalScale(IS_TABLET ? 30 : 24),
          width: '100%',
        },
        circleButtonsContainer: {
          flexDirection: 'row',
          gap: scale(IS_TABLET ? 24 : 14),
          marginTop: verticalScale(IS_TABLET ? 22 : 12),
        },
      }),
    [scale, verticalScale],
  );

  return (
    <View style={styles.flex1}>
      <AppBackground pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={IS_IOS ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex1}>
            <AppSafeView style={styles.container}>
              <Image
                source={IMAGES.appLogoFull}
                style={styles.logo}
                resizeMode="contain"
              />

              <AppText fontSize={AppFontSize.h1} fontWeight="semiBold">
                เข้าสู่บัญชี
                <AppText
                  fontSize={AppFontSize.h1}
                  fontWeight="semiBold"
                  style={styles.primaryText}
                >
                  {' '}
                  HIPSBOOK
                </AppText>{' '}
                ของคุณ
              </AppText>

              <AppText fontSize={AppFontSize.body}>
                เรียนรู้คอร์สเรียนกับดนตรีหลากหลายประเภท
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
                    onEndEditing: async (e: any) => {
                      const value = e?.nativeEvent?.text?.trim() ?? '';
                      if (value) await trigger('email');
                      else clearErrors('email');
                    },
                    editable: !isBusy,
                  }}
                />

                <AppTextInputController
                  control={control}
                  name="password"
                  label="รหัสผ่าน"
                  labelFontSize={IS_TABLET ? 20 : 16}
                  fontSize={AppFontSize.subtitle}
                  errorFontSize={IS_TABLET ? 14 : 12}
                  placeholder="กรุณากรอกรหัสผ่าน"
                  inputProps={{
                    inputWrapperStyle: {
                      minHeight: verticalScale(IS_TABLET ? 64 : 54),
                    },
                    secureTextEntry: !showPassword,
                    autoCapitalize: 'none',
                    rightIcon: showPassword ? (
                      <ShowPasswordIcon size={IS_TABLET ? 24 : 20} />
                    ) : (
                      <HidePasswordIcon size={IS_TABLET ? 24 : 20} />
                    ),
                    onPressRightIcon: () => setShowPassword(prev => !prev),
                    onEndEditing: async (e: any) => {
                      const value = e?.nativeEvent?.text?.trim() ?? '';
                      if (value) await trigger('password');
                      else clearErrors('password');
                    },
                    editable: !isBusy,
                  }}
                />

                <View style={styles.forgotPasswordContainer}>
                  <View style={styles.checkBoxArea}>
                    <AppCheckbox
                      value={isChecked}
                      onValueChange={setIsChecked}
                      disabled={isBusy}
                      size={IS_TABLET ? 24 : 20}
                    />
                    <AppText fontSize={AppFontSize.body}>จดจำฉัน</AppText>
                  </View>

                  <Pressable
                    onPress={() => navigation.navigate('ForgotPassword')}
                    accessibilityRole="button"
                    hitSlop={12}
                    style={({ pressed }) => ({
                      alignSelf: 'flex-start',
                      opacity: pressed ? PRESSED_OPACITY : 1,
                    })}
                    disabled={isBusy}
                  >
                    <AppText
                      fontSize={AppFontSize.body}
                      style={styles.primaryText}
                    >
                      ลืมรหัสผ่าน?
                    </AppText>
                  </Pressable>
                </View>

                <View style={styles.buttonArea}>
                  <AppButton
                    title="เข้าสู่ระบบ"
                    fontSize={AppFontSize.subtitle}
                    onPress={() => {
                      if (isBusy) return;
                      handleSubmit(onSubmit)();
                    }}
                    disabled={isBusy}
                    contentStyle={styles.button}
                  />
                </View>
              </View>

              <View style={styles.toSignUp}>
                <AppText fontSize={AppFontSize.subtitle}>
                  ยังไม่เป็นสมาชิก?{' '}
                </AppText>
                <Pressable
                  onPress={() => navigation.navigate('SignUp')}
                  accessibilityRole="button"
                  hitSlop={12}
                  style={({ pressed }) => ({
                    alignSelf: 'flex-start',
                    opacity: pressed ? PRESSED_OPACITY : 1,
                  })}
                >
                  <AppText
                    style={styles.linkText}
                    fontSize={AppFontSize.subtitle}
                  >
                    กดเพื่อสมัครสมาชิก
                  </AppText>
                </Pressable>
              </View>

              <View style={styles.thirdPartySignIn}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <AppText
                    fontSize={AppFontSize.body}
                    style={styles.dividerText}
                  >
                    หรือเข้าสู่ระบบด้วย
                  </AppText>
                  <View style={styles.dividerLine} />
                </View>
                <View style={styles.circleButtonsContainer}>
                  <AppCircleIconButton
                    iconSource={IMAGES.googleIcon}
                    size={IS_TABLET ? 38 : 32}
                    onPress={handleGoogleSignIn}
                    disabled={isBusy}
                  />
                  <AppCircleIconButton
                    iconSource={IMAGES.xIcon}
                    size={IS_TABLET ? 38 : 32}
                    onPress={handleTwitterSignIn}
                    disabled={isBusy}
                  />
                  <AppCircleIconButton
                    iconSource={IMAGES.lineIcon}
                    size={IS_TABLET ? 38 : 32}
                    onPress={handleLineSignIn}
                    disabled={isBusy}
                  />
                  <AppCircleIconButton
                    iconSource={IMAGES.appleIcon}
                    size={IS_TABLET ? 38 : 32}
                    onPress={handleAppleSignIn}
                    disabled={isBusy}
                  />
                </View>
              </View>
            </AppSafeView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignInScreen;
