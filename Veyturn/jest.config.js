module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-svg|lucide-react-native)/)',
  ],
  moduleNameMapper: {
    '^lucide-react-native$': '<rootDir>/__mocks__/lucide-react-native.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.js',
    '^react-native-image-picker$': '<rootDir>/__mocks__/react-native-image-picker.js',
    '^@react-native-community/geolocation$': '<rootDir>/__mocks__/@react-native-community-geolocation.js',
  },
};
