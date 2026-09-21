import { yupResolver } from '@hookform/resolvers/yup';
import { logError } from '../../helpers/logger';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AvoidSoftInput } from 'react-native-avoid-softinput';

// Reusable UI components
import AppBackground from '../../components/background/AppBackground';
import AppButton from '../../components/buttons/AppButton';
import AppTextInputController from '../../components/inputs/AppTextInputController';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import AppText from '../../components/texts/AppText';
import AppSafeView from '../../components/views/AppSafeView';

// App constants / helpers / API / types / validation schema
import { IMAGES } from '../../constants/images-paths';
import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import { apiForgotPassword } from '../../services/auth/auth';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import type { AuthStackParamList } from '../../types/data/navigation/navigation.types';
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '../../validation/auth/forgotPasswordSchema';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

// Typed navigation for this screen
type AuthStackNavProp = StackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<AuthStackNavProp>();
  const { scale, verticalScale } = useResponsive();

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

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const styles = useMemo(
    () => createStyles(scale, verticalScale),
    [scale, verticalScale],
  );

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    try {
      await apiForgotPassword(email.trim());

      Alert.alert(
        'ส่งอีเมลสำเร็จ',
        'กรุณาตรวจสอบกล่องจดหมายของคุณเพื่อรีเซ็ตรหัสผ่าน',
        [
          {
            text: 'ตกลง',
            onPress: () => {
              reset({ email: '' });
              navigation.navigate('SignIn');
            },
          },
        ],
      );
    } catch (e: any) {
      logError('Auth', 'ForgotPassword error', e);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งอีเมลได้');
    }
  };

  return (
    <View style={baseStyles.flex1}>
      <AppBackground pointerEvents="none" />

      <KeyboardAvoidingView
        style={baseStyles.flex1}
        behavior={IS_IOS ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={baseStyles.flex1}>
            <AppSafeView style={styles.container}>
              <AppScreenHeader />

              <Image
                source={IMAGES.forgotLogo}
                style={styles.logo}
                resizeMode="contain"
              />

              <View style={styles.titleArea}>
                <AppText fontWeight="semiBold" fontSize={AppFontSize.h1}>
                  ลืมรหัสผ่านใช่ไหม
                </AppText>
                <AppText fontSize={AppFontSize.body} style={styles.lead}>
                  กรุณากรอกอีเมลของคุณ
                </AppText>
              </View>

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
                    textContentType: 'emailAddress',
                    autoComplete: 'email',
                    returnKeyType: 'default',
                    accessibilityLabel: 'อีเมล',
                  }}
                />
              </View>

              <View style={styles.buttonArea}>
                <AppButton
                  title="รีเซ็ตรหัสผ่าน"
                  onPress={() => !isSubmitting && handleSubmit(onSubmit)()}
                  contentStyle={styles.button}
                  fontSize={AppFontSize.subtitle}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                />
              </View>

              <View style={styles.toSignIn}>
                <Pressable
                  onPress={() => navigation.navigate('SignIn')}
                  accessibilityRole="button"
                  hitSlop={12}
                  style={({ pressed }) => [
                    baseStyles.centered,
                    pressed && baseStyles.pressed,
                  ]}
                >
                  <AppText
                    fontSize={AppFontSize.subtitle}
                    style={baseStyles.primaryText}
                  >
                    หรือเข้าสู่ระบบ
                  </AppText>
                </Pressable>
              </View>

              <AppLoadingOverlay
                visible={isSubmitting}
                message="กำลังส่งอีเมลสำหรับรีเซ็ตรหัสผ่าน..."
              />
            </AppSafeView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPasswordScreen;

const baseStyles = StyleSheet.create({
  flex1: { flex: 1 },
  primaryText: { color: AppColors.primary },
  centered: { alignSelf: 'center' },
  pressed: { opacity: 0.8 },
});

const createStyles = (
  scale: (n: number) => number,
  verticalScale: (n: number) => number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      paddingHorizontal: scale(sharedPaddingHorizontal),
    },

    logo: {
      width: '100%',
      height: verticalScale(IS_TABLET ? 144 : 120),
      marginTop: verticalScale(IS_TABLET ? 32 : 24),
      alignSelf: 'center',
    },

    titleArea: {
      alignItems: 'center',
      gap: verticalScale(6),
      marginTop: verticalScale(IS_TABLET ? 38 : 32),
    },

    lead: {
      color: AppColors.textSecondary,
    },

    inputField: {
      width: '100%',
      marginTop: verticalScale(IS_TABLET ? 24 : 18),
    },

    buttonArea: {
      marginTop: verticalScale(8),
    },

    button: {
      paddingVertical: verticalScale(16),
    },

    toSignIn: {
      marginTop: verticalScale(18),
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
