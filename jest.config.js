module.exports = {
  preset: 'react-native',
  // svgProcessor + generator tests are plain Node; IconView tests use the RN preset.
  setupFilesAfterEnv: ['@testing-library/react-native/extend-expect'],
  moduleNameMapper: {
    // Mock the generated AppIcon for IconView unit tests.
    '^./types/AppIcon$': '<rootDir>/src/__tests__/__mocks__/AppIcon.tsx',
  },
  testMatch: ['**/__tests__/**/*.test.{js,ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@testing-library)/)',
  ],
}
