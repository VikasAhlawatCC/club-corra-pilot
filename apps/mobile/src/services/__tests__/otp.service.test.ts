import { otpService } from '../otp.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('OTP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('requestOtp', () => {
    it('sends OTP successfully via SMS', async () => {
      const mockResponse = {
        message: 'OTP sent successfully',
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await otpService.requestOtp('+1234567890', 'SMS');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/otp/send',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            mobileNumber: '+1234567890',
            type: 'SMS',
          }),
        })
      );
    });

    it('sends OTP successfully via EMAIL', async () => {
      const mockResponse = {
        message: 'OTP sent successfully',
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await otpService.requestOtp('test@example.com', 'EMAIL');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/otp/send',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            type: 'EMAIL',
          }),
        })
      );
    });

    it('handles API errors correctly', async () => {
      const errorMessage = 'Rate limit exceeded';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: errorMessage }),
      });

      await expect(otpService.requestOtp('+1234567890', 'SMS')).rejects.toThrow(errorMessage);
    });
  });

  describe('verifyOtp', () => {
    it('verifies OTP successfully', async () => {
      const mockResponse = {
        message: 'OTP verified successfully',
        verified: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await otpService.verifyOtp('+1234567890', '123456', 'SMS');

      expect(result).toEqual(mockResponse);
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

    it('handles verification failure', async () => {
      const mockResponse = {
        message: 'Invalid OTP',
        verified: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await otpService.verifyOtp('+1234567890', '000000', 'SMS');

      expect(result).toEqual(mockResponse);
      expect(result.verified).toBe(false);
    });
  });

  describe('resendOtp', () => {
    it('resends OTP successfully', async () => {
      const mockResponse = {
        message: 'OTP resent successfully',
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await otpService.resendOtp('+1234567890', 'SMS');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/otp/send',
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
});
