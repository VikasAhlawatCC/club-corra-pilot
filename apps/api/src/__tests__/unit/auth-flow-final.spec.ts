import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from '../../auth/auth.service';
import { UsersService } from '../../users/users.service';
import { OtpService } from '../../common/services/otp.service';
import { SmsService } from '../../common/services/sms.service';
import { EmailService } from '../../common/services/email.service';
import { JwtTokenService } from '../../auth/jwt.service';
import { ErrorHandlerService } from '../../common/services/error-handler.service';
import { SignupDto } from '../../auth/dto/signup.dto';
import { VerifyOtpDto } from '../../auth/dto/otp.dto';
import { MobileLoginDto, EmailLoginDto } from '../../auth/dto/login.dto';
import { OTPType } from '../../common/entities/otp.entity';
import { UserStatus } from '../../users/entities/user.entity';

describe('Authentication Flow Unit Tests', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let otpService: OtpService;
  let smsService: SmsService;
  let emailService: EmailService;
  let jwtTokenService: JwtTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
              JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-key-for-testing-only',
              TWILIO_ACCOUNT_SID: 'test_account_sid',
              TWILIO_AUTH_TOKEN: 'test_auth_token',
              TWILIO_PHONE_NUMBER: '+1234567890',
              SMTP_HOST: 'localhost',
              SMTP_PORT: 587,
              SMTP_SECURE: false,
              SMTP_USER: 'test@example.com',
              SMTP_PASS: 'test_password',
              SMTP_FROM_EMAIL: 'test@example.com',
            }),
          ],
        }),
        JwtModule.register({
          secret: 'test-jwt-secret-key-for-testing-only',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            findByMobileNumber: jest.fn(),
            findByEmail: jest.fn(),
            updateUserStatus: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: OtpService,
          useValue: {
            generateOtp: jest.fn(),
            verifyOtp: jest.fn(),
            isOtpExpired: jest.fn(),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendOtp: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendOtp: jest.fn(),
          },
        },
        {
          provide: 'JWT_REFRESH_SERVICE',
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: JwtTokenService,
          useValue: {
            generateTokens: jest.fn(),
            generateMobileTokens: jest.fn(),
            generateWebTokens: jest.fn(),
            verifyToken: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    otpService = module.get<OtpService>(OtpService);
    smsService = module.get<SmsService>(SmsService);
    emailService = module.get<EmailService>(EmailService);
    jwtTokenService = module.get<JwtTokenService>(JwtTokenService);
  });

  describe('User Registration Flow', () => {
    it('should handle user signup successfully', async () => {
      const signupDto: SignupDto = {
        mobileNumber: '9876543210',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        gender: 'male',
      };

      const mockUser = {
        id: 'user-123',
        mobileNumber: '9876543210',
        email: 'test@example.com',
        status: UserStatus.PENDING,
        isMobileVerified: false,
        isEmailVerified: false,
      };

      const mockOtp = '123456';

      jest.spyOn(usersService, 'createUser').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generateOtp').mockResolvedValue(mockOtp);
      jest.spyOn(smsService, 'sendOtp').mockResolvedValue(undefined);
      jest.spyOn(emailService, 'sendOtp').mockResolvedValue(undefined);

      const result = await authService.signup(signupDto);

      expect(result).toBeDefined();
      expect(result.message).toContain('User created successfully');
      expect(result.userId).toBe('user-123');
      expect(result.requiresOtpVerification).toBe(true);
      expect(result.otpType).toBe('mobile');

      expect(usersService.createUser).toHaveBeenCalledWith(signupDto);
      expect(otpService.generateOtp).toHaveBeenCalledWith('9876543210', OTPType.SMS);
      expect(smsService.sendOtp).toHaveBeenCalledWith('9876543210', mockOtp);
    });

    it('should handle signup without email', async () => {
      const signupDto: SignupDto = {
        mobileNumber: '9876543210',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        gender: 'male',
      };

      const mockUser = {
        id: 'user-123',
        mobileNumber: '9876543210',
        status: UserStatus.PENDING,
        isMobileVerified: false,
        isEmailVerified: false,
      };

      const mockOtp = '123456';

      jest.spyOn(usersService, 'createUser').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generateOtp').mockResolvedValue(mockOtp);
      jest.spyOn(smsService, 'sendOtp').mockResolvedValue(undefined);

      const result = await authService.signup(signupDto);

      expect(result).toBeDefined();
      expect(result.message).toContain('User created successfully');
      expect(result.userId).toBe('user-123');
      expect(result.requiresOtpVerification).toBe(true);
      expect(result.otpType).toBe('mobile');

      expect(usersService.createUser).toHaveBeenCalledWith(signupDto);
      expect(otpService.generateOtp).toHaveBeenCalledWith('9876543210', OTPType.SMS);
      expect(smsService.sendOtp).toHaveBeenCalledWith('9876543210', mockOtp);
    });
  });

  describe('OTP Verification Flow', () => {
    it('should handle OTP verification successfully', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        mobileNumber: '9876543210',
        code: '123456',
        type: OTPType.SMS,
      };

      const mockUser = {
        id: 'user-123',
        mobileNumber: '9876543210',
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: false,
      };

      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 604800,
        tokenType: 'Bearer' as const,
      };

      jest.spyOn(otpService, 'verifyOtp').mockResolvedValue(true);
      jest.spyOn(usersService, 'findByMobileNumber').mockResolvedValue(mockUser as any);
      jest.spyOn(usersService, 'updateUserStatus').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtTokenService, 'generateTokens').mockReturnValue(mockTokens);

      const result = await authService.verifyOtp(verifyOtpDto);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.user.isMobileVerified).toBe(true);

      expect(otpService.verifyOtp).toHaveBeenCalledWith('9876543210', '123456', OTPType.SMS);
      expect(usersService.findByMobileNumber).toHaveBeenCalledWith('9876543210');
      expect(usersService.updateUserStatus).toHaveBeenCalled();
      expect(jwtTokenService.generateTokens).toHaveBeenCalled();
    });

    it('should handle invalid OTP', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        mobileNumber: '9876543210',
        code: 'invalid',
        type: OTPType.SMS,
      };

      jest.spyOn(otpService, 'verifyOtp').mockResolvedValue(false);

      await expect(authService.verifyOtp(verifyOtpDto)).rejects.toThrow();

      expect(otpService.verifyOtp).toHaveBeenCalledWith('9876543210', 'invalid', OTPType.SMS);
    });
  });

  describe('Login Flow', () => {
    it('should handle mobile OTP login successfully', async () => {
      const loginDto: MobileLoginDto = {
        mobileNumber: '9876543210',
        otpCode: '123456',
      };

      const mockUser = {
        id: 'user-123',
        mobileNumber: '9876543210',
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: true,
      };

      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 604800,
        tokenType: 'Bearer' as const,
      };

      jest.spyOn(usersService, 'findByMobileNumber').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtTokenService, 'generateMobileTokens').mockReturnValue(mockTokens);

      const result = await authService.mobileLogin(loginDto);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();

      expect(usersService.findByMobileNumber).toHaveBeenCalledWith('9876543210');
      expect(jwtTokenService.generateMobileTokens).toHaveBeenCalled();
    });

    it('should handle email password login successfully', async () => {
      const loginDto: EmailLoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: true,
        passwordHash: 'hashed-password',
      };

      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 86400,
        tokenType: 'Bearer' as const,
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtTokenService, 'generateWebTokens').mockReturnValue(mockTokens);

      const result = await authService.emailLogin(loginDto);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(jwtTokenService.generateWebTokens).toHaveBeenCalled();
    });

    it('should handle login with unverified mobile', async () => {
      const loginDto: MobileLoginDto = {
        mobileNumber: '9876543210',
        otpCode: '123456',
      };

      const mockUser = {
        id: 'user-123',
        mobileNumber: '9876543210',
        status: UserStatus.PENDING,
        isMobileVerified: false,
        isEmailVerified: false,
      };

      jest.spyOn(usersService, 'findByMobileNumber').mockResolvedValue(mockUser as any);

      await expect(authService.mobileLogin(loginDto)).rejects.toThrow();

      expect(usersService.findByMobileNumber).toHaveBeenCalledWith('9876543210');
    });
  });

  describe('Error Handling', () => {
    it('should handle user creation errors', async () => {
      const signupDto: SignupDto = {
        mobileNumber: '9876543210',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        gender: 'male',
      };

      jest.spyOn(usersService, 'createUser').mockRejectedValue(new Error('Database error'));

      await expect(authService.signup(signupDto)).rejects.toThrow();

      expect(usersService.createUser).toHaveBeenCalledWith(signupDto);
    });

    it('should handle OTP generation errors', async () => {
      const signupDto: SignupDto = {
        mobileNumber: '9876543210',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        gender: 'male',
      };

      const mockUser = {
        id: 'user-123',
        mobileNumber: '9876543210',
        email: 'test@example.com',
        status: UserStatus.PENDING,
        isMobileVerified: false,
        isEmailVerified: false,
      };

      jest.spyOn(usersService, 'createUser').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generateOtp').mockRejectedValue(new Error('OTP service error'));

      await expect(authService.signup(signupDto)).rejects.toThrow();

      expect(usersService.createUser).toHaveBeenCalledWith(signupDto);
      expect(otpService.generateOtp).toHaveBeenCalledWith('9876543210', OTPType.SMS);
    });
  });
});
