import { authService } from '../auth.service';
import { adaptApiAuthResponse } from '@shared/utils/type-adapter';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the type adapter
jest.mock('@shared/utils/type-adapter', () => ({
  adaptApiAuthResponse: jest.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (adaptApiAuthResponse as jest.Mock).mockClear();
  });

  describe('initiateSignup', () => {
    it('initiates signup successfully with mobile number', async () => {
      const mockResponse = {
        message: 'Signup initiated successfully',
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.initiateSignup('+1234567890');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/signup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            mobileNumber: '+1234567890',
            authProvider: 'SMS',
          }),
        })
      );
    });

    it('initiates signup successfully with profile data', async () => {
      const mockResponse = {
        message: 'Signup initiated successfully',
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const signupData = {
        mobileNumber: '+1234567890',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        authMethod: 'SMS',
      };

      const result = await authService.initiateSignup(signupData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/signup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            mobileNumber: '+1234567890',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'MALE',
            authProvider: 'SMS',
          }),
        })
      );
    });
  });

  describe('verifyOTP', () => {
    it('verifies OTP successfully', async () => {
      const mockApiResponse = {
        user: { id: '1', mobileNumber: '+1234567890' },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
      };

      const mockAdaptedResponse = {
        user: { id: '1', mobileNumber: '+1234567890' },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (adaptApiAuthResponse as jest.Mock).mockReturnValue(mockAdaptedResponse);

      const result = await authService.verifyOTP('+1234567890', '123456');

      expect(result).toEqual(mockAdaptedResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/otp/verify',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            mobileNumber: '+1234567890',
            code: '123456',
            type: 'SMS',
          }),
        })
      );
    });
  });

  describe('loginWithMobilePassword', () => {
    it('handles mobile password login successfully', async () => {
      const mockApiResponse = {
        user: { id: '1', mobileNumber: '+1234567890' },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123', expiresIn: 604800 },
      };

      const mockAdaptedResponse = {
        user: { id: '1', mobileNumber: '+1234567890' },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123', expiresIn: 604800 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (adaptApiAuthResponse as jest.Mock).mockReturnValue(mockAdaptedResponse);

      const result = await authService.loginWithMobilePassword('+1234567890', 'password123');

      expect(result).toEqual(mockAdaptedResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://192.168.1.4:3001/api/v1/auth/login/mobile-password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            mobileNumber: '+1234567890',
            password: 'password123',
          }),
        })
      );
    });
  });

  describe('loginWithEmail', () => {
    it('handles email login successfully', async () => {
      const mockApiResponse = {
        user: { id: '1', email: 'test@example.com' },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123', expiresIn: 604800 },
      };

      const mockAdaptedResponse = {
        user: { id: '1', email: 'test@example.com' },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123', expiresIn: 604800 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (adaptApiAuthResponse as jest.Mock).mockReturnValue(mockAdaptedResponse);

      const result = await authService.loginWithEmail('test@example.com', 'password123');

      expect(result).toEqual(mockAdaptedResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://192.168.1.4:3001/api/v1/auth/login/email',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
    });
  });

  describe('sendLoginOTP', () => {
    it('sends login OTP successfully', async () => {
      const mockResponse = {
        message: 'OTP sent successfully',
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.sendLoginOTP('+1234567890');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://192.168.1.4:3001/api/v1/auth/request-otp',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            mobileNumber: '+1234567890',
            type: 'SMS',
          }),
        })
      );
    });
  });

  describe('oauthSignup', () => {
    it('handles OAuth signup successfully', async () => {
      const mockApiResponse = {
        user: { id: '1', mobileNumber: '+1234567890' },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123', expiresIn: 604800 },
      };

      const mockAdaptedResponse = {
        user: { id: '1', mobileNumber: '+1234567890' },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123', expiresIn: 604800 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (adaptApiAuthResponse as jest.Mock).mockReturnValue(mockAdaptedResponse);

      const result = await authService.oauthSignup('GOOGLE', 'auth_code_123', 'https://example.com/callback');

      expect(result).toEqual(mockAdaptedResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://192.168.1.4:3001/api/v1/auth/oauth/signup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            provider: 'GOOGLE',
            code: 'auth_code_123',
            redirectUri: 'https://example.com/callback',
          }),
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('refreshes token successfully', async () => {
      const mockApiResponse = {
        user: { id: '1', mobileNumber: '+1234567890' },
        tokens: { accessToken: 'newToken123', refreshToken: 'newRefresh123', expiresIn: 604800 },
      };

      const mockAdaptedResponse = {
        user: { id: '1', mobileNumber: '+1234567890' },
        tokens: { accessToken: 'newToken123', refreshToken: 'newRefresh123', expiresIn: 604800 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      (adaptApiAuthResponse as jest.Mock).mockReturnValue(mockAdaptedResponse);

      const result = await authService.refreshToken('refresh123');

      expect(result).toEqual(mockAdaptedResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://192.168.1.4:3001/api/v1/auth/refresh-token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer refresh123',
          },
        })
      );
    });
  });

  describe('logout', () => {
    it('logs out successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logged out successfully' }),
      });

      await authService.logout();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/logout',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      const mockResponse = { profile: { firstName: 'John', lastName: 'Doe' } };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const profileData = { firstName: 'John', lastName: 'Doe' };
      const result = await authService.updateProfile(profileData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/users/profile',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(profileData),
        })
      );
    });
  });

  describe('updatePaymentDetails', () => {
    it('updates payment details successfully', async () => {
      const mockResponse = { paymentDetails: { upiId: 'john@upi' } };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const paymentData = { upiId: 'john@upi' };
      const result = await authService.updatePaymentDetails(paymentData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/users/payment-details',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(paymentData),
        })
      );
    });
  });

  describe('checkApiHealth', () => {
    it('checks API health successfully', async () => {
      const mockResponse = {
        status: 'healthy',
        version: '1.0.0',
        platform: 'mobile',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.checkApiHealth();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/health',
        expect.objectContaining({
          headers: {
            'X-Platform': 'mobile',
            'X-Client-Type': 'mobile',
          },
        })
      );
    });

    it('handles API health check failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(authService.checkApiHealth()).rejects.toThrow('API health check failed: 500');
    });
  });
});
