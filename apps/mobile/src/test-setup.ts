import 'react-native-gesture-handler/jestSetup';

// Mock expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => '/',
  useRootNavigationState: () => ({}),
  useRootNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(),
  randomUUID: jest.fn(() => 'mock-uuid-123'),
}));

jest.mock('expo-auth-session', () => ({
  useAuthRequest: () => [jest.fn(), {}, {}],
  makeRedirectUri: jest.fn(() => 'clubcorra://auth/callback'),
  ResponseType: {
    Code: 'code',
    Token: 'token',
  },
  AuthRequest: jest.fn().mockImplementation(() => ({
    promptAsync: jest.fn().mockResolvedValue({
      type: 'success',
      params: { code: 'mock-auth-code' },
    }),
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);



// Mock React Native modules more comprehensively
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj: any) => obj.ios || obj.default),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
    StatusBar: {
      setBarStyle: jest.fn(),
    },
    Keyboard: {
      dismiss: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    Animated: {
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(() => ({ remove: jest.fn() })),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
    },
    Easing: {
      ease: jest.fn(),
    },
    // Add more React Native modules that might be imported
    NativeModules: {
      ...RN.NativeModules,
    },
    NativeEventEmitter: jest.fn(),
    DeviceEventEmitter: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    AppState: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});



// Global test utilities
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'default',
    url: 'http://localhost:3000',
    clone: function() { return this; },
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(''),
  } as Response)
);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock environment variables for tests
process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI = 'clubcorra://auth/callback';

// Suppress console warnings during tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('react-test-renderer is deprecated') ||
     args[0].includes('You called act(async () => ...) without await'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
