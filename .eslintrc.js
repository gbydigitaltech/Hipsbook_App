module.exports = {
  root: true,
  extends: '@react-native',

  overrides: [
    {
      files: [
        '**/__tests__/**/*.{js,jsx,ts,tsx}',
        '**/*.{test,spec}.{js,jsx,ts,tsx}',
        'jest.setup.{js,ts}',
      ],
      env: { jest: true },
    },
  ],
};
