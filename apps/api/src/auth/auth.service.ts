import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { OtpService } from '../common/services/otp.service';
import { SmsService } from '../common/services/sms.service';
import { EmailService } from '../common/services/email.service';
import { JwtTokenService } from './jwt.service';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import {
  SignupDto,
  OAuthSignupDto,
} from './dto/signup.dto';
import {
  MobileLoginDto,
  EmailLoginDto,
  OAuthLoginDto,
  RefreshTokenDto,
} from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { PasswordSetupDto } from './dto/password-setup.dto';
import { EmailVerificationDto } from './dto/email-verification.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { OTPType } from '../common/entities/otp.entity';
import { UserStatus } from '../users/entities/user.entity';
import { ProviderType } from '../users/entities/auth-provider.entity';
import { AUTH_CONSTANTS, AUTH_ERROR_MESSAGES } from '../common/constants/auth.constants';
import { 
  EmailVerificationResponse, 
  PasswordResetResponse, 
  PasswordSetupResponse,
  AuthSuccessResponse 
} from '../common/interfaces/auth-response.interface';
import { SignupResponseDto } from './dto/auth-response.dto';
import { InitialSignupDto, InitialSignupResponseDto } from './dto/initial-signup.dto';
import { SignupOtpVerificationDto, SignupOtpVerificationResponseDto } from './dto/signup-otp-verification.dto';
import { SignupPasswordSetupDto, SignupPasswordSetupResponseDto } from './dto/signup-password-setup.dto';
import { SignupEmailVerificationDto, SignupEmailVerificationResponseDto } from './dto/signup-email-verification.dto';

/**
 * Authentication service providing user signup, login, OTP verification, and OAuth integration
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private otpService: OtpService,
    private smsService: SmsService,
    private emailService: EmailService,
    private jwtService: JwtService,
    @Inject('JWT_REFRESH_SERVICE') private jwtRefreshService: JwtService,
    private configService: ConfigService,
    private jwtTokenService: JwtTokenService,
    private errorHandler: ErrorHandlerService,
  ) {}

  /**
   * Creates a new user account with mobile number and optional email
   * Sends OTP for mobile verification and email verification if email provided
   * 
   * @param signupDto - User signup data including mobile, email, and profile information
   * @returns Promise with user creation result and OTP verification status
   * @throws ConflictException if mobile number or email already exists
   * @throws BadRequestException if user creation fails
   */
  async signup(signupDto: SignupDto): Promise<SignupResponseDto> {
    try {
      // Check if user already exists before attempting to create
      const existingUser = await this.usersService.findByMobileNumber(signupDto.mobileNumber);
      if (existingUser) {
        return {
          message: 'User already registered',
          redirectToLogin: true,
          existingUserMessage: 'This mobile number is already registered. Please login instead.',
        };
      }

      // Check if email already exists (if provided)
      if (signupDto.email) {
        const existingEmailUser = await this.usersService.findByEmail(signupDto.email);
        if (existingEmailUser) {
          return {
            message: 'User already registered',
            redirectToLogin: true,
            existingUserMessage: 'This email is already registered. Please login instead.',
          };
        }
      }

      // Create user
      const user = await this.usersService.createUser(signupDto);

      // If email is provided, skip SMS OTP and automatically verify email (no OTP needed)
      if (signupDto.email) {
        // Skip email OTP generation and sending
        // const emailOtp = await this.otpService.generateOtp(
        //   signupDto.email,
        //   OTPType.EMAIL,
        // );
        // await this.emailService.sendOtp(signupDto.email, emailOtp);
        
        // Mark both mobile and email as verified to skip verification steps
        await this.usersService.markMobileVerified(user.id);
        await this.usersService.markEmailVerified(user.id);
        
        // Update user status to ACTIVE since both verifications are complete
        await this.usersService.updateUserStatus(user.id, UserStatus.ACTIVE);
        
        return {
          message: 'User created successfully. Email and mobile verification completed automatically.',
          userId: user.id,
          requiresOtpVerification: false,
        };
      } else {
        // No email provided, send SMS OTP as usual
        const mobileOtp = await this.otpService.generateOtp(
          signupDto.mobileNumber,
          OTPType.SMS,
        );
        await this.smsService.sendOtp(signupDto.mobileNumber, mobileOtp);
        
        return {
          message: 'User created successfully. Please verify your mobile number.',
          userId: user.id,
          requiresOtpVerification: true,
          otpType: 'mobile',
        };
      }
    } catch (error) {
      // Only handle unexpected errors here
      throw new BadRequestException('Failed to create user');
    }
  }

  async oauthSignup(oauthSignupDto: OAuthSignupDto): Promise<SignupResponseDto> {
    try {
      // Check if user already exists before attempting to create
      const existingUser = await this.usersService.findByMobileNumber(oauthSignupDto.mobileNumber);
      if (existingUser) {
        return {
          message: 'User already registered',
          redirectToLogin: true,
          existingUserMessage: 'This mobile number is already registered. Please login instead.',
        };
      }

      // Validate OAuth token and get user data
      const oauthData = await this.validateOAuthToken(
        oauthSignupDto.oauthProvider,
        oauthSignupDto.oauthToken,
      );

      // Create user with OAuth data
      const user = await this.usersService.createOAuthUser(
        oauthSignupDto,
        oauthData,
      );

      // Send mobile OTP for verification (OAuth users always use SMS OTP)
      const mobileOtp = await this.otpService.generateOtp(
        oauthSignupDto.mobileNumber,
        OTPType.SMS,
      );

      await this.smsService.sendOtp(oauthSignupDto.mobileNumber, mobileOtp);

      // Generate tokens using the new JWT service
      const tokens = await this.jwtTokenService.generateMobileTokens(user);

      return {
        message: 'OAuth user created successfully. Please verify your mobile number.',
        userId: user.id,
        requiresOtpVerification: true,
        otpType: 'mobile',
        tokens,
      };
    } catch (error) {
      // Only handle unexpected errors here
      throw new BadRequestException('Failed to create OAuth user');
    }
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { mobileNumber, email, type } = requestOtpDto;

    // Add logging to debug the issue
    this.logger.log(`[DEBUG] requestOtp called with: type=${type}, mobileNumber=${mobileNumber}, email=${email}`);

    if (type === OTPType.SMS && !mobileNumber) {
      throw new BadRequestException('Mobile number is required for mobile OTP');
    }

    if (type === OTPType.EMAIL && !email) {
      throw new BadRequestException('Email is required for email OTP');
    }

    const identifier = type === OTPType.SMS ? mobileNumber! : email!;
    const otpCode = await this.otpService.generateOtp(identifier, type);

    // Send OTP based on type
    if (type === OTPType.SMS) {
      this.logger.log(`[DEBUG] Sending SMS OTP to ${mobileNumber}`);
      await this.smsService.sendOtp(mobileNumber!, otpCode);
    } else {
      this.logger.log(`[DEBUG] Sending email OTP to ${email}`);
      await this.emailService.sendOtp(email!, otpCode);
    }

    return {
      message: `OTP sent successfully to your ${type}`,
      expiresIn: 300, // 5 minutes
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { mobileNumber, email, code, type } = verifyOtpDto;

    if (type === OTPType.SMS && !mobileNumber) {
      throw new BadRequestException('Mobile number is required for mobile OTP verification');
    }

    if (type === OTPType.EMAIL && !email) {
      throw new BadRequestException('Email is required for email OTP verification');
    }

    const identifier = type === OTPType.SMS ? mobileNumber! : email!;

    // Verify OTP
    const isValid = await this.otpService.verifyOtp(identifier, type, code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Find user and mark as verified
    let user;
    if (type === OTPType.SMS) {
      user = await this.usersService.findByMobileNumber(mobileNumber!);
      
      // If user doesn't exist, create a minimal user for mobile OTP flow
      if (!user) {
        this.logger.log(`[DEBUG] Creating minimal user for mobile number: ${mobileNumber}`);
        user = await this.usersService.createMinimalUser(mobileNumber!);
      }
      
      if (user) {
        await this.usersService.markMobileVerified(user.id);
      }
    } else {
      user = await this.usersService.findByEmail(email!);
      if (user) {
        await this.usersService.markEmailVerified(user.id);
      }
    }

    // Check if user is fully verified and can be activated
    if (user && user.isMobileVerified && user.isEmailVerified) {
      await this.usersService.updateUserStatus(user.id, UserStatus.ACTIVE);
      
      // Generate tokens using the new JWT service
      const tokens = await this.jwtTokenService.generateMobileTokens(user);
      
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
        expiresIn: tokens.expiresIn,
      };
    }

    return {
      message: `${type} verified successfully`,
      requiresAdditionalVerification: true,
      user, // Include user object so mobile app can access UUID for password setup
    };
  }

  async mobileLogin(mobileLoginDto: MobileLoginDto) {
    const { mobileNumber, otpCode } = mobileLoginDto;

    // Verify OTP
    const isValid = await this.otpService.verifyOtp(mobileNumber, OTPType.SMS, otpCode);

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Find user
    const user = await this.usersService.findByMobileNumber(mobileNumber);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens using the new JWT service
    const tokens = await this.jwtTokenService.generateMobileTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      expiresIn: tokens.expiresIn,
    };
  }

  // This method is now implemented below with full password support
  async emailLogin(emailLoginDto: EmailLoginDto) {
    const { email, password } = emailLoginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has password set
    if (!(await this.usersService.hasPassword(user.id))) {
      throw new BadRequestException('Password not set for this account. Please use OTP login or set a password first.');
    }

    // Validate password
    const isValidPassword = await this.usersService.validatePassword(user.id, password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens using the new JWT service
    const tokens = await this.jwtTokenService.generateMobileTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      expiresIn: tokens.expiresIn,
    };
  }

  async oauthLogin(oauthLoginDto: OAuthLoginDto) {
    const { provider, accessToken } = oauthLoginDto;

    // Validate OAuth token
    const oauthData = await this.validateOAuthToken(provider, accessToken);

    // Find user by OAuth provider
    const user = await this.findUserByOAuthProvider(provider, oauthData.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens using the new JWT service
    const tokens = await this.jwtTokenService.generateMobileTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      expiresIn: tokens.expiresIn,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtTokenService.verifyRefreshToken(refreshTokenDto.refreshToken);

      const user = await this.usersService.findById(payload.sub);
      const isValidRefreshToken = await this.usersService.validateRefreshToken(
        user.id,
        refreshTokenDto.refreshToken,
      );

      if (!isValidRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens using the new JWT service
      const tokens = await this.jwtTokenService.generateMobileTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async validateOAuthToken(provider: ProviderType, token: string) {
    try {
      switch (provider) {
        case ProviderType.GOOGLE:
          // Basic Google token validation - in production, use Google's tokeninfo endpoint
          const googleResponse = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`
          );
          
          if (!googleResponse.ok) {
            throw new BadRequestException('Invalid Google OAuth token');
          }
          
          const googleData = await googleResponse.json();
          return { 
            id: googleData.user_id, 
            email: googleData.email,
            name: googleData.name 
          };
          
        case ProviderType.FACEBOOK:
          // Basic Facebook token validation - in production, use Facebook's debug endpoint
          const facebookResponse = await fetch(
            `https://graph.facebook.com/me?access_token=${token}&fields=id,email,name`
          );
          
          if (!facebookResponse.ok) {
            throw new BadRequestException('Invalid Facebook OAuth token');
          }
          
          const facebookData = await facebookResponse.json();
          return { 
            id: facebookData.id, 
            email: facebookData.email,
            name: facebookData.name 
          };
          
        default:
          throw new BadRequestException('Unsupported OAuth provider');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to validate OAuth token');
    }
  }

  private async findUserByOAuthProvider(provider: ProviderType, providerUserId: string) {
    try {
      const authProvider = await this.usersService.findByOAuthProvider(provider, providerUserId);
      if (authProvider) {
        return await this.usersService.findById(authProvider.userId);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Password setup and management methods
  /**
   * Sets up a password for a new user account
   * @param mobileNumber - The user's mobile number
   * @param passwordSetupDto - Password setup data including password and confirmation
   * @throws BadRequestException if password doesn't meet requirements or doesn't match confirmation
   */
  async setupPassword(mobileNumber: string, passwordSetupDto: PasswordSetupDto): Promise<void> {
    // Validate password strength
    if (!this.validatePasswordStrength(passwordSetupDto.password)) {
      throw new BadRequestException('Password does not meet strength requirements');
    }

    // Check if passwords match
    if (passwordSetupDto.password !== passwordSetupDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find user by mobile number (should exist after OTP verification)
    const user = await this.usersService.findByMobileNumber(mobileNumber);
    
    if (!user) {
      throw new BadRequestException('User not found. Please complete OTP verification first.');
    }

    // Check if user already has a password set
    if (await this.usersService.hasPassword(user.id)) {
      throw new BadRequestException('User already has a password set. Please use the login page instead.');
    }

    // Set password for user
    await this.usersService.setPassword(user.id, passwordSetupDto.password);

    // Check if user can be activated (both mobile and email verified)
    if (user.isMobileVerified && user.isEmailVerified && user.status === UserStatus.PENDING) {
      await this.usersService.updateUserStatus(user.id, UserStatus.ACTIVE);
    }
  }

  /**
   * Verifies a user's email using a verification token
   * @param emailVerificationDto - Email verification data including token
   * @returns Promise with verification result and user data
   * @throws BadRequestException if verification fails
   */
  async verifyEmail(emailVerificationDto: EmailVerificationDto): Promise<EmailVerificationResponse> {
    try {
      const user = await this.usersService.verifyEmailWithToken(emailVerificationDto.token);
      
      this.errorHandler.logAuthAttempt('email_verification', user.id, true);
      
      return {
        success: true,
        message: 'Email verified successfully',
        user,
        requiresPasswordSetup: !(await this.usersService.hasPassword(user.id)),
      };
    } catch (error) {
      this.errorHandler.logAuthAttempt('email_verification', undefined, false, { token: emailVerificationDto.token });
      return this.errorHandler.handleAuthError(error, 'email_verification');
    }
  }

  /**
   * Generates an email verification token for a user
   * @param email - The user's email address
   * @returns Promise<string> - The generated verification token
   * @throws BadRequestException if user not found or email already verified
   */
  async generateEmailVerificationToken(email: string): Promise<string> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found with this email');
      }

      if (user.isEmailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      return this.usersService.generateEmailVerificationToken(user.id);
    } catch (error) {
      return this.errorHandler.handleAuthError(error, 'email_verification_token_generation', { email });
    }
  }

  /**
   * Requests email verification for a user
   * @param email - The user's email address
   * @returns Promise with success message and expiry information
   * @throws BadRequestException if verification request fails
   */
  async requestEmailVerification(email: string): Promise<EmailVerificationResponse> {
    try {
      const token = await this.generateEmailVerificationToken(email);
      
      // Send email with verification link/token
      // In production, this would be a proper email with verification link
      await this.emailService.sendOtp(email, `Your verification token: ${token}`);

      this.errorHandler.logAuthAttempt('email_verification_request', undefined, true, { email });

      return {
        success: true,
        message: 'Email verification sent successfully',
        expiresIn: AUTH_CONSTANTS.TOKEN_EXPIRY.EMAIL_VERIFICATION * 3600, // Convert hours to seconds
      };
    } catch (error) {
      this.errorHandler.logAuthAttempt('email_verification_request', undefined, false, { email });
      return this.errorHandler.handleAuthError(error, 'email_verification_request');
    }
  }

  /**
   * Requests a password reset for a user
   * @param passwordResetRequestDto - Password reset request data including email
   * @returns Promise with success message (doesn't reveal if email exists)
   */
  async requestPasswordReset(passwordResetRequestDto: PasswordResetRequestDto): Promise<PasswordResetResponse> {
    try {
      const message = await this.usersService.requestPasswordReset(passwordResetRequestDto.email);
      
      // In production, send email with reset link
      // For now, we'll just return the message
      
      this.errorHandler.logAuthAttempt('password_reset_request', undefined, true, { email: passwordResetRequestDto.email });

      return {
        success: true,
        message: 'Password reset email sent if account exists',
        // In production, don't reveal if email exists or not
      };
    } catch (error) {
      this.errorHandler.logAuthAttempt('password_reset_request', undefined, false, { email: passwordResetRequestDto.email });
      // Don't reveal if email exists or not for security
      return {
        success: true,
        message: 'Password reset email sent if account exists',
      };
    }
  }

  /**
   * Resets a user's password using a reset token
   * @param passwordResetDto - Password reset data including token and new password
   * @returns Promise with success message
   * @throws BadRequestException if password doesn't meet requirements or reset fails
   */
  async resetPassword(passwordResetDto: PasswordResetDto): Promise<PasswordResetResponse> {
    try {
      // Validate password strength
      if (!this.validatePasswordStrength(passwordResetDto.password)) {
        throw new BadRequestException('Password does not meet strength requirements');
      }

      // Check if passwords match
      if (passwordResetDto.password !== passwordResetDto.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      await this.usersService.resetPasswordWithToken(
        passwordResetDto.token,
        passwordResetDto.password
      );

      this.errorHandler.logAuthAttempt('password_reset', undefined, true, { token: passwordResetDto.token });

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      this.errorHandler.logAuthAttempt('password_reset', undefined, false, { token: passwordResetDto.token });
      return this.errorHandler.handleAuthError(error, 'password_reset');
    }
  }

  // Password validation utility method
  private validatePasswordStrength(password: string): boolean {
    // Minimum length check
    if (password.length < AUTH_CONSTANTS.PASSWORD.MIN_LENGTH) {
      return false;
    }

    // Must contain lowercase, uppercase, and numeric characters
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    return hasLowercase && hasUppercase && hasNumber;
  }

  /**
   * Initial signup step - collects user name and mobile number
   * Creates user in PENDING status and sends OTP
   * @param initialSignupDto - User's basic information
   * @returns Promise with signup result and OTP status
   */
  async initialSignup(initialSignupDto: InitialSignupDto): Promise<InitialSignupResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByMobileNumber(initialSignupDto.mobileNumber);
      
      if (existingUser) {
        if (existingUser.status === UserStatus.ACTIVE) {
          // User exists and is active - redirect to login
          return {
            message: 'User already registered',
            mobileNumber: initialSignupDto.mobileNumber,
            requiresOtpVerification: false,
            redirectToLogin: true,
            existingUserMessage: 'This mobile number is already registered. Please login instead.',
          };
        } else if (existingUser.status === UserStatus.PENDING && !existingUser.passwordHash) {
          // User exists but hasn't completed password setup - regenerate OTP
          const mobileOtp = await this.otpService.generateOtp(
            initialSignupDto.mobileNumber,
            OTPType.SMS,
          );
          await this.smsService.sendOtp(initialSignupDto.mobileNumber, mobileOtp);
          
          return {
            message: 'Account found but incomplete. New OTP sent for verification.',
            mobileNumber: initialSignupDto.mobileNumber,
            requiresOtpVerification: true,
          };
        }
      }

      // Create new user with PENDING status
      const user = await this.usersService.createInitialUser(initialSignupDto);

      // Send SMS OTP for verification
      const mobileOtp = await this.otpService.generateOtp(
        initialSignupDto.mobileNumber,
        OTPType.SMS,
      );
      await this.smsService.sendOtp(initialSignupDto.mobileNumber, mobileOtp);

      return {
        message: 'Account created successfully. Please verify your mobile number.',
        mobileNumber: initialSignupDto.mobileNumber,
        requiresOtpVerification: true,
      };
    } catch (error) {
      this.logger.error(`Initial signup failed: ${error.message}`);
      throw new BadRequestException('Failed to create account');
    }
  }

  /**
   * Verifies OTP for signup flow and prepares for password setup
   * @param signupOtpVerificationDto - OTP verification data
   * @returns Promise with verification result and next step
   */
  async verifySignupOtp(signupOtpVerificationDto: SignupOtpVerificationDto): Promise<SignupOtpVerificationResponseDto> {
    try {
      const { mobileNumber, otpCode } = signupOtpVerificationDto;

      // Verify OTP
      const isValid = await this.otpService.verifyOtp(mobileNumber, OTPType.SMS, otpCode);
      if (!isValid) {
        throw new UnauthorizedException('Invalid OTP');
      }

      // Find user and mark mobile as verified
      const user = await this.usersService.findByMobileNumber(mobileNumber);
      if (!user) {
        throw new BadRequestException('User not found. Please complete initial signup first.');
      }

      // Mark mobile as verified
      await this.usersService.markMobileVerified(user.id);

      // Check if user can proceed to password setup
      if (user.status === UserStatus.PENDING && !user.passwordHash) {
        return {
          message: 'Mobile number verified successfully. Please set up your password.',
          userId: user.id,
          requiresPasswordSetup: true,
        };
      }

      throw new BadRequestException('Invalid user state for OTP verification');
    } catch (error) {
      this.logger.error(`Signup OTP verification failed: ${error.message}`);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify OTP');
    }
  }

  /**
   * Sets up password for user and prepares for email verification
   * @param signupPasswordSetupDto - Password setup data
   * @returns Promise with password setup result and next step
   */
  async setupSignupPassword(signupPasswordSetupDto: SignupPasswordSetupDto): Promise<SignupPasswordSetupResponseDto> {
    try {
      const { mobileNumber, password, confirmPassword } = signupPasswordSetupDto;

      // Validate password strength
      if (!this.validatePasswordStrength(password)) {
        throw new BadRequestException('Password does not meet strength requirements');
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Find user
      const user = await this.usersService.findByMobileNumber(mobileNumber);
      if (!user) {
        throw new BadRequestException('User not found. Please complete OTP verification first.');
      }

      // Check if user is in correct state
      if (user.status !== UserStatus.PENDING || user.passwordHash) {
        throw new BadRequestException('Invalid user state for password setup');
      }

      // Set password
      await this.usersService.setPassword(user.id, password);

      // Check if user can be activated (mobile verified + password set)
      if (user.isMobileVerified && !user.email) {
        // No email provided, activate account immediately
        await this.usersService.updateUserStatus(user.id, UserStatus.ACTIVE);
        
        // Generate tokens
        const tokens = await this.jwtTokenService.generateMobileTokens(user);
        
        return {
          message: 'Password set successfully. Account activated.',
          userId: user.id,
          requiresEmailVerification: false,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        };
      } else {
        // Email provided, requires email verification
        return {
          message: 'Password set successfully. Please verify your email to activate account.',
          userId: user.id,
          requiresEmailVerification: true,
        };
      }
    } catch (error) {
      this.logger.error(`Signup password setup failed: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to set password');
    }
  }

  /**
   * Adds email to user account and sends verification
   * @param signupEmailVerificationDto - Email verification data
   * @returns Promise with email verification result
   */
  async addSignupEmail(signupEmailVerificationDto: SignupEmailVerificationDto): Promise<SignupEmailVerificationResponseDto> {
    try {
      const { mobileNumber, email } = signupEmailVerificationDto;

      // Check if email is already used by another user
      const existingEmailUser = await this.usersService.findByEmail(email);
      if (existingEmailUser && existingEmailUser.id !== (await this.usersService.findByMobileNumber(mobileNumber))?.id) {
        throw new BadRequestException('This email is already registered with another account');
      }

      // Find user
      const user = await this.usersService.findByMobileNumber(mobileNumber);
      if (!user) {
        throw new BadRequestException('User not found. Please complete password setup first.');
      }

      // Check if user is in correct state
      if (user.status !== UserStatus.PENDING || !user.passwordHash) {
        throw new BadRequestException('Invalid user state for email verification');
      }

      // Add email to user
      await this.usersService.addEmail(user.id, email);

      // Send email verification
      const emailOtp = await this.otpService.generateOtp(email, OTPType.EMAIL);
      await this.emailService.sendOtp(email, emailOtp);

      return {
        message: 'Email added successfully. Please check your email for verification.',
        userId: user.id,
        accountActivated: false,
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
      };
    } catch (error) {
      this.logger.error(`Signup email addition failed: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to add email');
    }
  }

  /**
   * Verifies email for signup flow and activates account
   * @param emailVerificationDto - Email verification data
   * @returns Promise with verification result and activated account
   */
  async verifySignupEmail(emailVerificationDto: EmailVerificationDto): Promise<SignupEmailVerificationResponseDto> {
    try {
      const user = await this.usersService.verifyEmailWithToken(emailVerificationDto.token);
      
      // Check if user is in correct state
      if (user.status !== UserStatus.PENDING || !user.passwordHash) {
        throw new BadRequestException('Invalid user state for email verification');
      }

      // Mark email as verified
      await this.usersService.markEmailVerified(user.id);

      // Activate account
      await this.usersService.updateUserStatus(user.id, UserStatus.ACTIVE);

      // Generate tokens
      const tokens = await this.jwtTokenService.generateMobileTokens(user);

      this.errorHandler.logAuthAttempt('email_verification', user.id, true);

      return {
        message: 'Email verified successfully. Account activated.',
        userId: user.id,
        accountActivated: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      this.errorHandler.logAuthAttempt('email_verification', undefined, false, { token: emailVerificationDto.token });
      return this.errorHandler.handleAuthError(error, 'email_verification');
    }
  }


}
