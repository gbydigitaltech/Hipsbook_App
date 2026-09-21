import { appleAuth } from '@invertase/react-native-apple-authentication';
import { log, logWarn } from '../../../helpers/logger';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { IS_IOS } from '../../../constants/platform';
import { apiSignInWithApple } from '../../../services/auth/appleAuth';
import { AppleSignInRequest } from '../../../types/data/auth/auth-oauth.types';

type UseAppleSignInOptions = {
  isSubmitting?: boolean;
  onSuccess: () => void;
};

const useAppleSignIn = ({ isSubmitting, onSuccess }: UseAppleSignInOptions) => {
  const [appleLoading, setAppleLoading] = useState(false);
  const [isAppleSupported, setIsAppleSupported] = useState(false);

  /** Check whether current iOS device supports Apple Sign-In */
  useEffect(() => {
    if (IS_IOS) {
      log('Auth', 'Device iOS Version:', Platform.Version);
      log('Auth', 'AppleAuth isSupported:', appleAuth.isSupported);
      setIsAppleSupported(appleAuth.isSupported);
    }
  }, []);

  /** Listen for Apple credential revoke event */
  useEffect(() => {
    if (!IS_IOS || !isAppleSupported) return;

    return appleAuth.onCredentialRevoked(async () => {
      logWarn('Auth', 'Apple credentials revoked');
    });
  }, [isAppleSupported]);

  /** Handle Sign in with Apple button press */
  const handleAppleSignIn = useCallback(async () => {
    // Allow only iOS
    if (!IS_IOS) {
      Alert.alert('ไม่รองรับ', 'Sign in with Apple รองรับเฉพาะ iOS');
      return;
    }

    // iOS must be supported (iOS 13+)
    if (!isAppleSupported) {
      Alert.alert(
        'ไม่รองรับ',
        'อุปกรณ์นี้ไม่รองรับ Sign in with Apple (ต้อง iOS 13 ขึ้นไป)',
      );
      return;
    }

    // Prevent duplicate submit
    if (appleLoading || isSubmitting) return;
    setAppleLoading(true);

    try {
      // Request Apple auth data
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // Ensure user is authorized
      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user,
      );

      if (credentialState !== appleAuth.State.AUTHORIZED) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถ authorize ผู้ใช้ได้');
        return;
      }


      const { identityToken, fullName } = appleAuthRequestResponse;

      // identityToken is required
      if (!identityToken) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถรับ identity token จาก Apple');
        return;
      }

      // Build payload for backend
      const payload: AppleSignInRequest = {
        name: fullName
          ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
          : undefined,
        id: appleAuthRequestResponse.user,
      };

      // Sign in with server
      const serverResponse = await apiSignInWithApple(payload);

      if (serverResponse?.access_token) {
        onSuccess();
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'ไม่สามารถเข้าสู่ระบบด้วย Apple');
      }
    } catch (err: any) {

      // Ignore cancel action from user
      if (err.code !== appleAuth.Error.CANCELED) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเข้าสู่ระบบด้วย Apple');
      }
    } finally {
      setAppleLoading(false);
    }
  }, [appleLoading, isSubmitting, onSuccess, isAppleSupported]);

  return { appleLoading, handleAppleSignIn, isAppleSupported };
};

export default useAppleSignIn;
