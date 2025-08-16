import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { JwtTokenService } from '../jwt.service';
import { OtpService } from '../../common/services/otp.service';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';
import { RateLimitService } from '../../common/services/rate-limit.service';
import { 
  MobilePasswordLoginDto, 
  EmailLoginDto, 
  OAuthLoginDto,
  RefreshTokenDto 
} from '../dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import { PasswordSetupDto } from '../dto/password-setup.dto';
import { EmailVerificationDto } from '../dto/email-verification.dto';
import { PasswordResetRequestDto } from '../dto/password-reset-request.dto';
import { PasswordResetDto } from '../dto/password-reset.dto';
import { InitialSignupDto } from '../dto/initial-signup.dto';
import { SignupOtpVerificationDto } from '../dto/signup-otp-verification.dto';
import { SignupPasswordSetupDto } from '../dto/signup-password-setup.dto';
import { SignupEmailVerificationDto } from '../dto/signup-email-verification.dto';
import { SignupDto } from '../dto/signup.dto';
import { OAuthSignupDto } from '../dto/signup.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    initialSignup: jest.fn(),
    verifySignupOtp: jest.fn(),
    setupSignupPassword: jest.fn(),
    addSignupEmail: jest.fn(),
    verifySignupEmail: jest.fn(),
    oauthSignup: jest.fn(),
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
    mobileLogin: jest.fn(),
    mobilePasswordLogin: jest.fn(),
    emailLogin: jest.fn(),
    oauthLogin: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    setupPassword: jest.fn(),
    verifyEmail: jest.fn(),
    requestEmailVerification: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    adminLogin: jest.fn(),
    adminVerify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mobilePasswordLogin', () => {
    it('should handle mobile password login successfully', async () => {
      const loginDto: MobilePasswordLoginDto = {
        mobileNumber: '+919876543210',
        password: 'TestPassword123',
      };

      const expectedResponse = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: { id: '123', mobileNumber: '+919876543210' },
        expiresIn: 604800,
      };

      mockAuthService.mobilePasswordLogin.mockResolvedValue(expectedResponse);

      const result = await controller.mobilePasswordLogin(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.mobilePasswordLogin).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('emailLogin', () => {
    it('should handle email login successfully', async () => {
      const loginDto: EmailLoginDto = {
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const expectedResponse = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: { id: '123', email: 'test@example.com' },
        expiresIn: 604800,
      };

      mockAuthService.emailLogin.mockResolvedValue(expectedResponse);

      const result = await controller.emailLogin(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.emailLogin).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('oauthLogin', () => {
    it('should handle OAuth login successfully', async () => {
      const loginDto: OAuthLoginDto = {
        provider: 'GOOGLE',
        accessToken: 'oauth-token-123',
      };

      const expectedResponse = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: { id: '123', email: 'test@example.com' },
        expiresIn: 604800,
      };

      mockAuthService.oauthLogin.mockResolvedValue(expectedResponse);

      const result = await controller.oauthLogin(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.oauthLogin).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refreshToken', () => {
    it('should handle token refresh successfully', async () => {
      const refreshDto: RefreshTokenDto = {
        refreshToken: 'refresh-token-123',
      };

      const expectedResponse = {
        accessToken: 'new-access-token-123',
        refreshToken: 'new-refresh-token-123',
        user: { id: '123', email: 'test@example.com' },
        expiresIn: 604800,
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await controller.refreshToken(refreshDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshDto);
    });
  });

  describe('requestOtp', () => {
    it('should handle OTP request successfully', async () => {
      const otpDto: RequestOtpDto = {
        mobileNumber: '+919876543210',
        type: 'SMS',
      };

      const expectedResponse = {
        message: 'OTP sent successfully',
        expiresIn: 300,
      };

      mockAuthService.requestOtp.mockResolvedValue(expectedResponse);

      const result = await controller.requestOtp(otpDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.requestOtp).toHaveBeenCalledWith(otpDto);
    });
  });

  describe('verifyOtp', () => {
    it('should handle OTP verification successfully', async () => {
      const otpDto: VerifyOtpDto = {
        mobileNumber: '+919876543210',
        code: '123456',
        type: 'SMS',
      };

      const expectedResponse = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: { id: '123', mobileNumber: '+919876543210' },
        expiresIn: 604800,
      };

      mockAuthService.verifyOtp.mockResolvedValue(expectedResponse);

      const result = await controller.verifyOtp(otpDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.verifyOtp).toHaveBeenCalledWith(otpDto);
    });
  });

  describe('setupPassword', () => {
    it('should handle password setup successfully', async () => {
      const passwordDto: PasswordSetupDto = {
        mobileNumber: '+919876543210',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
      };

      const expectedResponse = {
        success: true,
        message: 'Password set successfully',
      };

      mockAuthService.setupPassword.mockResolvedValue(expectedResponse);

      const result = await controller.setupPassword(passwordDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.setupPassword).toHaveBeenCalledWith(passwordDto);
    });
  });

  describe('signup', () => {
    it('should handle signup successfully', async () => {
      const signupDto: SignupDto = {
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        upiId: 'john.doe@upi',
      };

      const expectedResponse = {
        success: true,
        message: 'User registered successfully',
        userId: '123',
      };

      mockAuthService.signup.mockResolvedValue(expectedResponse);

      const result = await controller.signup(signupDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.signup).toHaveBeenCalledWith(signupDto);
    });
  });
});
