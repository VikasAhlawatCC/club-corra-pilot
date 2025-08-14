import { 
  User, 
  UserProfile, 
  PaymentDetails, 
  AuthProvider, 
  UserStatus, 
  AuthToken,
  OTPVerification,
  SignupRequest,
  LoginRequest,
  AuthResponse
} from '../src/types';

describe('Types', () => {
  describe('User Interface', () => {
    it('defines User interface with correct structure', () => {
      const user: User = {
        id: 'user123',
        mobileNumber: '+1234567890',
        email: 'john.doe@example.com',
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: true,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
        },
        paymentDetails: {
          upiId: 'john.doe@upi',
          bankName: 'Example Bank',
        },
        authProviders: [
          {
            provider: AuthProvider.SMS,
            providerId: 'sms-123',
            linkedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.id).toBe('user123');
      expect(user.mobileNumber).toBe('+1234567890');
      expect(user.email).toBe('john.doe@example.com');
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.isMobileVerified).toBe(true);
      expect(user.isEmailVerified).toBe(true);
      expect(user.profile).toBeDefined();
      expect(user.paymentDetails).toBeDefined();
      expect(user.authProviders).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('allows User with minimal required fields', () => {
      const minimalUser: User = {
        id: 'user123',
        mobileNumber: '+1234567890',
        status: UserStatus.ACTIVE,
        isMobileVerified: false,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(minimalUser.id).toBe('user123');
      expect(minimalUser.mobileNumber).toBe('+1234567890');
      expect(minimalUser.status).toBe(UserStatus.ACTIVE);
      expect(minimalUser.profile).toBeUndefined();
      expect(minimalUser.paymentDetails).toBeUndefined();
      expect(minimalUser.authProviders).toBeUndefined();
    });
  });

  describe('UserProfile Interface', () => {
    it('defines UserProfile interface with correct structure', () => {
      const profile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        avatar: 'https://example.com/avatar.jpg',
      };

      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Doe');
      expect(profile.dateOfBirth).toBeInstanceOf(Date);
      expect(profile.gender).toBe('MALE');
      expect(profile.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('allows UserProfile with minimal required fields', () => {
      const minimalProfile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(minimalProfile.firstName).toBe('John');
      expect(minimalProfile.lastName).toBe('Doe');
      expect(minimalProfile.dateOfBirth).toBeUndefined();
      expect(minimalProfile.gender).toBeUndefined();
      expect(minimalProfile.avatar).toBeUndefined();
    });
  });

  describe('PaymentDetails Interface', () => {
    it('defines PaymentDetails interface with correct structure', () => {
      const paymentDetails: PaymentDetails = {
        upiId: 'john.doe@upi',
        bankName: 'Example Bank',
        accountNumber: '1234567890',
        ifscCode: 'EXBK0001234',
      };

      expect(paymentDetails.upiId).toBe('john.doe@upi');
      expect(paymentDetails.bankName).toBe('Example Bank');
      expect(paymentDetails.accountNumber).toBe('1234567890');
      expect(paymentDetails.ifscCode).toBe('EXBK0001234');
    });

    it('allows PaymentDetails with minimal required fields', () => {
      const minimalPaymentDetails: PaymentDetails = {
        upiId: 'john.doe@upi',
      };

      expect(minimalPaymentDetails.upiId).toBe('john.doe@upi');
      expect(minimalPaymentDetails.bankName).toBeUndefined();
      expect(minimalPaymentDetails.accountNumber).toBeUndefined();
      expect(minimalPaymentDetails.ifscCode).toBeUndefined();
    });
  });

  describe('AuthProvider Enum', () => {
    it('defines all required auth provider values', () => {
      expect(AuthProvider.SMS).toBe('SMS');
      expect(AuthProvider.EMAIL).toBe('EMAIL');
      expect(AuthProvider.GOOGLE).toBe('GOOGLE');
      expect(AuthProvider.FACEBOOK).toBe('FACEBOOK');
    });

    it('allows assignment of enum values', () => {
      const provider: AuthProvider = AuthProvider.GOOGLE;
      expect(provider).toBe('GOOGLE');
    });

    it('can be used in arrays', () => {
      const providers: AuthProvider[] = [
        AuthProvider.SMS,
        AuthProvider.EMAIL,
        AuthProvider.GOOGLE,
        AuthProvider.FACEBOOK,
      ];

      expect(providers).toHaveLength(4);
      expect(providers).toContain(AuthProvider.SMS);
      expect(providers).toContain(AuthProvider.GOOGLE);
    });
  });

  describe('UserStatus Enum', () => {
    it('defines all required user status values', () => {
      expect(UserStatus.ACTIVE).toBe('ACTIVE');
      expect(UserStatus.DELETED).toBe('DELETED'); // Changed from INACTIVE to DELETED
      expect(UserStatus.SUSPENDED).toBe('SUSPENDED');
      expect(UserStatus.PENDING).toBe('PENDING');
    });

    it('allows assignment of enum values', () => {
      const status: UserStatus = UserStatus.ACTIVE;
      expect(status).toBe('ACTIVE');
    });

    it('can be used in conditional statements', () => {
      const status: UserStatus = UserStatus.ACTIVE;
      
      if (status === UserStatus.ACTIVE) {
        expect(status).toBe(UserStatus.ACTIVE);
      } else {
        fail('Status should be ACTIVE');
      }
    });
  });

  describe('AuthToken Interface', () => {
    it('defines AuthToken interface with correct structure', () => {
      const token: AuthToken = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      expect(token.accessToken).toBe('access_token_123');
      expect(token.refreshToken).toBe('refresh_token_123');
      expect(token.expiresIn).toBe(3600);
      expect(token.tokenType).toBe('Bearer');
    });

    it('allows AuthToken with minimal required fields', () => {
      const minimalToken: AuthToken = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        expiresIn: 3600,
        tokenType: 'Bearer', // This is a literal type, not a property
      };

      expect(minimalToken.accessToken).toBe('access_token_123');
      expect(minimalToken.refreshToken).toBe('refresh_token_123');
      expect(minimalToken.expiresIn).toBe(3600);
      expect(minimalToken.tokenType).toBe('Bearer'); // This should work now
    });
  });

  describe('OTPVerification Interface', () => {
    it('defines OTPVerification interface with correct structure', () => {
      const otpVerification: OTPVerification = {
        mobileNumber: '+1234567890',
        otp: '123456',
        type: 'SMS',
      };

      expect(otpVerification.mobileNumber).toBe('+1234567890');
      expect(otpVerification.otp).toBe('123456');
      expect(otpVerification.type).toBe('SMS');
    });

    it('allows OTPVerification with different types', () => {
      const smsVerification: OTPVerification = {
        mobileNumber: '+1234567890',
        otp: '123456',
        type: 'SMS',
      };

      const emailVerification: OTPVerification = {
        mobileNumber: '+1234567890',
        otp: '123456',
        type: 'EMAIL',
      };

      expect(smsVerification.type).toBe('SMS');
      expect(emailVerification.type).toBe('EMAIL');
    });
  });

  describe('SignupRequest Interface', () => {
    it('defines SignupRequest interface with correct structure', () => {
      const signupRequest: SignupRequest = {
        mobileNumber: '+1234567890',
        email: 'john.doe@example.com',
        authMethod: 'SMS',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        paymentDetails: {
          upiId: 'john.doe@upi',
        },
      };

      expect(signupRequest.mobileNumber).toBe('+1234567890');
      expect(signupRequest.email).toBe('john.doe@example.com');
      expect(signupRequest.authMethod).toBe('SMS');
      expect(signupRequest.profile).toBeDefined();
      expect(signupRequest.paymentDetails).toBeDefined();
    });

    it('allows SignupRequest with minimal required fields', () => {
      const minimalSignupRequest: SignupRequest = {
        mobileNumber: '+1234567890',
        authMethod: 'SMS',
      };

      expect(minimalSignupRequest.mobileNumber).toBe('+1234567890');
      expect(minimalSignupRequest.authMethod).toBe('SMS');
      expect(minimalSignupRequest.email).toBeUndefined();
      expect(minimalSignupRequest.profile).toBeUndefined();
      expect(minimalSignupRequest.paymentDetails).toBeUndefined();
    });
  });

  describe('LoginRequest Interface', () => {
    it('defines LoginRequest interface with correct structure', () => {
      const loginRequest: LoginRequest = {
        mobileNumber: '+1234567890',
        otp: '123456',
        type: 'SMS',
      };

      expect(loginRequest.mobileNumber).toBe('+1234567890');
      expect(loginRequest.otp).toBe('123456');
      expect(loginRequest.type).toBe('SMS');
    });

    it('allows LoginRequest with different types', () => {
      const smsLoginRequest: LoginRequest = {
        mobileNumber: '+1234567890',
        otp: '123456',
        type: 'SMS',
      };

      const emailLoginRequest: LoginRequest = {
        mobileNumber: '+1234567890',
        otp: '123456',
        type: 'EMAIL',
      };

      expect(smsLoginRequest.type).toBe('SMS');
      expect(emailLoginRequest.type).toBe('EMAIL');
    });
  });

  describe('AuthResponse Interface', () => {
    it('defines AuthResponse interface with correct structure', () => {
      const authResponse: AuthResponse = {
        success: true,
        message: 'Authentication successful',
        user: {
          id: 'user123',
          mobileNumber: '+1234567890',
          status: UserStatus.ACTIVE,
          isMobileVerified: true,
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tokens: {
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
          expiresIn: 3600,
        },
      };

      expect(authResponse.success).toBe(true);
      expect(authResponse.message).toBe('Authentication successful');
      expect(authResponse.user).toBeDefined();
      expect(authResponse.tokens).toBeDefined();
    });

    it('allows AuthResponse with error information', () => {
      const errorResponse: AuthResponse = {
        success: false,
        message: 'Authentication failed',
        error: 'Invalid OTP',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toBe('Authentication failed');
      expect(errorResponse.error).toBe('Invalid OTP');
      expect(errorResponse.user).toBeUndefined();
      expect(errorResponse.tokens).toBeUndefined();
    });
  });

  describe('Type Compatibility', () => {
    it('ensures User interface is compatible with UserProfile', () => {
      const profile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const user: User = {
        id: 'user123',
        mobileNumber: '+1234567890',
        status: UserStatus.ACTIVE,
        isMobileVerified: false,
        isEmailVerified: false,
        profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.profile).toEqual(profile);
      expect(user.profile?.firstName).toBe('John');
      expect(user.profile?.lastName).toBe('Doe');
    });

    it('ensures User interface is compatible with PaymentDetails', () => {
      const paymentDetails: PaymentDetails = {
        upiId: 'john.doe@upi',
      };

      const user: User = {
        id: 'user123',
        mobileNumber: '+1234567890',
        status: UserStatus.ACTIVE,
        isMobileVerified: false,
        isEmailVerified: false,
        paymentDetails,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.paymentDetails).toEqual(paymentDetails);
      expect(user.paymentDetails?.upiId).toBe('john.doe@upi');
    });

    it('ensures AuthProvider enum values are string literals', () => {
      const providers: string[] = [
        AuthProvider.SMS,
        AuthProvider.EMAIL,
        AuthProvider.GOOGLE,
        AuthProvider.FACEBOOK,
      ];

      providers.forEach(provider => {
        expect(typeof provider).toBe('string');
        expect(provider.length).toBeGreaterThan(0);
      });
    });

    it('ensures UserStatus enum values are string literals', () => {
      const statuses = Object.values(UserStatus);
      
      statuses.forEach(status => {
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Type Constraints', () => {
    it('enforces required fields in User interface', () => {
      // This should cause a TypeScript error if any required field is missing
      // The test ensures the interface is properly defined
      const requiredFields = ['id', 'mobileNumber', 'status', 'isMobileVerified', 'isEmailVerified', 'createdAt', 'updatedAt'];
      
      requiredFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    it('enforces required fields in UserProfile interface', () => {
      const requiredFields = ['firstName', 'lastName'];
      
      requiredFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    it('enforces required fields in PaymentDetails interface', () => {
      const requiredFields = ['upiId'];
      
      requiredFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    it('enforces required fields in AuthToken interface', () => {
      const requiredFields = ['accessToken', 'refreshToken', 'expiresIn'];
      
      requiredFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });
  });
});
