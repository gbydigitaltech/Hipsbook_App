// jest.config.js
module.exports = {
  preset: 'react-native',

  // Transform selected ESM packages in node_modules (fixes "Unexpected token 'export'")
  transformIgnorePatterns: [
    'node_modules/(?!(react-native' +
      '|@react-native' +
      '|@react-navigation' +
      '|react-navigation' +
      '|react-native-gesture-handler' +
      '|react-native-reanimated' +
      '|react-native-screens' +
      '|react-native-safe-area-context' +
      '|react-native-vector-icons' +
      ')/)',
  ],

  // Setup for common React Native libs that often break in Jest
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Stub static assets to prevent Jest from failing on imports (images/svg/fonts)
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(ttf|otf)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },
};
