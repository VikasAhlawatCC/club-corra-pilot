import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { JwtService } from '../jwt.service';
import { OtpService } from '../../common/services/otp.service';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';
import { RateLimitService } from '../../common/services/rate-limit.service';
import { LoginDto, SignupDto, OtpDto } from '../dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let jwtService: JwtService;
  let otpService: OtpService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    verifyOtp: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockJwtService = {
    generateToken: jest.fn(),
    verifyToken: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockOtpService = {
    generateOtp: jest.fn(),
    verifyOtp: jest.fn(),
    sendOtpViaSms: jest.fn(),
    sendOtpViaEmail: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockSmsService = {
    sendSms: jest.fn(),
  };

  const mockRateLimitService = {
    checkRateLimit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: RateLimitService, useValue: mockRateLimitService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    otpService = module.get<OtpService>(OtpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user account', async () => {
      const signupDto: SignupDto = {
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        upiId: 'john.doe@upi',
      };

      const expectedResponse: AuthResponseDto = {
        success: true,
        message: 'User registered successfully. Please verify your OTP.',
        data: {
          userId: '123',
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          requiresOtpVerification: true,
        },
      };

      mockAuthService.signup.mockResolvedValue(expectedResponse);

      const result = await controller.signup(signupDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.signup).toHaveBeenCalledWith(signupDto);
    });

    it('should handle signup validation errors', async () => {
      const invalidSignupDto = {
        mobileNumber: 'invalid',
        email: 'invalid-email',
      };

      mockAuthService.signup.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.signup(invalidSignupDto as any)).rejects.toThrow('Validation failed');
    });
  });

  describe('login', () => {
    it('should authenticate user with mobile number and OTP', async () => {
      const loginDto: LoginDto = {
        mobileNumber: '+919876543210',
        otp: '123456',
      };

      const expectedResponse: AuthResponseDto = {
        success: true,
        message: 'Login successful',
        data: {
          userId: '123',
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          accessToken: 'jwt-token',
          refreshToken: 'refresh-token',
          requiresOtpVerification: false,
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle login with invalid credentials', async () => {
      const loginDto: LoginDto = {
        mobileNumber: '+919876543210',
        otp: '000000',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid OTP'));

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid OTP');
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP for mobile number', async () => {
      const otpDto: OtpDto = {
        mobileNumber: '+919876543210',
        otp: '123456',
        type: 'SMS',
      };

      const expectedResponse: AuthResponseDto = {
        success: true,
        message: 'OTP verified successfully',
        data: {
          userId: '123',
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          accessToken: 'jwt-token',
          refreshToken: 'refresh-token',
          requiresOtpVerification: false,
        },
      };

      mockAuthService.verifyOtp.mockResolvedValue(expectedResponse);

      const result = await controller.verifyOtp(otpDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.verifyOtp).toHaveBeenCalledWith(otpDto);
    });

    it('should verify OTP for email', async () => {
      const otpDto: OtpDto = {
        email: 'test@example.com',
        otp: '123456',
        type: 'EMAIL',
      };

      const expectedResponse: AuthResponseDto = {
        success: true,
        message: 'OTP verified successfully',
        data: {
          userId: '123',
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          accessToken: 'jwt-token',
          refreshToken: 'refresh-token',
          requiresOtpVerification: false,
        },
      };

      mockAuthService.verifyOtp.mockResolvedValue(expectedResponse);

      const result = await controller.verifyOtp(otpDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.verifyOtp).toHaveBeenCalledWith(otpDto);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const refreshToken = 'refresh-token';
      const expectedResponse: AuthResponseDto = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'new-jwt-token',
          refreshToken: 'new-refresh-token',
        },
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await controller.refreshToken(refreshToken);

      expect(result).toEqual(expectedResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = '123';
      const expectedResponse: AuthResponseDto = {
        success: true,
        message: 'Logout successful',
        data: null,
      };

      mockAuthService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(userId);

      expect(result).toEqual(expectedResponse);
      expect(authService.logout).toHaveBeenCalledWith(userId);
    });
  });
});
