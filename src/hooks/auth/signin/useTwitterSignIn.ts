import { TWITTER_CLIENT_ID } from '@env';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { authorize, AuthorizeResult } from 'react-native-app-auth';
import { apiSignInWithTwitter } from '../../../services/auth/twitterAuth';
import { TwitterSignInRequest } from '../../../types/data/auth/auth-oauth.types';

type UseTwitterSignInOptions = {
  isSubmitting?: boolean;
  onSuccess: () => void;
};

const TWITTER_REDIRECT_URI = 'com.gby.hipsbook://callback';
const TWITTER_SCOPES = ['tweet.read', 'users.read', 'offline.access'];

/** OAuth config for Twitter login */
const twitterAuthConfig = {
  clientId: TWITTER_CLIENT_ID,
  redirectUrl: TWITTER_REDIRECT_URI,
  scopes: TWITTER_SCOPES,
  serviceConfiguration: {
    authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
    tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
  },
  usePKCE: true,
  skipCodeExchange: false,
};

const useTwitterSignIn = ({
  isSubmitting,
  onSuccess,
}: UseTwitterSignInOptions) => {
  const [twitterLoading, setTwitterLoading] = useState(false);

  /** Handle Twitter Sign-In button press */
  const handleTwitterSignIn = useCallback(async () => {
    try {
      // Prevent duplicate submit
      if (twitterLoading || isSubmitting) return;
      setTwitterLoading(true);

      // Start OAuth flow
      const authState: AuthorizeResult = await authorize(twitterAuthConfig);

      const accessToken = authState.accessToken;
      if (!accessToken) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถรับ access token จาก Twitter');
        return;
      }

      // Get current user info from Twitter API
      const userResponse = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=name',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const userJson = await userResponse.json();
      if (!userJson?.data?.id) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลผู้ใช้จาก Twitter');
        return;
      }

      // Build payload for backend
      const payload: TwitterSignInRequest = {
        id: userJson.data.id,
        name: userJson.data.name,
      };

      // Sign in with backend
      const serverResponse = await apiSignInWithTwitter(payload);

      if (serverResponse?.access_token) {
        onSuccess();
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'ไม่สามารถเข้าสู่ระบบด้วย Twitter');
      }
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเข้าสู่ระบบด้วย Twitter');
    } finally {
      setTwitterLoading(false);
    }
  }, [twitterLoading, isSubmitting, onSuccess]);

  return { twitterLoading, handleTwitterSignIn };
};

export default useTwitterSignIn;
