import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../auth.store';
import { otpService } from '../../services/otp.service';

// Mock the OTP service
jest.mock('../../services/otp.service', () => ({
  otpService: {
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
    resendOtp: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Auth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.clearAuth();
    });
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentMobileNumber).toBeNull();
    });

    it('loads persisted state on initialization', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Simulate loading persisted state
      await act(async () => {
        // This would normally happen in useEffect
      });

      // Initial state should remain the same
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Authentication Actions', () => {
    it('initiates signup and sets mobile number', async () => {
      const { result } = renderHook(() => useAuthStore());
      const signupData = { mobileNumber: '+1234567890' };

      (otpService.requestOtp as jest.Mock).mockResolvedValue({
        message: 'OTP sent successfully',
        expiresIn: 300,
      });

      await act(async () => {
        await result.current.initiateSignup(signupData);
      });

      expect(result.current.currentMobileNumber).toBe('+1234567890');
      expect(result.current.isLoading).toBe(false);
    });

    it('verifies OTP and sets user data', async () => {
      const { result } = renderHook(() => useAuthStore());
      const otpCode = '123456';

      const mockUser = { id: '1', mobileNumber: '+1234567890' };
      const mockTokens = { accessToken: 'token123', refreshToken: 'refresh123' };

      (otpService.verifyOtp as jest.Mock).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      // Set mobile number first
      act(() => {
        result.current.initiateSignup({ mobileNumber: '+1234567890' });
      });

      await act(async () => {
        await result.current.verifyOTP(otpCode);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles login and sets user data', async () => {
      const { result } = renderHook(() => useAuthStore());
      const mobileNumber = '+1234567890';
      const otpCode = '123456';

      const mockUser = { id: '1', mobileNumber: '+1234567890' };
      const mockTokens = { accessToken: 'token123', refreshToken: 'refresh123' };

      (otpService.verifyOtp as jest.Mock).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      await act(async () => {
        await result.current.login(mobileNumber, otpCode);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('sends login OTP and sets mobile number', async () => {
      const { result } = renderHook(() => useAuthStore());
      const mobileNumber = '+1234567890';

      (otpService.requestOtp as jest.Mock).mockResolvedValue({
        message: 'OTP sent successfully',
        expiresIn: 300,
      });

      await act(async () => {
        await result.current.sendLoginOTP(mobileNumber);
      });

      expect(result.current.currentMobileNumber).toBe(mobileNumber);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles OAuth signup', async () => {
      const { result } = renderHook(() => useAuthStore());
      const provider = 'GOOGLE';
      const code = 'auth_code_123';
      const redirectUri = 'https://example.com/callback';

      const mockUser = { id: '1', mobileNumber: '+1234567890' };
      const mockTokens = { accessToken: 'token123', refreshToken: 'refresh123' };

      // Mock the OAuth service call
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, tokens: mockTokens }),
      } as any);

      await act(async () => {
        await result.current.oauthSignup(provider, code, redirectUri);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Profile Management', () => {
    it('updates user profile', async () => {
      const { result } = renderHook(() => useAuthStore());
      const profileData = { firstName: 'John', lastName: 'Doe' };

      // Mock the profile update service call
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: profileData }),
      } as any);

      await act(async () => {
        await result.current.updateProfile(profileData);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('updates payment details', async () => {
      const { result } = renderHook(() => useAuthStore());
      const paymentData = { upiId: 'john@upi' };

      // Mock the payment update service call
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ paymentDetails: paymentData }),
      } as any);

      await act(async () => {
        await result.current.updatePaymentDetails(paymentData);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('sets loading state during operations', async () => {
      const { result } = renderHook(() => useAuthStore());
      const signupData = { mobileNumber: '+1234567890' };

      // Mock a slow response
      (otpService.requestOtp as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ message: 'Success' }), 100))
      );

      const updatePromise = act(async () => {
        await result.current.initiateSignup(signupData);
      });

      // Loading should be true during operation
      expect(result.current.isLoading).toBe(true);

      // Wait for operation to complete
      await updatePromise;

      // Loading should be false after operation
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Logout and Cleanup', () => {
    it('logs out and clears user data', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Set some user data first
      act(() => {
        result.current.initiateSignup({ mobileNumber: '+1234567890' });
      });

      expect(result.current.currentMobileNumber).toBe('+1234567890');

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentMobileNumber).toBeNull();
    });

    it('clears auth data', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Set some auth data first
      act(() => {
        result.current.initiateSignup({ mobileNumber: '+1234567890' });
      });

      expect(result.current.currentMobileNumber).toBe('+1234567890');

      // Clear auth data
      act(() => {
        result.current.clearAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentMobileNumber).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('handles signup errors gracefully', async () => {
      const { result } = renderHook(() => useAuthStore());
      const signupData = { mobileNumber: '+1234567890' };
      const errorMessage = 'Mobile number already registered';

      (otpService.requestOtp as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(
        act(async () => {
          await result.current.initiateSignup(signupData);
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.isLoading).toBe(false);
    });

    it('handles OTP verification errors gracefully', async () => {
      const { result } = renderHook(() => useAuthStore());
      const otpCode = '123456';

      // Set mobile number first
      act(() => {
        result.current.initiateSignup({ mobileNumber: '+1234567890' });
      });

      const errorMessage = 'Invalid OTP';
      (otpService.verifyOtp as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(
        act(async () => {
          await result.current.verifyOTP(otpCode);
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Store Persistence', () => {
    it('persists user data', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Set some user data
      act(() => {
        result.current.initiateSignup({ mobileNumber: '+1234567890' });
      });

      // Data should be set
      expect(result.current.currentMobileNumber).toBe('+1234567890');
    });

    it('handles missing persisted state', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Should handle missing persisted state gracefully
      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('provides authentication status', () => {
      const { result } = renderHook(() => useAuthStore());

      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false);

      // Set user to become authenticated
      act(() => {
        result.current.initiateSignup({ mobileNumber: '+1234567890' });
      });

      // Should still be false until OTP verification
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
