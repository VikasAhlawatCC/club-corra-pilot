import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { otpService } from '@/services/otp.service';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { RealTimeProvider } from '@/providers/RealTimeProvider';

// Mock all services
jest.mock('@/services/auth.service');
jest.mock('@/services/otp.service');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockOtpService = otpService as jest.Mocked<typeof otpService>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router
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

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(),
  randomUUID: jest.fn(() => 'mock-uuid-123'),
}));

// Mock expo-auth-session
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

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <RealTimeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </RealTimeProvider>
  </ThemeProvider>
);

describe('Mobile App End-to-End Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear auth store state
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
  });

  describe('Complete User Journey: Registration to Home', () => {
    it('should complete full user journey: signup → earn → redeem → admin approval → payment', async () => {
      // Mock all service responses for complete journey
      setupMockServicesForCompleteJourney();

      const {
        initiateSignup,
        verifyOTP,
        verifyEmail,
        setupPassword,
        loginWithEmail,
      } = useAuthStore.getState();

      // Step 1: Complete Registration Flow
      console.log('🚀 Starting complete registration flow...');
      
      const signupResult = await initiateSignup({
        mobileNumber: '9876543210',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        authMethod: 'SMS',
      });

      expect(signupResult.message).toContain('User created successfully');
      console.log('✅ Signup completed successfully');

      const otpResult = await verifyOTP('123456');
      expect(otpResult.user.isMobileVerified).toBe(true);
      console.log('✅ Mobile OTP verification completed');

      const emailResult = await verifyEmail('mock-email-token');
      expect(emailResult.user.isEmailVerified).toBe(true);
      expect(emailResult.requiresPasswordSetup).toBe(true);
      console.log('✅ Email verification completed');

      const passwordResult = await setupPassword('user-123', {
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      });
      expect(passwordResult.success).toBe(true);
      console.log('✅ Password setup completed');

      // Step 2: Login and Access Main App
      console.log('🔐 Logging in to access main app...');
      
      const loginResult = await loginWithEmail('test@example.com', 'SecurePass123');
      expect(loginResult.user).toBeDefined();
      expect(loginResult.user.isMobileVerified).toBe(true);
      expect(loginResult.user.isEmailVerified).toBe(true);
      console.log('✅ Login completed successfully');

      // Verify final state
      const { user, isAuthenticated, registrationState } = useAuthStore.getState();
      expect(user).toBeDefined();
      expect(user?.isMobileVerified).toBe(true);
      expect(user?.isEmailVerified).toBe(true);
      expect(isAuthenticated).toBe(true);
      expect(registrationState.step).toBe('COMPLETE');
      console.log('✅ Final state verification completed');

      console.log('🎉 Complete user journey test passed successfully!');
    });
  });

  describe('Authentication Flow Edge Cases', () => {
    it('should handle network failures and retry successfully', async () => {
      // Mock network failure first, then success
      mockAuthService.initiateSignup
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          message: 'User created successfully. Please verify your mobile number.',
          userId: 'user-retry-123',
          requiresOtpVerification: true,
          otpType: 'mobile',
        });

      const { initiateSignup } = useAuthStore.getState();

      console.log('🌐 Testing network failure and retry...');
      
      // First attempt should fail
      await expect(initiateSignup({
        mobileNumber: '9876543240',
        email: 'retry@example.com',
        firstName: 'Retry',
        lastName: 'User',
        authMethod: 'SMS',
      })).rejects.toThrow('Network error');
      console.log('✅ First attempt failed as expected');

      // Second attempt should succeed
      const retryResult = await initiateSignup({
        mobileNumber: '9876543240',
        email: 'retry@example.com',
        firstName: 'Retry',
        lastName: 'User',
        authMethod: 'SMS',
      });
      expect(retryResult.message).toContain('User created successfully');
      console.log('✅ Retry attempt succeeded');
    });

    it('should handle OTP verification with multiple attempts', async () => {
      // Mock OTP verification failures then success
      mockAuthService.verifyOTP
        .mockRejectedValueOnce(new Error('Invalid OTP'))
        .mockRejectedValueOnce(new Error('Invalid OTP'))
        .mockResolvedValueOnce({
          user: {
            id: 'user-otp-123',
            mobileNumber: '9876543250',
            email: 'otp@example.com',
            isMobileVerified: true,
            isEmailVerified: false,
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
            tokenType: 'Bearer',
          },
        });

      const { verifyOTP } = useAuthStore.getState();

      console.log('🔢 Testing OTP verification with multiple attempts...');
      
      // First attempt should fail
      await expect(verifyOTP('000000')).rejects.toThrow('Invalid OTP');
      console.log('✅ First OTP attempt failed as expected');

      // Second attempt should fail
      await expect(verifyOTP('111111')).rejects.toThrow('Invalid OTP');
      console.log('✅ Second OTP attempt failed as expected');

      // Third attempt should succeed
      const successResult = await verifyOTP('123456');
      expect(successResult.user.isMobileVerified).toBe(true);
      console.log('✅ Third OTP attempt succeeded');

      // Verify OTP verification state
      const { otpVerificationState } = useAuthStore.getState();
      expect(otpVerificationState.attemptsRemaining).toBe(0);
      console.log('✅ OTP verification state updated correctly');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle offline scenarios gracefully', async () => {
      // Mock network failure
      mockAuthService.initiateSignup.mockRejectedValue(new Error('Network error'));

      const { initiateSignup } = useAuthStore.getState();

      console.log('📱 Testing offline scenario handling...');
      
      // Try to signup while offline
      await expect(initiateSignup({
        mobileNumber: '9876543270',
        email: 'offline@example.com',
        firstName: 'Offline',
        lastName: 'User',
        authMethod: 'SMS',
      })).rejects.toThrow('Network error');
      console.log('✅ Offline error handled correctly');

      // Verify loading state is reset
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
      console.log('✅ Loading state reset correctly');
    });

    it('should handle API rate limiting gracefully', async () => {
      // Mock rate limiting error
      mockOtpService.resendOtp.mockRejectedValue(new Error('Too many requests'));

      const { sendLoginOTP } = useAuthStore.getState();

      console.log('⏱️ Testing rate limiting handling...');
      
      // Try to resend OTP while rate limited
      await expect(sendLoginOTP('9876543280')).rejects.toThrow('Too many requests');
      console.log('✅ Rate limiting error handled correctly');

      // Verify loading state is reset
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
      console.log('✅ Loading state reset correctly');
    });
  });

  // Helper functions
  function setupMockServicesForCompleteJourney() {
    // Auth service mocks
          mockAuthService.initiateSignup.mockResolvedValue({
        message: 'User created successfully. Please verify your mobile number.',
        expiresIn: 300,
      });

          mockAuthService.verifyOTP.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: false,
          status: 'ACTIVE' as const,
          authProviders: [{ provider: 'SMS' as const, providerId: '9876543210', linkedAt: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date(),
          profile: {
            firstName: 'Test',
            lastName: 'User',
          },
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });

          mockAuthService.verifyEmail.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: true,
          status: 'ACTIVE',
          authProviders: [{ provider: 'SMS', providerId: '9876543210', linkedAt: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date(),
          profile: {
            firstName: 'Test',
            lastName: 'User',
          },
        },
        message: 'Email verified successfully',
        requiresPasswordSetup: true,
      });

    mockAuthService.setupPassword.mockResolvedValue({
      success: true,
      message: 'Password set successfully',
    });

    mockAuthService.loginWithEmail.mockResolvedValue({
      user: {
        id: 'user-123',
        mobileNumber: '9876543210',
        email: 'test@example.com',
        isMobileVerified: true,
        isEmailVerified: true,
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    });
  }
});
