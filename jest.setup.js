import '@testing-library/jest-native/extend-expect';

/* ============================================================================
 * Core React Native / Reanimated
 * ========================================================================== */

// Reanimated must be mocked for Jest, otherwise tests often fail in RN projects
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

/* ============================================================================
 * Native Modules (TurboModule / NativeEventEmitter)
 * ========================================================================== */

// Boot splash
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(),
  show: jest.fn(),
  getVisibilityStatus: jest.fn(() => Promise.resolve('hidden')),
}));

// Device info
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => 'test-device-id'),
  getDeviceName: jest.fn(() => Promise.resolve('Test Device')),
  getSystemName: jest.fn(() => 'iOS'),
  getSystemVersion: jest.fn(() => '18.0'),
  getModel: jest.fn(() => 'iPhone'),
  getVersion: jest.fn(() => '0.0.1'),
  getBuildNumber: jest.fn(() => '1'),

  isTablet: jest.fn(() => false),
  isEmulator: jest.fn(() => Promise.resolve(true)),
  hasNotch: jest.fn(() => false),

  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Orientation locker
jest.mock('react-native-orientation-locker', () => ({
  lockToPortrait: jest.fn(),
  lockToLandscape: jest.fn(),
  lockToLandscapeLeft: jest.fn(),
  lockToLandscapeRight: jest.fn(),
  unlockAllOrientations: jest.fn(),
  getOrientation: jest.fn(cb => cb?.('PORTRAIT')),
  getInitialOrientation: jest.fn(() => 'PORTRAIT'),
  addOrientationListener: jest.fn(),
  removeOrientationListener: jest.fn(),
  addDeviceOrientationListener: jest.fn(),
  removeDeviceOrientationListener: jest.fn(),
}));

// Keychain
jest.mock('react-native-keychain', () => ({
  // Return false = no saved credentials
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),

  // Internet credentials
  getInternetCredentials: jest.fn(() => Promise.resolve(false)),
  setInternetCredentials: jest.fn(() => Promise.resolve(true)),
  resetInternetCredentials: jest.fn(() => Promise.resolve(true)),
}));

/* ============================================================================
 * Auth Providers (Native / ESM)
 * ========================================================================== */

// Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ user: {} })),
    signOut: jest.fn(() => Promise.resolve()),
    revokeAccess: jest.fn(() => Promise.resolve()),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
    getCurrentUser: jest.fn(() => null),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

// Apple Sign-In
jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: {
    performRequest: jest.fn(() =>
      Promise.resolve({
        user: 'test-user',
        email: 'test@example.com',
        fullName: { givenName: 'Test', familyName: 'User' },
        identityToken: 'test-token',
        authorizationCode: 'test-code',
        nonce: 'test-nonce',
        state: 'test-state',
      }),
    ),
    getCredentialStateForUser: jest.fn(() => Promise.resolve('AUTHORIZED')),

    Operation: { LOGIN: 1, REFRESH: 2 },
    Scope: { EMAIL: 0, FULL_NAME: 1 },
    State: {
      AUTHORIZED: 'AUTHORIZED',
      REVOKED: 'REVOKED',
      NOT_FOUND: 'NOT_FOUND',
    },
  },
}));

// LINE Login
jest.mock('@xmartlabs/react-native-line', () => ({
  __esModule: true,
  default: {
    login: jest.fn(() =>
      Promise.resolve({
        accessToken: { accessToken: 'test-access-token' },
        profile: { userID: 'test-user-id', displayName: 'Test User' },
      }),
    ),
    logout: jest.fn(() => Promise.resolve()),
    refreshToken: jest.fn(() =>
      Promise.resolve({ accessToken: 'test-access-token' }),
    ),
    getCurrentAccessToken: jest.fn(() =>
      Promise.resolve({ accessToken: 'test-access-token' }),
    ),
  },
  LoginPermission: {
    PROFILE: 'profile',
    OPEN_ID: 'openid',
    EMAIL: 'email',
  },
}));

// App Auth (OAuth)
jest.mock('react-native-app-auth', () => ({
  authorize: jest.fn(() =>
    Promise.resolve({
      accessToken: 'test-access-token',
      accessTokenExpirationDate: new Date(
        Date.now() + 60 * 60 * 1000,
      ).toISOString(),
      refreshToken: 'test-refresh-token',
      idToken: 'test-id-token',
      tokenType: 'Bearer',
      scopes: [],
    }),
  ),
  refresh: jest.fn(() =>
    Promise.resolve({
      accessToken: 'test-access-token',
      accessTokenExpirationDate: new Date(
        Date.now() + 60 * 60 * 1000,
      ).toISOString(),
      refreshToken: 'test-refresh-token',
      idToken: 'test-id-token',
      tokenType: 'Bearer',
      scopes: [],
    }),
  ),
  revoke: jest.fn(() => Promise.resolve()),
}));

/* ============================================================================
 * UI Components (ESM) - Render as basic RN primitives
 * ========================================================================== */

// LinearGradient -> View
jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockLinearGradient(props) {
    return React.createElement(View, props, props.children);
  };
});

// PDF -> View
jest.mock('react-native-pdf', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockPdf(props) {
    return React.createElement(View, props, props.children);
  };
});

// WebView -> View
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = props => React.createElement(View, props, props.children);

  return {
    __esModule: true,
    WebView,
    default: WebView,
  };
});

// DatePicker -> View
jest.mock('react-native-date-picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const DatePicker = props => React.createElement(View, props, props.children);

  return {
    __esModule: true,
    default: DatePicker,
  };
});

// Markdown -> Text
jest.mock('react-native-markdown-display', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Markdown = props => React.createElement(Text, props, props.children);

  return {
    __esModule: true,
    default: Markdown,
  };
});

// Vector icons -> simple component (avoid .ttf font loading)
jest.mock('@react-native-vector-icons/ionicons', () => {
  const React = require('react');
  return {
    Ionicons: props => React.createElement('Ionicons', props, props.children),
    default: props => React.createElement('Ionicons', props, props.children),
  };
});

/* ============================================================================
 * File / Network Utilities
 * ========================================================================== */

// Blob util
jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: {
      DocumentDir: '/tmp',
      CacheDir: '/tmp',
      DownloadDir: '/tmp',
    },
    exists: jest.fn(() => Promise.resolve(false)),
    mkdir: jest.fn(() => Promise.resolve()),
    unlink: jest.fn(() => Promise.resolve()),
    readFile: jest.fn(() => Promise.resolve('')),
    writeFile: jest.fn(() => Promise.resolve()),
  },
  config: jest.fn(() => ({
    fetch: jest.fn(() =>
      Promise.resolve({
        path: () => '/tmp/mock-file',
        readFile: jest.fn(() => Promise.resolve('')),
        flush: jest.fn(() => Promise.resolve()),
      }),
    ),
  })),
  fetch: jest.fn(() =>
    Promise.resolve({
      path: () => '/tmp/mock-file',
      readFile: jest.fn(() => Promise.resolve('')),
      flush: jest.fn(() => Promise.resolve()),
    }),
  ),
}));
