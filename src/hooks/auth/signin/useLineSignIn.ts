import { LINE_CLIENT_ID } from '@env';
import { logError } from '../../../helpers/logger';
import Line, {
  LoginPermission,
  LoginResult,
} from '@xmartlabs/react-native-line';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { apiSignInWithLine } from '../../../services/auth/lineAuth';
import { LineSignInRequest } from '../../../types/data/auth/auth-oauth.types';

type UseLineSignInOptions = {
  isSubmitting?: boolean;
  onSuccess: () => void;
};

const useLineSignIn = ({ isSubmitting, onSuccess }: UseLineSignInOptions) => {
  const [lineLoading, setLineLoading] = useState(false);
  const isSetupRef = useRef(false);

  /** Setup LINE SDK once on mount */
  useEffect(() => {
    (async () => {
      try {
        if (!isSetupRef.current) {
          await Line.setup({ channelId: LINE_CLIENT_ID });
          isSetupRef.current = true;
        }
      } catch (err: any) {
        // Ignore duplicated setup error
        if (!err?.message?.includes('already completed')) {
          logError('Auth', 'LINE setup error', err);
        }
      }
    })();
  }, []);

  /** Handle LINE Sign-In button press */
  const handleLineSignIn = useCallback(async () => {
    try {
      // Prevent duplicate submit
      if (lineLoading || isSubmitting) return;
      setLineLoading(true);

      // Start LINE login flow
      const result: LoginResult = await Line.login({
        scopes: [
          LoginPermission.Profile, // profile info
          LoginPermission.OpenId, // user id (sub)
          LoginPermission.Email, // email (if available)
        ],
      });


      const accessToken = result.accessToken;
      if (!accessToken) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถรับ access token จาก LINE');
        return;
      }

      // Get LINE profile
      const profile = await Line.getProfile();
      if (!profile?.userId) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลผู้ใช้จาก LINE');
        return;
      }

      // Build payload for backend
      const payload: LineSignInRequest = {
        sub: profile.userId,
        name: profile.displayName,
      };

      // Sign in with backend
      const serverResponse = await apiSignInWithLine(payload);

      if (serverResponse?.access_token) {
        onSuccess();
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'ไม่สามารถเข้าสู่ระบบด้วย LINE');
      }
    } catch (err: any) {

      // Ignore user-cancelled login
      if (
        err?.message?.includes(
          'User cancelled or interrupted the login process',
        )
      ) {
        return;
      }

      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเข้าสู่ระบบด้วย LINE');
    } finally {
      setLineLoading(false);
    }
  }, [lineLoading, isSubmitting, onSuccess]);

  return { lineLoading, handleLineSignIn };
};

export default useLineSignIn;
