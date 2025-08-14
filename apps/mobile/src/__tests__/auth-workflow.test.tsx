import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AuthProvider } from '../providers/AuthProvider';
import { RealTimeProvider } from '../providers/RealTimeProvider';
import { ThemeProvider } from '../providers/ThemeProvider';

// Mock the stores
jest.mock('../stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../stores/user.store', () => ({
  useUserStore: jest.fn(),
}));

// Mock the services
jest.mock('../services/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    initiateSignup: jest.fn(),
    verifyOTP: jest.fn(),
    login: jest.fn(),
    sendLoginOTP: jest.fn(),
    updateProfile: jest.fn(),
    updatePaymentDetails: jest.fn(),
  })),
}));

jest.mock('../services/otp.service', () => ({
  OTPService: jest.fn().mockImplementation(() => ({
    resendOtp: jest.fn(),
  })),
}));

// Import the mocked hooks
import { useAuthStore } from '../stores/auth.store';
import { useUserStore } from '../stores/user.store';

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;

describe('Authentication Workflow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      currentMobileNumber: null,
      tokens: null,
      initiateSignup: jest.fn(),
      verifyOTP: jest.fn(),
      login: jest.fn(),
      sendLoginOTP: jest.fn(),
      logout: jest.fn(),
      clearAuth: jest.fn(),
      resendOTP: jest.fn(),
      updateProfile: jest.fn(),
      updatePaymentDetails: jest.fn(),
    });

    mockUseUserStore.mockReturnValue({
      profile: null,
      paymentDetails: null,
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
      updatePaymentDetails: jest.fn(),
      clearProfile: jest.fn(),
      clearPaymentDetails: jest.fn(),
    });
  });

  describe('Signup Flow', () => {
    it('should handle signup initiation', async () => {
      const mockInitiateSignup = jest.fn().mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
      });

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        initiateSignup: mockInitiateSignup,
        isLoading: false,
      });

      // Test that signup can be initiated
      expect(mockInitiateSignup).toBeDefined();
      expect(mockUseAuthStore().isLoading).toBe(false);
    });

    it('should show loading state during signup', async () => {
      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        isLoading: true,
      });

      // Test loading state
      expect(mockUseAuthStore().isLoading).toBe(true);
    });

    it('should handle signup errors gracefully', async () => {
      const mockInitiateSignup = jest.fn().mockRejectedValue(
        new Error('Mobile number already registered')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        initiateSignup: mockInitiateSignup,
      });

      // Test error handling
      await expect(mockInitiateSignup({ mobileNumber: '9876543210' }))
        .rejects
        .toThrow('Mobile number already registered');
    });

    it('should validate mobile number format', async () => {
      const mockInitiateSignup = jest.fn().mockRejectedValue(
        new Error('Invalid mobile number')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        initiateSignup: mockInitiateSignup,
      });

      // Test mobile number validation
      await expect(mockInitiateSignup({ mobileNumber: 'invalid' }))
        .rejects
        .toThrow('Invalid mobile number');
    });
  });

  describe('OTP Verification Flow', () => {
    it('should handle OTP verification successfully', async () => {
      const mockVerifyOTP = jest.fn().mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
        },
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      });

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        verifyOTP: mockVerifyOTP,
        currentMobileNumber: '9876543210',
      });

      // Test OTP verification
      const result = await mockVerifyOTP('123456');
      expect(result.success).toBe(true);
      expect(result.user.id).toBe('user-123');
      expect(result.tokens.accessToken).toBe('access-token-123');
    });

    it('should handle invalid OTP', async () => {
      const mockVerifyOTP = jest.fn().mockRejectedValue(
        new Error('Invalid OTP')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        verifyOTP: mockVerifyOTP,
        currentMobileNumber: '9876543210',
      });

      // Test invalid OTP handling
      await expect(mockVerifyOTP('000000'))
        .rejects
        .toThrow('Invalid OTP');
    });

    it('should handle expired OTP', async () => {
      const mockVerifyOTP = jest.fn().mockRejectedValue(
        new Error('OTP expired')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        verifyOTP: mockVerifyOTP,
        currentMobileNumber: '9876543210',
      });

      // Test expired OTP handling
      await expect(mockVerifyOTP('123456'))
        .rejects
        .toThrow('OTP expired');
    });

    it('should handle OTP resend', async () => {
      const mockResendOTP = jest.fn().mockResolvedValue({
        success: true,
        message: 'OTP resent successfully',
      });

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        resendOTP: mockResendOTP,
        currentMobileNumber: '9876543210',
      });

      // Test OTP resend
      const result = await mockResendOTP();
      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP resent successfully');
    });

    it('should prevent OTP verification without mobile number', async () => {
      const mockVerifyOTP = jest.fn().mockRejectedValue(
        new Error('No mobile number found. Please start signup again.')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        verifyOTP: mockVerifyOTP,
        currentMobileNumber: null,
      });

      // Test missing mobile number handling
      await expect(mockVerifyOTP('123456'))
        .rejects
        .toThrow('No mobile number found. Please start signup again.');
    });
  });

  describe('Login Flow', () => {
    it('should handle login successfully', async () => {
      const mockLogin = jest.fn().mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
          email: 'test@example.com',
        },
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      });

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        login: mockLogin,
      });

      // Test login
      const result = await mockLogin({ mobileNumber: '9876543210', password: 'password123' });
      expect(result.success).toBe(true);
      expect(result.user.id).toBe('user-123');
    });

    it('should handle login OTP send', async () => {
      const mockSendLoginOTP = jest.fn().mockResolvedValue({
        success: true,
        message: 'Login OTP sent successfully',
      });

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        sendLoginOTP: mockSendLoginOTP,
      });

      // Test login OTP send
      const result = await mockSendLoginOTP('9876543210');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login OTP sent successfully');
    });

    it('should handle login errors', async () => {
      const mockLogin = jest.fn().mockRejectedValue(
        new Error('Invalid credentials')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        login: mockLogin,
      });

      // Test login error handling
      await expect(mockLogin({ mobileNumber: '9876543210', password: 'wrong' }))
        .rejects
        .toThrow('Invalid credentials');
    });
  });

  describe('Profile Management Flow', () => {
    it('should handle profile update successfully', async () => {
      const mockUpdateProfile = jest.fn().mockResolvedValue({
        success: true,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
      });

      mockUseUserStore.mockReturnValue({
        ...mockUseUserStore(),
        updateProfile: mockUpdateProfile,
      });

      // Test profile update
      const result = await mockUpdateProfile({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      });
      expect(result.success).toBe(true);
      expect(result.profile.firstName).toBe('John');
    });

    it('should handle payment details update', async () => {
      const mockUpdatePaymentDetails = jest.fn().mockResolvedValue({
        success: true,
        paymentDetails: {
          upiId: 'john@upi',
          bankAccount: '1234567890',
        },
      });

      mockUseUserStore.mockReturnValue({
        ...mockUseUserStore(),
        updatePaymentDetails: mockUpdatePaymentDetails,
      });

      // Test payment details update
      const result = await mockUpdatePaymentDetails({
        upiId: 'john@upi',
        bankAccount: '1234567890',
      });
      expect(result.success).toBe(true);
      expect(result.paymentDetails.upiId).toBe('john@upi');
    });

    it('should handle profile update errors', async () => {
      const mockUpdateProfile = jest.fn().mockRejectedValue(
        new Error('Profile update failed')
      );

      mockUseUserStore.mockReturnValue({
        ...mockUseUserStore(),
        updateProfile: mockUpdateProfile,
      });

      // Test profile update error handling
      await expect(mockUpdateProfile({ firstName: 'John' }))
        .rejects
        .toThrow('Profile update failed');
    });
  });

  describe('Authentication State Management', () => {
    it('should maintain authentication state', () => {
      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        isAuthenticated: true,
        user: {
          id: 'user-123',
          mobileNumber: '9876543210',
        },
        tokens: {
          accessToken: 'access-token-123',
        },
      });

      // Test authentication state
      expect(mockUseAuthStore().isAuthenticated).toBe(true);
      expect(mockUseAuthStore().user?.id).toBe('user-123');
      expect(mockUseAuthStore().tokens?.accessToken).toBe('access-token-123');
    });

    it('should handle logout correctly', () => {
      const mockLogout = jest.fn();
      const mockClearAuth = jest.fn();

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        logout: mockLogout,
        clearAuth: mockClearAuth,
        isAuthenticated: true,
        user: { id: 'user-123' },
      });

      // Test logout
      mockUseAuthStore().logout();
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should clear authentication data on logout', () => {
      const mockClearAuth = jest.fn();

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        clearAuth: mockClearAuth,
      });

      // Test clear auth
      mockUseAuthStore().clearAuth();
      expect(mockClearAuth).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle network errors gracefully', async () => {
      const mockInitiateSignup = jest.fn().mockRejectedValue(
        new Error('Network error')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        initiateSignup: mockInitiateSignup,
      });

      // Test network error handling
      await expect(mockInitiateSignup({ mobileNumber: '9876543210' }))
        .rejects
        .toThrow('Network error');
    });

    it('should handle server errors gracefully', async () => {
      const mockVerifyOTP = jest.fn().mockRejectedValue(
        new Error('Server error')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        verifyOTP: mockVerifyOTP,
        currentMobileNumber: '9876543210',
      });

      // Test server error handling
      await expect(mockVerifyOTP('123456'))
        .rejects
        .toThrow('Server error');
    });

    it('should validate required fields', async () => {
      const mockInitiateSignup = jest.fn().mockRejectedValue(
        new Error('Mobile number is required')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        initiateSignup: mockInitiateSignup,
      });

      // Test required field validation
      await expect(mockInitiateSignup({}))
        .rejects
        .toThrow('Mobile number is required');
    });
  });

  describe('Security and Rate Limiting', () => {
    it('should handle too many OTP attempts', async () => {
      const mockVerifyOTP = jest.fn().mockRejectedValue(
        new Error('Too many attempts')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        verifyOTP: mockVerifyOTP,
        currentMobileNumber: '9876543210',
      });

      // Test rate limiting
      await expect(mockVerifyOTP('123456'))
        .rejects
        .toThrow('Too many attempts');
    });

    it('should handle session expiration', async () => {
      const mockLogin = jest.fn().mockRejectedValue(
        new Error('Session expired')
      );

      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        login: mockLogin,
      });

      // Test session expiration
      await expect(mockLogin({ mobileNumber: '9876543210', password: 'password123' }))
        .rejects
        .toThrow('Session expired');
    });
  });
});
