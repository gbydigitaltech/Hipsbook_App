import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// True when the app is running on Android
export const IS_Android = Platform.OS === 'android';

// True when the app is running on iOS
export const IS_IOS = Platform.OS === 'ios';

// True when the current device is a tablet (Android or iOS)
export const IS_TABLET = DeviceInfo.isTablet();
