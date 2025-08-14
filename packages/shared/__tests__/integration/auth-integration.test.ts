import { authSchemas, userSchemas } from '../../src/schemas';

describe('Auth Integration Tests', () => {
  describe('Cross-Platform Schema Validation', () => {
    describe('Signup Flow Validation', () => {
      it('should validate complete signup data across platforms', () => {
        const completeSignupData = {
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          upiId: 'john.doe@upi',
        };

        // Test signup schema
        const signupResult = authSchemas.signupSchema.safeParse(completeSignupData);
        expect(signupResult.success).toBe(true);

        // Test user profile schema
        const profileResult = userSchemas.userProfile.safeParse({
          firstName: completeSignupData.firstName,
          lastName: completeSignupData.lastName,
          dateOfBirth: new Date(completeSignupData.dateOfBirth),
        });
        expect(profileResult.success).toBe(true);

        // Test payment details schema
        const paymentResult = userSchemas.paymentDetails.safeParse({
          upiId: completeSignupData.upiId,
        });
        expect(paymentResult.success).toBe(true);
      });

      it('should validate minimal signup data across platforms', () => {
        const minimalSignupData = {
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        };

        // Test signup schema
        const signupResult = authSchemas.signupSchema.safeParse(minimalSignupData);
        expect(signupResult.success).toBe(true);

        // Test user profile schema
        const profileResult = userSchemas.userProfile.safeParse({
          firstName: minimalSignupData.firstName,
          lastName: minimalSignupData.lastName,
        });
        expect(profileResult.success).toBe(true);
      });

      it('should reject invalid data consistently across platforms', () => {
        const invalidSignupData = {
          mobileNumber: 'invalid',
          email: 'invalid-email',
          firstName: '',
          lastName: '',
        };

        // Test signup schema
        const signupResult = authSchemas.signupSchema.safeParse(invalidSignupData);
        expect(signupResult.success).toBe(false);

        if (!signupResult.success) {
          const errorMessages = signupResult.error.issues.map(issue => issue.message);
          expect(errorMessages).toContain('Invalid mobile number format');
          expect(errorMessages).toContain('Invalid email format');
          expect(errorMessages).toContain('First name is required');
          expect(errorMessages).toContain('Last name is required');
        }
      });
    });

    describe('Login Flow Validation', () => {
      it('should validate login data consistently', () => {
        const validLoginData = {
          mobileNumber: '+919876543210',
          otp: '123456',
        };

        const result = authSchemas.loginSchema.safeParse(validLoginData);
        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.mobileNumber).toBe(validLoginData.mobileNumber);
          expect(result.data.otp).toBe(validLoginData.otp);
        }
      });

      it('should reject invalid login data consistently', () => {
        const invalidLoginData = {
          mobileNumber: '9876543210', // Missing country code
          otp: '123456', // 6 digits
        };

        const result = authSchemas.loginSchema.safeParse(invalidLoginData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const errorMessages = result.error.issues.map(issue => issue.message);
          expect(errorMessages).toContain('OTP must be exactly 6 digits');
          expect(errorMessages).toContain('OTP must contain only numbers');
        }
      });
    });

    describe('OTP Verification Flow Validation', () => {
      it('should validate SMS OTP verification consistently', () => {
        const smsOtpData = {
          mobileNumber: '+919876543210',
          otp: '123456',
          type: 'SMS',
        };

        const result = authSchemas.otpVerificationSchema.safeParse(smsOtpData);
        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.type).toBe('SMS');
          expect(result.data.mobileNumber).toBe(smsOtpData.mobileNumber);
          expect(result.data.email).toBeUndefined();
        }
      });

      it('should validate email OTP verification consistently', () => {
        const emailOtpData = {
          email: 'test@example.com',
          otp: '123456',
          type: 'EMAIL',
        };

        const result = authSchemas.otpVerificationSchema.safeParse(emailOtpData);
        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.type).toBe('EMAIL');
          expect(result.data.email).toBe(emailOtpData.email);
          expect(result.data.mobileNumber).toBeUndefined();
        }
      });

      it('should reject mixed OTP verification data consistently', () => {
        const mixedOtpData = {
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          otp: '123456',
          type: 'SMS',
        };

        const result = authSchemas.otpVerificationSchema.safeParse(mixedOtpData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const errorMessages = result.error.issues.map(issue => issue.message);
          expect(errorMessages).toContain('Either mobileNumber or email must be provided, not both');
        }
      });
    });
  });

  describe('Data Type Consistency', () => {
    it('should maintain consistent data types across schemas', () => {
      const testData = {
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        upiId: 'john.doe@upi',
      };

      // Parse through signup schema
      const signupResult = authSchemas.signupSchema.safeParse(testData);
      expect(signupResult.success).toBe(true);

      if (signupResult.success) {
        // Verify data types are preserved
        expect(typeof signupResult.data.mobileNumber).toBe('string');
        expect(typeof signupResult.data.email).toBe('string');
        expect(typeof signupResult.data.firstName).toBe('string');
        expect(typeof signupResult.data.lastName).toBe('string');
        expect(typeof signupResult.data.dateOfBirth).toBe('string');
        expect(typeof signupResult.data.upiId).toBe('string');

        // Verify values are preserved
        expect(signupResult.data.mobileNumber).toBe(testData.mobileNumber);
        expect(signupResult.data.email).toBe(testData.email);
        expect(signupResult.data.firstName).toBe(testData.firstName);
        expect(signupResult.data.lastName).toBe(testData.lastName);
        expect(signupResult.data.dateOfBirth).toBe(testData.dateOfBirth);
        expect(signupResult.data.upiId).toBe(testData.upiId);
      }
    });

    it('should handle optional fields correctly', () => {
      const minimalData = {
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = authSchemas.signupSchema.safeParse(minimalData);
      expect(result.success).toBe(true);

      if (result.success) {
        // Required fields should be present
        expect(result.data.mobileNumber).toBeDefined();
        expect(result.data.email).toBeDefined();
        expect(result.data.firstName).toBeDefined();
        expect(result.data.lastName).toBeDefined();

        // Optional fields should be undefined
        expect(result.data.dateOfBirth).toBeUndefined();
        expect(result.data.upiId).toBeUndefined();
      }
    });
  });

  describe('Error Message Consistency', () => {
    it('should provide consistent error messages for validation failures', () => {
      const invalidData = {
        mobileNumber: 'invalid',
        email: 'invalid-email',
        firstName: '',
        lastName: '',
      };

      const result = authSchemas.signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessages = result.error.issues.map(issue => issue.message);
        
        // Check for specific error messages
        expect(errorMessages).toContain('Invalid mobile number format');
        expect(errorMessages).toContain('Invalid email format');
        expect(errorMessages).toContain('First name is required');
        expect(errorMessages).toContain('Last name is required');
        
        // Verify error count matches expected validation failures
        expect(result.error.issues).toHaveLength(4);
      }
    });

    it('should provide helpful error messages for OTP validation', () => {
      const invalidOtpData = {
        mobileNumber: '+919876543210',
        otp: 'abc',
      };

      const result = authSchemas.loginSchema.safeParse(invalidOtpData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessages = result.error.issues.map(issue => issue.message);
        expect(errorMessages).toContain('OTP must contain only numbers');
        expect(errorMessages).toContain('OTP must be exactly 6 digits');
      }
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work with different date formats', () => {
      const dateFormats = [
        '1990-01-01',
        '1990-1-1',
        '1990-12-31',
      ];

      dateFormats.forEach(dateFormat => {
        const testData = {
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: dateFormat,
        };

        const result = authSchemas.signupSchema.safeParse(testData);
        expect(result.success).toBe(true);
      });
    });

    it('should handle international phone number formats', () => {
      const phoneFormats = [
        '+919876543210', // India
        '+1234567890',   // US
        '+447911123456', // UK
        '+61412345678',  // Australia
      ];

      phoneFormats.forEach(phoneFormat => {
        const testData = {
          mobileNumber: phoneFormat,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        };

        const result = authSchemas.signupSchema.safeParse(testData);
        expect(result.success).toBe(true);
      });
    });

    it('should validate UPI ID formats correctly', () => {
      const validUpiIds = [
        'john.doe@upi',
        'user123@okicici',
        'test@paytm',
        'user@googlepay',
      ];

      validUpiIds.forEach(upiId => {
        const testData = {
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          upiId,
        };

        const result = authSchemas.signupSchema.safeParse(testData);
        expect(result.success).toBe(true);
      });

      const invalidUpiIds = [
        'invalid-upi',
        'user@',
        '@upi',
        'upi',
      ];

      invalidUpiIds.forEach(upiId => {
        const testData = {
          mobileNumber: '+919876543210',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          upiId,
        };

        const result = authSchemas.signupSchema.safeParse(testData);
        expect(result.success).toBe(false);
      });
    });
  });
});
