let hasShownInitialOtpLoading = false;

import type { RouteProp } from '@react-navigation/native';
import { logError } from '../../helpers/logger';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from 'react-native';
import { AvoidSoftInput } from 'react-native-avoid-softinput';

// Shared UI components
import AppBackground from '../../components/background/AppBackground';
import AppButton from '../../components/buttons/AppButton';
import AppOtpInput from '../../components/inputs/AppOtpInput';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import AppText from '../../components/texts/AppText';
import AppSafeView from '../../components/views/AppSafeView';

// Constants / hooks / services / types
import { IMAGES } from '../../constants/images-paths';
import { IS_IOS, IS_TABLET } from '../../constants/platform';
import { useResponsive } from '../../helpers/responsive';
import useOtpFlow from '../../hooks/auth/otp/useOtpFlow';
import type { AuthApiError } from '../../services/auth/auth';
import { apiSignIn, apiVerifyOtp } from '../../services/auth/auth';
import { useAuth } from '../../stores/auth';
import { AppColors } from '../../styles/colors';
import {
  AppFontSize,
  sharedPaddingHorizontal,
} from '../../styles/sharedstyles';
import type { AuthStackParamList } from '../../types/data/navigation/navigation.types';
import { AppOtpInputRef } from '../../types/ui/inputs/app-otp-input.props';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

// Route + navigation typing
type OtpRouteProp = RouteProp<AuthStackParamList, 'ConfirmOTP'>;
type AuthStackNavProp = StackNavigationProp<AuthStackParamList>;

const OtpScreen = () => {
  const route = useRoute<OtpRouteProp>();
  const navigation = useNavigation<AuthStackNavProp>();
  const email = route.params?.email ?? '';

  const { scale, verticalScale } = useResponsive();
  const otpRef = useRef<AppOtpInputRef>(null);

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoading, remainingMs, handleResend, formatTime } = useOtpFlow();

  const pendingOtpCredentials = useAuth(s => s.pendingOtpCredentials);
  const setPendingOtpEmail = useAuth(s => s.setPendingOtpEmail);
  const setPendingOtpCredentials = useAuth(s => s.setPendingOtpCredentials);
  const signIn = useAuth(s => s.signIn);

  const [showInitialLoading, setShowInitialLoading] = useState(
    !hasShownInitialOtpLoading,
  );

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

  useEffect(() => {
    if (!isLoading && showInitialLoading) {
      hasShownInitialOtpLoading = true;
      setShowInitialLoading(false);
    }
  }, [isLoading, showInitialLoading]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex1: { flex: 1 },
        primaryText: { color: AppColors.primary },
        lead: { color: AppColors.textSecondary },
        container: {
          flex: 1,
          width: '100%',
          paddingHorizontal: scale(sharedPaddingHorizontal),
        },
        logo: {
          width: scale(200),
          height: verticalScale(IS_TABLET ? 144 : 120),
          marginTop: verticalScale(24),
          alignSelf: 'center',
        },
        titleArea: {
          alignItems: 'center',
          gap: verticalScale(6),
          marginTop: verticalScale(IS_TABLET ? 38 : 32),
        },
        formArea: {
          width: '100%',
          paddingHorizontal: scale(16),
        },
        inputField: {
          width: '100%',
          marginVertical: verticalScale(32),
        },
        buttonArea: {
          width: '100%',
          marginTop: verticalScale(18),
        },
        button: {
          paddingVertical: verticalScale(16),
        },
        resendOtp: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: verticalScale(28),
          gap: verticalScale(8),
        },
      }),
    [scale, verticalScale],
  );

  const onSubmit = async () => {
    if (otp.length < 6) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอก OTP ให้ครบ 6 หลัก');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await apiVerifyOtp(otp);

      if (!res.is_activate) {
        Alert.alert('แจ้งเตือน', 'บัญชีของคุณยังไม่ถูกยืนยัน');
        return;
      }

      setPendingOtpEmail(null);
      setPendingOtpCredentials(null);

      if (pendingOtpCredentials) {
        try {
          const loginRes = await apiSignIn({
            email: pendingOtpCredentials.email,
            password: pendingOtpCredentials.password,
            remember_me: pendingOtpCredentials.rememberMe,
          });

          signIn(loginRes.provider);
          return;
        } catch (e) {
          logError('Auth', 'Auto login after OTP failed', e);
          Alert.alert(
            'เข้าสู่ระบบไม่สำเร็จ',
            'กรุณาเข้าสู่ระบบอีกครั้งด้วยอีเมลและรหัสผ่านของคุณ',
          );
          navigation.navigate('SignIn');
          return;
        }
      }

      Alert.alert('สำเร็จ', 'บัญชีของคุณถูกยืนยันแล้ว', [
        { text: 'ตกลง', onPress: () => navigation.navigate('SignIn') },
      ]);
    } catch (error) {
      const err = error as AuthApiError;
      const status = err.status;

      if (status === 400) {
        Alert.alert(
          'รหัส OTP ไม่ถูกต้อง',
          'รหัส OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่อีกครั้ง',
        );
      } else {
        Alert.alert(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถยืนยันรหัส OTP ได้ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.flex1}>
      <AppBackground pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={IS_IOS ? 'padding' : undefined}
      >
        <AppSafeView style={styles.container}>
          <AppLoadingOverlay
            visible={(showInitialLoading && isLoading) || isSubmitting}
            message={isSubmitting ? 'กำลังยืนยัน OTP...' : 'กำลังเตรียม OTP...'}
          />

          <AppScreenHeader />

          <Image
            source={IMAGES.otpMailLogo}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.titleArea}>
            <AppText fontWeight="semiBold" fontSize={AppFontSize.h1}>
              เช็คอีเมลของคุณ
            </AppText>
            <AppText fontSize={AppFontSize.body} style={styles.lead}>
              กรุณากรอกตัวเลข 6 หลัก ที่ทางเราได้ส่งไปยังอีเมล
            </AppText>
            <AppText
              fontWeight="medium"
              fontSize={AppFontSize.body}
              style={styles.primaryText}
            >
              {email}
            </AppText>
          </View>

          <View style={styles.formArea}>
            <View style={styles.inputField}>
              <AppOtpInput
                ref={otpRef}
                length={6}
                value={otp}
                onChangeCode={setOtp}
              />
            </View>

            <View style={styles.buttonArea}>
              <AppButton
                title="ยืนยันรหัส OTP"
                loading={isSubmitting}
                onPress={onSubmit}
                fontSize={AppFontSize.subtitle}
                contentStyle={styles.button}
              />
            </View>
          </View>

          <View style={styles.resendOtp}>
            <AppText fontSize={AppFontSize.subtitle}>
              ถ้าคุณยังไม่ได้รับอีเมล{' '}
              <AppText
                onPress={() =>
                  handleResend(() => {
                    otpRef.current?.clear();
                    setOtp('');
                  })
                }
                accessibilityRole="link"
                fontWeight="medium"
                fontSize={AppFontSize.subtitle}
                style={styles.primaryText}
              >
                ส่งซ้ำ
              </AppText>
            </AppText>

            <AppText fontSize={AppFontSize.subtitle}>
              กรุณากรอก OTP ที่คุณได้รับภายใน{' '}
              <AppText
                fontSize={AppFontSize.subtitle}
                style={styles.primaryText}
              >
                {formatTime(remainingMs)}
              </AppText>{' '}
              นาที
            </AppText>
          </View>
        </AppSafeView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default OtpScreen;
