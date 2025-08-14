import { 
  mobileLoginSchema, 
  verifyOtpSchema
} from '../../src/schemas/auth.schema';

describe('Auth Schemas', () => {
  describe('mobileLoginSchema', () => {
    it('should validate valid mobile login data', () => {
      const validData = {
        mobileNumber: '+919876543210',
        otpCode: '123456',
      };

      const result = mobileLoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid mobile number format', () => {
      const invalidData = {
        mobileNumber: 'abc', // Invalid format
        otpCode: '123456',
      };

      const result = mobileLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Mobile number must be at least 10 digits');
      }
    });

    it('should reject invalid OTP format', () => {
      const invalidData = {
        mobileNumber: '+919876543210',
        otpCode: '12345', // 5 digits - should be rejected
      };

      const result = mobileLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('OTP must be exactly 6 digits');
      }
    });

    it('should reject non-numeric OTP', () => {
      const invalidData = {
        mobileNumber: '+919876543210',
        otpCode: 'abcdef',
      };

      const result = mobileLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('OTP must contain only 6 digits');
      }
    });
  });

  describe('verifyOtpSchema', () => {
    it('should validate SMS OTP verification data', () => {
      const validData = {
        mobileNumber: '+919876543210',
        code: '123456',
        type: 'SMS',
      };

      const result = verifyOtpSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate email OTP verification data', () => {
      const validData = {
        email: 'test@example.com',
        code: '123456',
        type: 'EMAIL',
      };

      const result = verifyOtpSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject verification data with both mobile and email', () => {
      const invalidData = {
        mobileNumber: '+919876543210',
        email: 'test@example.com',
        code: '123456',
        type: 'SMS',
      };

      const result = verifyOtpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Either mobileNumber or email must be provided, not both');
      }
    });

    it('should reject verification data without mobile or email', () => {
      const invalidData = {
        code: '123456',
        type: 'SMS',
      };

      const result = verifyOtpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Mobile number is required for SMS OTP verification, email is required for email OTP verification');
      }
    });

    it('should reject invalid verification type', () => {
      const invalidData = {
        mobileNumber: '+919876543210',
        code: '123456',
        type: 'INVALID',
      };

      const result = verifyOtpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid enum value');
      }
    });
  });
});
