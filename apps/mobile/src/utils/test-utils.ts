import { User, UserStatus, AuthProvider, AuthToken, UserProfile, PaymentDetails } from '@shared/types';

// Mock data generators for testing
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'mock-user-id',
  mobileNumber: '+1234567890',
  email: 'mock@example.com',
  status: UserStatus.PENDING,
  isMobileVerified: false,
  isEmailVerified: false,
  profile: {
    firstName: 'Mock',
    lastName: 'User',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'MALE',
  },
  paymentDetails: {
    upiId: 'mock.user@upi',
  },
  authProviders: [
    {
      provider: AuthProvider.SMS,
      providerId: 'sms-123',
      linkedAt: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAuthState = (overrides: any = {}) => ({
  user: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
  currentMobileNumber: null,
  ...overrides,
});

export const createMockAuthenticatedState = () => ({
  user: createMockUser({ status: UserStatus.ACTIVE, isMobileVerified: true }),
  tokens: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer' as const,
  },
  isLoading: false,
  isAuthenticated: true,
  currentMobileNumber: '+1234567890',
});

export const createMockLoadingState = () => ({
  user: createMockUser({ status: UserStatus.ACTIVE, isMobileVerified: true }),
  tokens: null,
  isLoading: true,
  isAuthenticated: false,
  currentMobileNumber: null,
});

export const createMockAuthToken = (overrides: Partial<AuthToken> = {}): AuthToken => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  tokenType: 'Bearer',
  ...overrides,
});

export const createMockUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'MALE',
  ...overrides,
});

export const createMockPaymentDetails = (overrides: Partial<PaymentDetails> = {}): PaymentDetails => ({
  upiId: 'john@icici',
  ...overrides,
});

// Mock API responses
export const mockApiResponses = {
  signup: {
    message: 'OTP sent successfully',
    expiresIn: 300,
  },
  verifyOTP: {
    user: createMockUser({ status: UserStatus.ACTIVE, isMobileVerified: true }),
    tokens: createMockAuthToken(),
  },
  login: {
    user: createMockUser({ status: UserStatus.ACTIVE, isMobileVerified: true }),
    tokens: createMockAuthToken(),
  },
  profileUpdate: {
    message: 'Profile updated successfully',
  },
  paymentUpdate: {
    message: 'Payment details updated successfully',
  },
};

// Mock error responses
export const mockErrorResponses = {
  invalidOTP: {
    code: 'INVALID_OTP',
    message: 'Invalid OTP provided',
    userMessage: 'Invalid verification code. Please check and try again.',
  },
  otpExpired: {
    code: 'OTP_EXPIRED',
    message: 'OTP has expired',
    userMessage: 'Verification code has expired. Please request a new one.',
  },
  rateLimited: {
    code: 'RATE_LIMITED',
    message: 'Too many attempts',
    userMessage: 'Too many attempts. Please wait a moment before trying again.',
  },
  networkError: {
    code: 'NETWORK_ERROR',
    message: 'Network connection failed',
    userMessage: 'Network connection issue. Please check your internet connection.',
  },
};

// Test helpers
export const waitForAsync = (ms: number = 100): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const createMockFormData = () => ({
  mobileNumber: '+1234567890',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'MALE',
  upiId: 'john@icici',
});

// Validation test helpers
export const testValidationSchema = (schema: any, validData: any, invalidData: any[]) => {
  describe('Schema Validation', () => {
    it('should validate correct data', () => {
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    invalidData.forEach((data, index) => {
      it(`should reject invalid data ${index + 1}`, () => {
        const result = schema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
};

// Mock navigation
export const mockNavigation = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
};

// Mock router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

// Mock haptics
export const mockHaptics = {
  triggerHaptic: jest.fn(),
};

// Mock storage
export const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockNavigation.push.mockClear();
  mockNavigation.replace.mockClear();
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockHaptics.triggerHaptic.mockClear();
  mockStorage.getItem.mockClear();
  mockStorage.setItem.mockClear();
};
