module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: [
    '<rootDir>/src/test-setup.ts'
  ],
  setupFiles: [
    '<rootDir>/src/test-setup.ts'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__mocks__/async-storage.ts',
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
    '^expo-router$': '<rootDir>/src/__mocks__/expo-router.ts',
    '^expo-haptics$': '<rootDir>/src/__mocks__/expo-haptics.ts',
    '^expo-crypto$': '<rootDir>/src/__mocks__/expo-crypto.ts',
    '^expo-auth-session$': '<rootDir>/src/__mocks__/expo-auth-session.ts',
    '^expo-linear-gradient$': '<rootDir>/src/__mocks__/expo-linear-gradient.ts',
    '^@expo/vector-icons$': '<rootDir>/src/__mocks__/@expo/vector-icons.ts'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|@react-native-community|@react-native-async-storage|react-native-confetti-cannon|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-svg|lottie-react-native|nativewind|tailwindcss|zustand|@hookform|react-hook-form|zod|expo-linear-gradient|@expo\/vector-icons)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  setupFiles: [
    '<rootDir>/src/test-setup.ts'
  ],
  // Add these configurations for React Native
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/'
  ],
  // Ensure mocks are hoisted
  injectGlobals: true,
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true
};
