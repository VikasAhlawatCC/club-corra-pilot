import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '../jwt.service';
import { OtpService } from '../../common/services/otp.service';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';
import { RateLimitService } from '../../common/services/rate-limit.service';
import { UsersService } from '../../users/users.service';
import { LoginDto, SignupDto, OtpDto } from '../dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { User } from '../../users/entities/user.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { PaymentDetails } from '../../users/entities/payment-details.entity';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let otpService: OtpService;
  let emailService: EmailService;
  let smsService: SmsService;
  let rateLimitService: RateLimitService;
  let usersService: UsersService;

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

  const mockUsersService = {
    createUser: jest.fn(),
    findByMobileNumber: jest.fn(),
    findByEmail: jest.fn(),
    updateUserProfile: jest.fn(),
    updatePaymentDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: RateLimitService, useValue: mockRateLimitService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    otpService = module.get<OtpService>(OtpService);
    emailService = module.get<EmailService>(EmailService);
    smsService = module.get<SmsService>(SmsService);
    rateLimitService = module.get<RateLimitService>(RateLimitService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and send OTP', async () => {
      const signupDto: SignupDto = {
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        upiId: 'john.doe@upi',
      };

      const mockUser: User = {
        id: '123',
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        isMobileVerified: false,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
        paymentDetails: null,
        authProviders: [],
      };

      const mockOtp = '123456';

      mockUsersService.createUser.mockResolvedValue(mockUser);
      mockOtpService.generateOtp.mockResolvedValue(mockOtp);
      mockSmsService.sendSms.mockResolvedValue(true);
      mockEmailService.sendEmail.mockResolvedValue(true);
      mockRateLimitService.checkRateLimit.mockResolvedValue(true);

      const result = await service.signup(signupDto);

      expect(result.success).toBe(true);
      expect(result.message).toContain('User registered successfully');
      expect(result.data.requiresOtpVerification).toBe(true);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(signupDto);
      expect(mockSmsService.sendSms).toHaveBeenCalledWith(signupDto.mobileNumber, expect.stringContaining(mockOtp));
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(signupDto.email, expect.stringContaining(mockOtp));
    });

    it('should handle existing user signup', async () => {
      const signupDto: SignupDto = {
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUsersService.findByMobileNumber.mockResolvedValue({ id: '123' } as User);

      await expect(service.signup(signupDto)).rejects.toThrow('User already exists');
    });

    it('should handle rate limiting', async () => {
      const signupDto: SignupDto = {
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRateLimitService.checkRateLimit.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(service.signup(signupDto)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('login', () => {
    it('should authenticate user with valid OTP', async () => {
      const loginDto: LoginDto = {
        mobileNumber: '+919876543210',
        otp: '123456',
      };

      const mockUser: User = {
        id: '123',
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        isMobileVerified: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
        paymentDetails: null,
        authProviders: [],
      };

      const mockTokens = {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      };

      mockUsersService.findByMobileNumber.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockJwtService.generateToken.mockResolvedValue(mockTokens);

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.data.accessToken).toBe(mockTokens.accessToken);
      expect(result.data.refreshToken).toBe(mockTokens.refreshToken);
    });

    it('should reject login with invalid OTP', async () => {
      const loginDto: LoginDto = {
        mobileNumber: '+919876543210',
        otp: '000000',
      };

      const mockUser: User = {
        id: '123',
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        isMobileVerified: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
        paymentDetails: null,
        authProviders: [],
      };

      mockUsersService.findByMobileNumber.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid OTP');
    });

    it('should reject login for non-existent user', async () => {
      const loginDto: LoginDto = {
        mobileNumber: '+919876543210',
        otp: '123456',
      };

      mockUsersService.findByMobileNumber.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow('User not found');
    });
  });

  describe('verifyOtp', () => {
    it('should verify SMS OTP successfully', async () => {
      const otpDto: OtpDto = {
        mobileNumber: '+919876543210',
        otp: '123456',
        type: 'SMS',
      };

      const mockUser: User = {
        id: '123',
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        isMobileVerified: false,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
        paymentDetails: null,
        authProviders: [],
      };

      const mockTokens = {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      };

      mockUsersService.findByMobileNumber.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockJwtService.generateToken.mockResolvedValue(mockTokens);

      const result = await service.verifyOtp(otpDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP verified successfully');
      expect(result.data.accessToken).toBe(mockTokens.accessToken);
    });

    it('should verify email OTP successfully', async () => {
      const otpDto: OtpDto = {
        email: 'test@example.com',
        otp: '123456',
        type: 'EMAIL',
      };

      const mockUser: User = {
        id: '123',
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        isMobileVerified: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
        paymentDetails: null,
        authProviders: [],
      };

      const mockTokens = {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockJwtService.generateToken.mockResolvedValue(mockTokens);

      const result = await service.verifyOtp(otpDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP verified successfully');
      expect(result.data.accessToken).toBe(mockTokens.accessToken);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', async () => {
      const refreshToken = 'refresh-token';
      const mockTokens = {
        accessToken: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
      };

      mockJwtService.refreshToken.mockResolvedValue(mockTokens);

      const result = await service.refreshToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token refreshed successfully');
      expect(result.data.accessToken).toBe(mockTokens.accessToken);
      expect(result.data.refreshToken).toBe(mockTokens.refreshToken);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = '123';

      const result = await service.logout(userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logout successful');
      expect(result.data).toBeNull();
    });
  });
});
