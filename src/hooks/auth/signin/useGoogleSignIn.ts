import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { apiSignInWithGoogle } from '../../../services/auth/googleAuth';
import { GoogleSignInRequest } from '../../../types/data/auth/auth-oauth.types';

type UseGoogleSignInOptions = {
  isSubmitting?: boolean;
  onSuccess: () => void;
};

const useGoogleSignIn = ({
  isSubmitting,
  onSuccess,
}: UseGoogleSignInOptions) => {
  const [googleLoading, setGoogleLoading] = useState(false);

  /** Handle Google Sign-In button press */
  const handleGoogleSignIn = useCallback(async () => {
    try {
      // Prevent duplicate submit
      if (googleLoading || isSubmitting) return;
      setGoogleLoading(true);

      // Ensure Play Services are available (mainly Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Start Google sign-in flow
      const userInfo = await GoogleSignin.signIn();
      if (!userInfo || !userInfo.data?.user) return;

      // Extract user info from Google response
      const { id, email, name } = userInfo.data.user;

      // Build payload for backend
      const payload: GoogleSignInRequest = {
        id,
        email,
        name: name ?? undefined,
      };

      // Sign in with backend
      const res = await apiSignInWithGoogle(payload);

      if (res?.access_token) {
        onSuccess();
      } else {
        Alert.alert(
          'เข้าสู่ระบบไม่สำเร็จ',
          'ไม่สามารถเข้าสู่ระบบด้วย Google ได้',
        );
      }
    } catch (e: any) {
      // Ignore user-cancelled sign-in
      if (
        e?.code === statusCodes.SIGN_IN_CANCELLED ||
        e?.code === 'sign_in_cancelled' ||
        e?.code === 12501
      ) {
        return;
      }

      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLoading, isSubmitting, onSuccess]);

  return { googleLoading, handleGoogleSignIn };
};

export default useGoogleSignIn;
