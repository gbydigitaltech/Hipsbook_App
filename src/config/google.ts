import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@env';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { IS_IOS } from '../constants/platform';

/**
 * Configure Google Sign-In once during app startup.
 */
export const configureGoogle = () => {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID, // Required for server auth / idToken flow

    // iOS-specific client id (only set on iOS)
    ...(IS_IOS && {
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    }),

    offlineAccess: true, // Request serverAuthCode for backend token exchange
  });
};
