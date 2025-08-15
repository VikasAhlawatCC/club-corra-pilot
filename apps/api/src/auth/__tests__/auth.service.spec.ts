import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { JwtTokenService } from '../jwt.service';
import { OtpService } from '../../common/services/otp.service';
import { EmailService } from '../../common/services/email.service';
import { ErrorHandlerService } from '../../common/services/error-handler.service';
import { UserStatus } from '../../users/entities/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('AuthService - Password Setup', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtTokenService: JwtTokenService;

  const mockUsersService = {
    findByMobileNumber: jest.fn(),
    findByEmail: jest.fn(),
    setPassword: jest.fn(),
    updateUserStatus: jest.fn(),
    addEmail: jest.fn(),
    verifyEmailWithToken: jest.fn(),
    markEmailVerified: jest.fn(),
  };

  const mockJwtTokenService = {
    generateMobileTokens: jest.fn(),
  };

  const mockOtpService = {
    generateOtp: jest.fn(),
  };

  const mockEmailService = {
    sendOtp: jest.fn(),
  };

  const mockErrorHandlerService = {
    handleAuthError: jest.fn(),
    logAuthAttempt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtTokenService,
          useValue: mockJwtTokenService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ErrorHandlerService,
          useValue: mockErrorHandlerService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtTokenService = module.get<JwtTokenService>(JwtTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupSignupPassword', () => {
    const mockPasswordSetupDto = {
      mobileNumber: '9876543210',
      password: 'TestPassword123',
      confirmPassword: 'TestPassword123',
    };

    const mockUser = {
      id: 'user-123',
      mobileNumber: '9876543210',
      email: null,
      status: UserStatus.PENDING,
      isMobileVerified: true,
      passwordHash: null,
    };

    const mockTokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
      expiresIn: 3600,
    };

    it('should successfully setup password and activate account immediately', async () => {
      // Arrange
      mockUsersService.findByMobileNumber.mockResolvedValue(mockUser);
      mockUsersService.setPassword.mockResolvedValue(undefined);
      mockUsersService.updateUserStatus.mockResolvedValue(undefined);
      mockJwtTokenService.generateMobileTokens.mockResolvedValue(mockTokens);

      // Act
      const result = await service.setupSignupPassword(mockPasswordSetupDto);

      // Assert
      expect(result).toEqual({
        message: 'Password set successfully. Account activated.',
        userId: 'user-123',
        requiresEmailVerification: false,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
      });

      expect(mockUsersService.setPassword).toHaveBeenCalledWith('user-123', 'TestPassword123');
      expect(mockUsersService.updateUserStatus).toHaveBeenCalledWith('user-123', UserStatus.ACTIVE);
      expect(mockJwtTokenService.generateMobileTokens).toHaveBeenCalledWith(mockUser);
    });

    it('should successfully setup password and activate account even when user has email', async () => {
      // Arrange
      const userWithEmail = { ...mockUser, email: 'test@example.com' };
      mockUsersService.findByMobileNumber.mockResolvedValue(userWithEmail);
      mockUsersService.setPassword.mockResolvedValue(undefined);
      mockUsersService.updateUserStatus.mockResolvedValue(undefined);
      mockJwtTokenService.generateMobileTokens.mockResolvedValue(mockTokens);

      // Act
      const result = await service.setupSignupPassword(mockPasswordSetupDto);

      // Assert
      expect(result).toEqual({
        message: 'Password set successfully. Account activated.',
        userId: 'user-123',
        requiresEmailVerification: false,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
      });

      expect(mockUsersService.updateUserStatus).toHaveBeenCalledWith('user-123', UserStatus.ACTIVE);
    });

    it('should throw error if user is not found', async () => {
      // Arrange
      mockUsersService.findByMobileNumber.mockResolvedValue(null);

      // Act & Assert
      await expect(service.setupSignupPassword(mockPasswordSetupDto))
        .rejects
        .toThrow(BadRequestException);
      
      expect(mockUsersService.setPassword).not.toHaveBeenCalled();
      expect(mockUsersService.updateUserStatus).not.toHaveBeenCalled();
    });

    it('should throw error if user status is not PENDING', async () => {
      // Arrange
      const activeUser = { ...mockUser, status: UserStatus.ACTIVE };
      mockUsersService.findByMobileNumber.mockResolvedValue(activeUser);

      // Act & Assert
      await expect(service.setupSignupPassword(mockPasswordSetupDto))
        .rejects
        .toThrow(BadRequestException);
      
      expect(mockUsersService.setPassword).not.toHaveBeenCalled();
    });

    it('should throw error if user already has password', async () => {
      // Arrange
      const userWithPassword = { ...mockUser, passwordHash: 'existing-hash' };
      mockUsersService.findByMobileNumber.mockResolvedValue(userWithPassword);

      // Act & Assert
      await expect(service.setupSignupPassword(mockPasswordSetupDto))
        .rejects
        .toThrow(BadRequestException);
      
      expect(mockUsersService.setPassword).not.toHaveBeenCalled();
    });

    it('should throw error if mobile number is not verified', async () => {
      // Arrange
      const unverifiedUser = { ...mockUser, isMobileVerified: false };
      mockUsersService.findByMobileNumber.mockResolvedValue(unverifiedUser);
      mockUsersService.setPassword.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.setupSignupPassword(mockPasswordSetupDto))
        .rejects
        .toThrow(BadRequestException);
      
      expect(mockUsersService.updateUserStatus).not.toHaveBeenCalled();
    });

    it('should throw error if passwords do not match', async () => {
      // Arrange
      const mismatchedPasswords = {
        ...mockPasswordSetupDto,
        confirmPassword: 'DifferentPassword123',
      };

      // Act & Assert
      await expect(service.setupSignupPassword(mismatchedPasswords))
        .rejects
        .toThrow(BadRequestException);
      
      expect(mockUsersService.findByMobileNumber).not.toHaveBeenCalled();
    });

    it('should throw error if password is too weak', async () => {
      // Arrange
      const weakPassword = {
        ...mockPasswordSetupDto,
        password: 'weak',
        confirmPassword: 'weak',
      };

      // Act & Assert
      await expect(service.setupSignupPassword(weakPassword))
        .rejects
        .toThrow(BadRequestException);
      
      expect(mockUsersService.findByMobileNumber).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockUsersService.findByMobileNumber.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.setupSignupPassword(mockPasswordSetupDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('addSignupEmail', () => {
    const mockEmailDto = {
      mobileNumber: '9876543210',
      email: 'test@example.com',
    };

    const mockUser = {
      id: 'user-123',
      mobileNumber: '9876543210',
      email: null,
      status: UserStatus.PENDING,
      passwordHash: 'hashed-password',
    };

    it('should successfully add email and send verification', async () => {
      // Arrange
      mockUsersService.findByMobileNumber.mockResolvedValue(mockUser);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.addEmail.mockResolvedValue(undefined);
      mockOtpService.generateOtp.mockResolvedValue('123456');
      mockEmailService.sendOtp.mockResolvedValue(undefined);

      // Act
      const result = await service.addSignupEmail(mockEmailDto);

      // Assert
      expect(result).toEqual({
        message: 'Email added successfully. Please check your email for verification.',
        userId: 'user-123',
        accountActivated: false,
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
      });

      expect(mockUsersService.addEmail).toHaveBeenCalledWith('user-123', 'test@example.com');
      expect(mockOtpService.generateOtp).toHaveBeenCalledWith('test@example.com', 'EMAIL');
      expect(mockEmailService.sendOtp).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('should throw error if email is already used by another user', async () => {
      // Arrange
      const existingUser = { id: 'other-user', mobileNumber: '1111111111' };
      mockUsersService.findByEmail.mockResolvedValue(existingUser);
      mockUsersService.findByMobileNumber.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.addSignupEmail(mockEmailDto))
        .rejects
        .toThrow(BadRequestException);
      
      expect(mockUsersService.addEmail).not.toHaveBeenCalled();
    });

    it('should allow same user to add email', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(mockUser); // Same user
      mockUsersService.findByMobileNumber.mockResolvedValue(mockUser);
      mockUsersService.addEmail.mockResolvedValue(undefined);
      mockOtpService.generateOtp.mockResolvedValue('123456');
      mockEmailService.sendOtp.mockResolvedValue(undefined);

      // Act
      const result = await service.addSignupEmail(mockEmailDto);

      // Assert
      expect(result).toBeDefined();
      expect(mockUsersService.addEmail).toHaveBeenCalled();
    });
  });

  describe('verifySignupEmail', () => {
    const mockEmailVerificationDto = {
      token: 'verification-token-123',
    };

    const mockUser = {
      id: 'user-123',
      mobileNumber: '9876543210',
      email: 'test@example.com',
      status: UserStatus.PENDING,
      passwordHash: 'hashed-password',
    };

    const mockTokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
      expiresIn: 3600,
    };

    it('should successfully verify email and activate account', async () => {
      // Arrange
      mockUsersService.verifyEmailWithToken.mockResolvedValue(mockUser);
      mockUsersService.markEmailVerified.mockResolvedValue(undefined);
      mockUsersService.updateUserStatus.mockResolvedValue(undefined);
      mockJwtTokenService.generateMobileTokens.mockResolvedValue(mockTokens);
      mockErrorHandlerService.logAuthAttempt.mockResolvedValue(undefined);

      // Act
      const result = await service.verifySignupEmail(mockEmailVerificationDto);

      // Assert
      expect(result).toEqual({
        message: 'Email verified successfully. Account activated.',
        userId: 'user-123',
        accountActivated: true,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
      });

      expect(mockUsersService.markEmailVerified).toHaveBeenCalledWith('user-123');
      expect(mockUsersService.updateUserStatus).toHaveBeenCalledWith('user-123', UserStatus.ACTIVE);
      expect(mockJwtTokenService.generateMobileTokens).toHaveBeenCalledWith(mockUser);
    });
  });
});
