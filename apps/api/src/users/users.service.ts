import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { UserProfile, Gender } from './entities/user-profile.entity';
import { PaymentDetails } from './entities/payment-details.entity';
import { AuthProvider, ProviderType } from './entities/auth-provider.entity';
import { SignupDto, OAuthSignupDto } from '../auth/dto/signup.dto';
import { CoinsService } from '../coins/coins.service';
import { AUTH_CONSTANTS } from '../common/constants/auth.constants';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(PaymentDetails)
    private paymentDetailsRepository: Repository<PaymentDetails>,
    @InjectRepository(AuthProvider)
    private authProviderRepository: Repository<AuthProvider>,
    private coinsService: CoinsService,
  ) {}

  async createUser(signupDto: SignupDto): Promise<User> {
    // Check if mobile number already exists
    const existingUser = await this.userRepository.findOne({
      where: { mobileNumber: signupDto.mobileNumber },
    });

    if (existingUser) {
      throw new ConflictException('Mobile number already registered');
    }

    // Check if email already exists (if provided)
    if (signupDto.email) {
      const existingEmailUser = await this.userRepository.findOne({
        where: { email: signupDto.email },
      });

      if (existingEmailUser) {
        throw new ConflictException('Email already registered');
      }
    }

    // Create user
    const user = this.userRepository.create({
      mobileNumber: signupDto.mobileNumber,
      email: signupDto.email,
      status: UserStatus.PENDING,
      isMobileVerified: false,
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile
    const profile = this.userProfileRepository.create({
      firstName: signupDto.firstName,
      lastName: signupDto.lastName,
      dateOfBirth: signupDto.dateOfBirth ? new Date(signupDto.dateOfBirth) : null,
      gender: signupDto.gender ? this.mapGenderStringToEnum(signupDto.gender) : null,
      userId: savedUser.id,
    });

    await this.userProfileRepository.save(profile);

    // Create payment details (empty)
    const paymentDetails = this.paymentDetailsRepository.create({
      userId: savedUser.id,
    });

    await this.paymentDetailsRepository.save(paymentDetails);

    // Create auth provider record if authProvider is specified
    if (signupDto.authProvider) {
      const authProvider = this.authProviderRepository.create({
        provider: signupDto.authProvider,
        providerUserId: `local_${savedUser.id}`, // Generate unique ID for local users
        accessToken: null, // No access token for regular signup
        providerData: null, // No provider data for regular signup
        userId: savedUser.id,
      });

      await this.authProviderRepository.save(authProvider);
    }

    // Create welcome bonus for new user
    try {
      await this.coinsService.createWelcomeBonus({
        userId: savedUser.id,
        mobileNumber: savedUser.mobileNumber,
      });
      this.logger.log(`Welcome bonus created successfully for user ${savedUser.id}`);
    } catch (error) {
      // Log error but don't fail user creation for pilot
      // In production, consider implementing retry logic or failing user creation
      this.logger.error(`Failed to create welcome bonus for user ${savedUser.id}:`, error);
      
      // For pilot: continue with user creation but mark for manual review
      // In production: implement proper retry mechanism or fail gracefully
    }

    // Reload user with relations
    return this.findById(savedUser.id);
  }

  async createOAuthUser(oauthSignupDto: OAuthSignupDto, oauthData: any): Promise<User> {
    // Check if mobile number already exists
    const existingUser = await this.userRepository.findOne({
      where: { mobileNumber: oauthSignupDto.mobileNumber },
    });

    if (existingUser) {
      throw new ConflictException('Mobile number already registered');
    }

    // Create user
    const user = this.userRepository.create({
      mobileNumber: oauthSignupDto.mobileNumber,
      email: oauthData.email,
      status: UserStatus.ACTIVE,
      isMobileVerified: false,
      isEmailVerified: true, // OAuth email is pre-verified
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile
    // Extract name from OAuth data if available
    const oauthName = oauthData.name || '';
    const [firstName, ...lastNameParts] = oauthName.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const profile = this.userProfileRepository.create({
      firstName: oauthSignupDto.firstName || firstName || 'User',
      lastName: oauthSignupDto.lastName || lastName || 'User',
      dateOfBirth: oauthSignupDto.dateOfBirth ? new Date(oauthSignupDto.dateOfBirth) : null,
      gender: oauthSignupDto.gender ? this.mapGenderStringToEnum(oauthSignupDto.gender) : null,
      userId: savedUser.id,
    });

    await this.userProfileRepository.save(profile);

    // Create payment details (empty)
    const paymentDetails = this.paymentDetailsRepository.create({
      userId: savedUser.id,
    });

    await this.paymentDetailsRepository.save(paymentDetails);

    // Create auth provider record
    const authProvider = this.authProviderRepository.create({
      provider: oauthSignupDto.oauthProvider,
      providerUserId: oauthData.id,
      accessToken: oauthSignupDto.oauthToken,
      providerData: oauthData,
      userId: savedUser.id,
    });

    await this.authProviderRepository.save(authProvider);

    // Create welcome bonus for new OAuth user
    try {
      await this.coinsService.createWelcomeBonus({
        userId: savedUser.id,
        mobileNumber: savedUser.mobileNumber,
      });
      this.logger.log(`Welcome bonus created successfully for OAuth user ${savedUser.id}`);
    } catch (error) {
      // Log error but don't fail user creation for pilot
      // In production, consider implementing retry logic or failing user creation
      this.logger.error(`Failed to create welcome bonus for OAuth user ${savedUser.id}:`, error);
      
      // For pilot: continue with user creation but mark for manual review
      // In production: implement proper retry mechanism or fail gracefully
    }

    // Reload user with relations
    return this.findById(savedUser.id);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'paymentDetails', 'authProviders'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private mapGenderStringToEnum(genderString: string): Gender {
    const genderMap: { [key: string]: Gender } = {
      'male': Gender.MALE,
      'female': Gender.FEMALE,
      'other': Gender.OTHER,
      'prefer_not_to_say': Gender.PREFER_NOT_TO_SAY,
    };
    
    return genderMap[genderString.toLowerCase()] || Gender.PREFER_NOT_TO_SAY;
  }

  async findByMobileNumber(mobileNumber: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { mobileNumber },
      relations: ['profile', 'paymentDetails', 'authProviders'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['profile', 'paymentDetails', 'authProviders'],
    });
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    return this.userRepository.save(user);
  }

  async markMobileVerified(id: string): Promise<void> {
    await this.userRepository.update(id, { isMobileVerified: true });
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.userRepository.update(id, { isEmailVerified: true });
  }

  async updateProfile(id: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const user = await this.findById(id);
    
    if (!user.profile) {
      throw new NotFoundException('User profile not found');
    }

    Object.assign(user.profile, profileData);
    return this.userProfileRepository.save(user.profile);
  }

  async updatePaymentDetails(id: string, paymentData: Partial<PaymentDetails>): Promise<PaymentDetails> {
    const user = await this.findById(id);
    
    if (!user.paymentDetails) {
      throw new NotFoundException('User payment details not found');
    }

    Object.assign(user.paymentDetails, paymentData);
    return this.paymentDetailsRepository.save(user.paymentDetails);
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(id, { refreshTokenHash: hashedToken });
  }

  async validateRefreshToken(id: string, refreshToken: string): Promise<boolean> {
    const user = await this.findById(id);
    
    if (!user.refreshTokenHash) {
      return false;
    }

    return bcrypt.compare(refreshToken, user.refreshTokenHash);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async findByOAuthProvider(provider: ProviderType, providerUserId: string): Promise<AuthProvider | null> {
    return this.authProviderRepository.findOne({
      where: { provider, providerUserId, isActive: true },
    });
  }

  // Password management methods
  /**
   * Sets a password for a user with bcrypt hashing
   * @param userId - The user's ID
   * @param password - The plain text password to hash and store
   */
  async setPassword(userId: string, password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, AUTH_CONSTANTS.PASSWORD.SALT_ROUNDS);
    await this.userRepository.update(userId, { passwordHash: hashedPassword });
  }

  /**
   * Validates a user's password against the stored hash
   * @param userId - The user's ID
   * @param password - The plain text password to validate
   * @returns Promise<boolean> - True if password matches, false otherwise
   */
  async validatePassword(userId: string, password: string): Promise<boolean> {
    const user = await this.findById(userId);
    
    if (!user.passwordHash) {
      return false;
    }

    return bcrypt.compare(password, user.passwordHash);
  }

  // Email verification methods
  /**
   * Generates a secure email verification token for a user
   * @param userId - The user's ID
   * @returns Promise<string> - The generated verification token
   */
  async generateEmailVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + AUTH_CONSTANTS.TOKEN_EXPIRY.EMAIL_VERIFICATION); // 24 hours expiry

    await this.userRepository.update(userId, {
      emailVerificationToken: token,
      emailVerificationExpiresAt: expiresAt,
    });

    return token;
  }

  /**
   * Verifies an email using a verification token
   * @param token - The email verification token
   * @returns Promise<User> - The updated user object
   * @throws BadRequestException if token is invalid or expired
   */
  async verifyEmailWithToken(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark email as verified and clear token
    await this.userRepository.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    });

    // Check if user can be activated
    if (user.isMobileVerified) {
      await this.updateUserStatus(user.id, UserStatus.ACTIVE);
    }

    return this.findById(user.id);
  }

  // Password reset methods
  /**
   * Requests a password reset for a user by email
   * @param email - The user's email address
   * @returns Promise<string> - Success message (doesn't reveal if email exists)
   */
  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return 'Password reset email sent if account exists';
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + AUTH_CONSTANTS.TOKEN_EXPIRY.PASSWORD_RESET); // 1 hour expiry

    await this.userRepository.update(user.id, {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    });

    return token;
  }

  /**
   * Resets a user's password using a reset token
   * @param token - The password reset token
   * @param newPassword - The new plain text password
   * @throws BadRequestException if token is invalid or expired
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, AUTH_CONSTANTS.PASSWORD.SALT_ROUNDS);

    await this.userRepository.update(user.id, {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }

  // Utility method to check if user has password
  /**
   * Checks if a user has a password set
   * @param userId - The user's ID
   * @returns Promise<boolean> - True if user has password, false otherwise
   */
  async hasPassword(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    return !!user.passwordHash;
  }

  /**
   * Creates a minimal user with just mobile number for OTP verification flow
   * This is used when a user verifies OTP but doesn't exist in the system yet
   * @param mobileNumber - The user's mobile number
   * @returns Promise<User> - The created user object
   */
  async createMinimalUser(mobileNumber: string): Promise<User> {
    // Check if mobile number already exists
    const existingUser = await this.userRepository.findOne({
      where: { mobileNumber },
    });

    if (existingUser) {
      throw new ConflictException('Mobile number already registered');
    }

    // Create minimal user
    const user = this.userRepository.create({
      mobileNumber,
      status: UserStatus.PENDING,
      isMobileVerified: false,
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Create empty user profile
    const profile = this.userProfileRepository.create({
      userId: savedUser.id,
    });

    await this.userProfileRepository.save(profile);

    // Create empty payment details
    const paymentDetails = this.paymentDetailsRepository.create({
      userId: savedUser.id,
    });

    await this.paymentDetailsRepository.save(paymentDetails);

    // Create welcome bonus for new user
    try {
      await this.coinsService.createWelcomeBonus({
        userId: savedUser.id,
        mobileNumber: savedUser.mobileNumber,
      });
      this.logger.log(`Welcome bonus created successfully for minimal user ${savedUser.id}`);
    } catch (error) {
      // Log error but don't fail user creation for pilot
      this.logger.error(`Failed to create welcome bonus for minimal user ${savedUser.id}:`, error);
    }

    // Reload user with relations
    return this.findById(savedUser.id);
  }

  /**
   * Creates an initial user for the new signup flow
   * @param initialSignupDto - User's basic information
   * @returns Promise<User> - The created user object
   */
  async createInitialUser(initialSignupDto: { firstName: string; lastName: string; mobileNumber: string }): Promise<User> {
    // Check if mobile number already exists
    const existingUser = await this.userRepository.findOne({
      where: { mobileNumber: initialSignupDto.mobileNumber },
    });

    if (existingUser) {
      throw new ConflictException('Mobile number already registered');
    }

    // Create user with PENDING status
    const user = this.userRepository.create({
      mobileNumber: initialSignupDto.mobileNumber,
      status: UserStatus.PENDING,
      isMobileVerified: false,
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile
    const profile = this.userProfileRepository.create({
      firstName: initialSignupDto.firstName,
      lastName: initialSignupDto.lastName,
      userId: savedUser.id,
    });

    await this.userProfileRepository.save(profile);

    // Create empty payment details
    const paymentDetails = this.paymentDetailsRepository.create({
      userId: savedUser.id,
    });

    await this.paymentDetailsRepository.save(paymentDetails);

    // Create welcome bonus for new user
    try {
      await this.coinsService.createWelcomeBonus({
        userId: savedUser.id,
        mobileNumber: savedUser.mobileNumber,
      });
      this.logger.log(`Welcome bonus created successfully for initial user ${savedUser.id}`);
    } catch (error) {
      // Log error but don't fail user creation for pilot
      this.logger.error(`Failed to create welcome bonus for initial user ${savedUser.id}:`, error);
    }

    // Reload user with relations
    return this.findById(savedUser.id);
  }

  /**
   * Adds email to an existing user account
   * @param userId - The user's ID
   * @param email - The email to add
   * @returns Promise<void>
   */
  async addEmail(userId: string, email: string): Promise<void> {
    // Check if email is already used by another user
    const existingEmailUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingEmailUser && existingEmailUser.id !== userId) {
      throw new ConflictException('Email already registered with another account');
    }

    // Update user with email
    await this.userRepository.update(userId, { email });
  }
}
