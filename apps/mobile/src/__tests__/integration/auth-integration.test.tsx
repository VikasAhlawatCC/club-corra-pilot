import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { otpService } from '@/services/otp.service';
// AuthProvider removed - using Zustand store directly
import { ThemeProvider } from '@/providers/ThemeProvider';
import { RealTimeProvider } from '@/providers/RealTimeProvider';

// Mock the services
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
      {children}
    </RealTimeProvider>
  </ThemeProvider>
);

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear auth store state
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
  });

  describe('Complete Registration Flow Integration', () => {
    it('should complete full registration flow successfully', async () => {
      // Mock successful API responses
      mockAuthService.initiateSignup.mockResolvedValue({
        message: 'User created successfully. Please verify your mobile number.',
        userId: 'user-123',
        requiresOtpVerification: true,
        otpType: 'mobile',
      });

      mockAuthService.verifyOTP.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: false,
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

      // Test the complete flow
      const { initiateSignup, verifyOTP, verifyEmail, setupPassword } = useAuthStore.getState();

      // Step 1: Initiate signup
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
      expect(mockAuthService.initiateSignup).toHaveBeenCalledWith({
        mobileNumber: '9876543210',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        authMethod: 'SMS',
      });

      // Step 2: Verify OTP
      const otpResult = await verifyOTP('123456');
      expect(otpResult.user.isMobileVerified).toBe(true);
      expect(mockAuthService.verifyOTP).toHaveBeenCalledWith('9876543210', '123456');

      // Step 3: Verify email
      const emailResult = await verifyEmail('mock-email-token');
      expect(emailResult.user.isEmailVerified).toBe(true);
      expect(emailResult.requiresPasswordSetup).toBe(true);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('mock-email-token');

      // Step 4: Setup password
      const passwordResult = await setupPassword('user-123', {
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      });
      expect(passwordResult.success).toBe(true);
      expect(mockAuthService.setupPassword).toHaveBeenCalledWith('user-123', {
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      });

      // Verify final state
      const { user, isAuthenticated, registrationState } = useAuthStore.getState();
      expect(user).toBeDefined();
      expect(user?.isMobileVerified).toBe(true);
      expect(user?.isEmailVerified).toBe(true);
      expect(isAuthenticated).toBe(true);
      expect(registrationState.step).toBe('COMPLETE');
    });

    it('should handle OTP verification failures gracefully', async () => {
      // Mock OTP verification failure
      mockAuthService.verifyOTP.mockRejectedValue(new Error('Invalid OTP'));

      const { verifyOTP } = useAuthStore.getState();

      // Try to verify with invalid OTP
      await expect(verifyOTP('000000')).rejects.toThrow('Invalid OTP');

      // Verify OTP verification state is updated
      const { otpVerificationState } = useAuthStore.getState();
      expect(otpVerificationState.attemptsRemaining).toBe(2);
      expect(otpVerificationState.isVerifying).toBe(false);
    });

    it('should handle email verification failures gracefully', async () => {
      // Mock successful OTP verification first
      mockAuthService.verifyOTP.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
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

      // Mock email verification failure
      mockAuthService.verifyEmail.mockRejectedValue(new Error('Invalid token'));

      const { verifyOTP, verifyEmail } = useAuthStore.getState();

      // Complete OTP verification first
      await verifyOTP('123456');

      // Try to verify email with invalid token
      await expect(verifyEmail('invalid-token')).rejects.toThrow('Invalid token');
    });

    it('should handle password setup validation errors', async () => {
      // Mock successful verification steps first
      mockAuthService.verifyOTP.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
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

      mockAuthService.verifyEmail.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: true,
        },
        message: 'Email verified successfully',
        requiresPasswordSetup: true,
      });

      // Mock password setup failure
      mockAuthService.setupPassword.mockRejectedValue(new Error('Password does not meet strength requirements'));

      const { verifyOTP, verifyEmail, setupPassword } = useAuthStore.getState();

      // Complete verification steps
      await verifyOTP('123456');
      await verifyEmail('mock-email-token');

      // Try to setup weak password
      await expect(setupPassword('user-123', {
        password: 'weak',
        confirmPassword: 'weak',
      })).rejects.toThrow('Password does not meet strength requirements');
    });
  });

  describe('Login Flow Integration', () => {
    it('should handle mobile OTP login successfully', async () => {
      // Mock successful OTP request
      mockOtpService.resendOtp.mockResolvedValue({
        message: 'OTP sent successfully',
        expiresIn: 300,
      });

      // Mock successful login
      mockAuthService.login.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: true,
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });

      const { sendLoginOTP, login } = useAuthStore.getState();

      // Step 1: Request login OTP
      const otpResult = await sendLoginOTP('9876543210');
      expect(otpResult.message).toContain('OTP sent successfully');
      expect(mockOtpService.resendOtp).toHaveBeenCalledWith('9876543210');

      // Step 2: Login with OTP
      const loginResult = await login('9876543210', '123456');
      expect(loginResult.user.mobileNumber).toBe('9876543210');
      expect(loginResult.user.isMobileVerified).toBe(true);
      expect(mockAuthService.login).toHaveBeenCalledWith('9876543210', '123456');

      // Verify final state
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeDefined();
      expect(isAuthenticated).toBe(true);
    });

    it('should handle email password login successfully', async () => {
      // Mock successful email login
      mockAuthService.loginWithEmail.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: true,
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });

      const { loginWithEmail } = useAuthStore.getState();

      // Login with email and password
      const loginResult = await loginWithEmail('test@example.com', 'SecurePass123');
      expect(loginResult.user.email).toBe('test@example.com');
      expect(loginResult.user.isEmailVerified).toBe(true);
      expect(mockAuthService.loginWithEmail).toHaveBeenCalledWith('test@example.com', 'SecurePass123');

      // Verify final state
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeDefined();
      expect(isAuthenticated).toBe(true);
    });

    it('should handle login failures gracefully', async () => {
      // Mock login failure
      mockAuthService.login.mockRejectedValue(new Error('Invalid OTP'));

      const { login } = useAuthStore.getState();

      // Try to login with invalid OTP
      await expect(login('9876543210', '000000')).rejects.toThrow('Invalid OTP');

      // Verify state remains unauthenticated
      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('OAuth Integration', () => {
    it('should handle Google OAuth signup successfully', async () => {
      // Mock successful OAuth signup
      mockAuthService.oauthSignup.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: true,
          authProviders: ['GOOGLE'],
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });

      const { oauthSignup } = useAuthStore.getState();

      // Complete OAuth signup
      const oauthResult = await oauthSignup('GOOGLE', 'mock-auth-code', 'clubcorra://auth/callback');
      expect(oauthResult.user.authProviders).toContain('GOOGLE');
      expect(oauthResult.user.isEmailVerified).toBe(true);
      expect(mockAuthService.oauthSignup).toHaveBeenCalledWith('GOOGLE', 'mock-auth-code', 'clubcorra://auth/callback');

      // Verify final state
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeDefined();
      expect(isAuthenticated).toBe(true);
    });

    it('should handle OAuth login successfully', async () => {
      // Mock successful OAuth login
      mockAuthService.loginWithOAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: true,
          authProviders: ['GOOGLE'],
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });

      const { loginWithOAuth } = useAuthStore.getState();

      // Login with OAuth
      const loginResult = await loginWithOAuth('GOOGLE', 'mock-auth-code');
      expect(loginResult.user.authProviders).toContain('GOOGLE');
      expect(mockAuthService.loginWithOAuth).toHaveBeenCalledWith('GOOGLE', 'mock-auth-code');

      // Verify final state
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeDefined();
      expect(isAuthenticated).toBe(true);
    });

    it('should handle OAuth failures gracefully', async () => {
      // Mock OAuth failure
      mockAuthService.oauthSignup.mockRejectedValue(new Error('OAuth authentication failed'));

      const { oauthSignup } = useAuthStore.getState();

      // Try to signup with OAuth
      await expect(oauthSignup('GOOGLE', 'invalid-code', 'clubcorra://auth/callback'))
        .rejects.toThrow('OAuth authentication failed');

      // Verify state remains unauthenticated
      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Token Management Integration', () => {
    it('should handle token refresh successfully', async () => {
      // Mock successful token refresh
      mockAuthService.refreshToken.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: true,
        },
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });

      const { refreshTokens } = useAuthStore.getState();

      // Refresh tokens
      const refreshResult = await refreshTokens();
      expect(refreshResult).toBe(true);
      expect(mockAuthService.refreshToken).toHaveBeenCalled();

      // Verify tokens are updated
      const { tokens } = useAuthStore.getState();
      expect(tokens?.accessToken).toBe('new-access-token');
    });

    it('should handle token refresh failures gracefully', async () => {
      // Mock token refresh failure
      mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      const { refreshTokens } = useAuthStore.getState();

      // Try to refresh tokens
      const refreshResult = await refreshTokens();
      expect(refreshResult).toBe(false);

      // Verify state is cleared on failure
      const { isAuthenticated, tokens } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
      expect(tokens).toBeNull();
    });

    it('should handle logout successfully', async () => {
      // Mock successful logout
      mockAuthService.logout.mockResolvedValue(undefined);

      const { logout } = useAuthStore.getState();

      // Logout
      await logout();

      // Verify state is cleared
      const { user, tokens, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(tokens).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Session Management Integration', () => {
    it('should initialize authentication state on app start', async () => {
      // Mock stored tokens
      mockAuthService.getStoredTokens.mockResolvedValue({
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      // Mock successful token refresh
      mockAuthService.refreshToken.mockResolvedValue({
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
          isMobileVerified: true,
          isEmailVerified: true,
        },
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });

      const { initializeAuth } = useAuthStore.getState();

      // Initialize auth
      await initializeAuth();

      // Verify state is restored
      const { user, tokens, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeDefined();
      expect(tokens).toBeDefined();
      expect(isAuthenticated).toBe(true);
    });

    it('should handle expired tokens on initialization', async () => {
      // Mock expired stored tokens
      mockAuthService.getStoredTokens.mockResolvedValue({
        accessToken: 'expired-access-token',
        refreshToken: 'expired-refresh-token',
        expiresIn: 0, // Expired
        tokenType: 'Bearer',
      });

      const { initializeAuth } = useAuthStore.getState();

      // Initialize auth
      await initializeAuth();

      // Verify state is cleared for expired tokens
      const { user, tokens, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(tokens).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it('should track user activity for session management', async () => {
      const { trackActivity, isSessionValid } = useAuthStore.getState();

      // Track activity
      trackActivity();

      // Verify session is valid
      const sessionValid = isSessionValid();
      expect(sessionValid).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockAuthService.initiateSignup.mockRejectedValue(new Error('Network error'));

      const { initiateSignup } = useAuthStore.getState();

      // Try to initiate signup
      await expect(initiateSignup({
        mobileNumber: '9876543210',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        authMethod: 'SMS',
      })).rejects.toThrow('Network error');

      // Verify loading state is reset
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should handle validation errors gracefully', async () => {
      // Mock validation error
      mockAuthService.setupPassword.mockRejectedValue(new Error('Password does not meet strength requirements'));

      const { setupPassword } = useAuthStore.getState();

      // Try to setup weak password
      await expect(setupPassword('user-123', {
        password: 'weak',
        confirmPassword: 'weak',
      })).rejects.toThrow('Password does not meet strength requirements');

      // Verify loading state is reset
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should handle rate limiting errors gracefully', async () => {
      // Mock rate limiting error
      mockOtpService.resendOtp.mockRejectedValue(new Error('Too many requests'));

      const { sendLoginOTP } = useAuthStore.getState();

      // Try to resend OTP
      await expect(sendLoginOTP('9876543210')).rejects.toThrow('Too many requests');

      // Verify loading state is reset
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
    });
  });

  describe('Profile and Payment Details Integration', () => {
    it('should update user profile successfully', async () => {
      // Mock successful profile update
      mockAuthService.updateProfile.mockResolvedValue({
        profile: {
          firstName: 'Updated',
          lastName: 'Name',
          dateOfBirth: '1990-01-01',
          gender: 'MALE',
        },
      });

      const { updateProfile } = useAuthStore.getState();

      // Update profile
      const profileResult = await updateProfile({
        firstName: 'Updated',
        lastName: 'Name',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
      });

      expect(profileResult.profile.firstName).toBe('Updated');
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith({
        firstName: 'Updated',
        lastName: 'Name',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
      });
    });

    it('should update payment details successfully', async () => {
      // Mock successful payment details update
      mockAuthService.updatePaymentDetails.mockResolvedValue({
        paymentDetails: {
          upiId: 'updated@upi',
          bankName: 'Test Bank',
          accountNumber: '1234567890',
        },
      });

      const { updatePaymentDetails } = useAuthStore.getState();

      // Update payment details
      const paymentResult = await updatePaymentDetails({
        upiId: 'updated@upi',
        bankName: 'Test Bank',
        accountNumber: '1234567890',
      });

      expect(paymentResult.paymentDetails.upiId).toBe('updated@upi');
      expect(mockAuthService.updatePaymentDetails).toHaveBeenCalledWith({
        upiId: 'updated@upi',
        bankName: 'Test Bank',
        accountNumber: '1234567890',
      });
    });
  });

  describe('Welcome Bonus Integration', () => {
    it('should process welcome bonus on account completion', async () => {
      const { processWelcomeBonus } = useAuthStore.getState();

      // Set up authenticated user
      const { clearAuth } = useAuthStore.getState();
      clearAuth();

      // Mock user state
      const mockUser = {
        id: 'user-123',
        mobileNumber: '9876543210',
        email: 'test@example.com',
        isMobileVerified: true,
        isEmailVerified: true,
        hasWelcomeBonusProcessed: false,
      };

      // Set user state
      const { updateRegistrationState } = useAuthStore.getState();
      updateRegistrationState({
        step: 'COMPLETE',
        mobileVerified: true,
        emailVerified: true,
        profileComplete: true,
        passwordSet: true,
      });

      // Process welcome bonus
      const bonusResult = await processWelcomeBonus();
      expect(bonusResult.success).toBe(true);
      expect(bonusResult.message).toContain('Welcome bonus processed successfully');
    });

    it('should show welcome bonus notification for new users', async () => {
      const { showWelcomeBonusNotification } = useAuthStore.getState();

      // Set up authenticated user without welcome bonus
      const { clearAuth } = useAuthStore.getState();
      clearAuth();

      // Mock user state
      const mockUser = {
        id: 'user-123',
        mobileNumber: '9876543210',
        email: 'test@example.com',
        isMobileVerified: true,
        isEmailVerified: true,
        hasWelcomeBonusProcessed: false,
      };

      // Show welcome bonus notification
      const notification = await showWelcomeBonusNotification();
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('WELCOME_BONUS');
      expect(notification?.coins).toBe(100);
    });
  });
});
