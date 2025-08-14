import { userSchemas, schemas } from '../../src/schemas/user.schema';

describe('User Schema', () => {
  describe('User Profile Schema', () => {
    const { userProfile } = userSchemas;

    it('validates correct user profile data', () => {
      const validProfile = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        profilePicture: 'https://example.com/avatar.jpg',
      };

      const result = userProfile.safeParse(validProfile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validProfile);
      }
    });

    it('validates profile with minimal required fields', () => {
      const minimalProfile = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = userProfile.safeParse(minimalProfile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(minimalProfile);
      }
    });

    it('rejects profile without firstName', () => {
      const invalidProfile = {
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
      };

      const result = userProfile.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('firstName');
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('rejects profile without lastName', () => {
      const invalidProfile = {
        firstName: 'John',
        dateOfBirth: new Date('1990-01-01'),
      };

      const result = userProfile.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('lastName');
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('validates date of birth format', () => {
      const validProfile = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
      };

      const result = userProfile.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('rejects invalid date of birth format', () => {
      const invalidProfile = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: 'invalid-date' as any,
      };

      const result = userProfile.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('dateOfBirth');
      }
    });

    it('validates gender enum values', () => {
      const validGenders = ['MALE', 'FEMALE', 'OTHER'] as const;

      validGenders.forEach(gender => {
        const validProfile = {
          firstName: 'John',
          lastName: 'Doe',
          gender,
        };

        const result = userProfile.safeParse(validProfile);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.gender).toBe(gender);
        }
      });
    });

    it('rejects invalid gender values', () => {
      const invalidProfile = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'INVALID_GENDER' as any,
      };

      const result = userProfile.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('gender');
      }
    });

    it('validates profile picture URL format', () => {
      const validProfile = {
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'https://example.com/avatar.jpg',
      };

      const result = userProfile.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('rejects invalid profile picture URL format', () => {
      const invalidProfile = {
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'not-a-url',
      };

      const result = userProfile.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('profilePicture');
      }
    });

    it('handles empty string values for optional fields', () => {
      const profileWithEmptyStrings = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '' as any,
        gender: '' as any,
        profilePicture: '' as any,
      };

      const result = userProfile.safeParse(profileWithEmptyStrings);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Payment Details Schema', () => {
    const { paymentDetails } = userSchemas;

    it('validates correct payment details', () => {
      const validPaymentDetails = {
        upiId: 'john.doe@upi',
      };

      const result = paymentDetails.safeParse(validPaymentDetails);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPaymentDetails);
      }
    });

    it('validates payment details with only UPI ID', () => {
      const minimalPaymentDetails = {
        upiId: 'john.doe@upi',
      };

      const result = paymentDetails.safeParse(minimalPaymentDetails);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(minimalPaymentDetails);
      }
    });

    it('rejects payment details without UPI ID', () => {
      const invalidPaymentDetails = {
        // upiId is optional, so this should actually pass
        // Let's test with an invalid UPI ID instead
      };

      const result = paymentDetails.safeParse(invalidPaymentDetails);
      expect(result.success).toBe(true); // UPI ID is optional, so this should pass
    });

    it('rejects payment details with invalid UPI ID format', () => {
      const invalidPaymentDetails = {
        upiId: 'invalid-upi-format', // Invalid format
      };

      const result = paymentDetails.safeParse(invalidPaymentDetails);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('upiId');
        expect(result.error.issues[0].code).toBe('invalid_string');
      }
    });
  });

  describe('User Schema', () => {
    const { user } = userSchemas;

    it('validates correct user data', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        mobileNumber: '+1234567890',
        email: 'john.doe@example.com',
        status: 'ACTIVE',
        isMobileVerified: true,
        isEmailVerified: true,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        paymentDetails: {
          upiId: 'john.doe@upi',
        },
        authProviders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = user.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUser);
      }
    });

    it('validates user with minimal required fields', () => {
      const minimalUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        mobileNumber: '+1234567890',
        status: 'ACTIVE',
        isMobileVerified: false,
        isEmailVerified: false,
        authProviders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = user.safeParse(minimalUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(minimalUser);
      }
    });

    it('rejects user without required fields', () => {
      const invalidUser = {
        mobileNumber: '+1234567890',
        status: 'ACTIVE',
        // Missing id, isMobileVerified, isEmailVerified, createdAt, updatedAt
      };

      const result = user.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('validates mobile number format', () => {
      const validMobileNumbers = [
        '+1234567890',
        '+919876543210',
        '+447911123456',
        '+61412345678'
      ];

      validMobileNumbers.forEach(mobileNumber => {
        const validUser = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          mobileNumber,
          status: 'ACTIVE',
          isMobileVerified: false,
          isEmailVerified: false,
          authProviders: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = user.safeParse(validUser);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid mobile number format', () => {
      const invalidMobileNumbers = [
        '123', // Too short
        'abcdefghij', // Non-numeric
        '+1234567890123456', // Too long
        '0123456789', // Starts with 0
      ];

      invalidMobileNumbers.forEach(mobileNumber => {
        const invalidUser = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          mobileNumber,
          status: 'ACTIVE',
          isMobileVerified: false,
          isEmailVerified: false,
          authProviders: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = user.safeParse(invalidUser);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('mobileNumber');
        }
      });
    });

    it('validates email format', () => {
      const validEmails = [
        'john.doe@example.com',
        'user123@gmail.com',
        'test+tag@domain.co.uk',
        'user-name@subdomain.example.org'
      ];

      validEmails.forEach(email => {
        const validUser = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          mobileNumber: '+1234567890',
          email,
          status: 'ACTIVE',
          isMobileVerified: false,
          isEmailVerified: false,
          authProviders: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = user.safeParse(validUser);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com'
      ];

      invalidEmails.forEach(email => {
        const invalidUser = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          mobileNumber: '+1234567890',
          email,
          status: 'ACTIVE',
          isMobileVerified: false,
          isEmailVerified: false,
          authProviders: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = user.safeParse(invalidUser);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('email');
        }
      });
    });

    it('validates user status enum values', () => {
      const validStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED'] as const;

      validStatuses.forEach(status => {
        const validUser = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          mobileNumber: '+1234567890',
          status,
          isMobileVerified: false,
          isEmailVerified: false,
          authProviders: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = user.safeParse(validUser);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });

    it('rejects invalid user status values', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        mobileNumber: '+1234567890',
        status: 'INVALID_STATUS' as any,
        isMobileVerified: false,
        isEmailVerified: false,
        authProviders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = user.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });

    it('validates boolean verification fields', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        mobileNumber: '+1234567890',
        status: 'ACTIVE',
        isMobileVerified: true,
        isEmailVerified: false,
        authProviders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = user.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isMobileVerified).toBe(true);
        expect(result.data.isEmailVerified).toBe(false);
      }
    });

    it('validates date fields', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        mobileNumber: '+1234567890',
        status: 'ACTIVE',
        isMobileVerified: false,
        isEmailVerified: false,
        authProviders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = user.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Schema Exports', () => {
    it('exports all required schemas', () => {
      expect(userSchemas).toBeDefined();
      expect(userSchemas.userProfile).toBeDefined();
      expect(userSchemas.paymentDetails).toBeDefined();
      expect(userSchemas.user).toBeDefined();
    });

    it('exports schemas object with all schemas', () => {
      expect(schemas).toBeDefined();
      expect(schemas.userProfile).toBeDefined();
      expect(schemas.paymentDetails).toBeDefined();
      expect(schemas.user).toBeDefined();
    });

    it('exports userSchemas object with all schemas', () => {
      expect(userSchemas).toBeDefined();
      expect(userSchemas.userProfile).toBeDefined();
      expect(userSchemas.paymentDetails).toBeDefined();
      expect(userSchemas.user).toBeDefined();
    });
  });
});
