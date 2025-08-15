// Export all shared types and utilities
export * from './utils';

// Export all schemas
export * from './schemas/auth.schema';
export * from './schemas/brand.schema';
export * from './schemas/coin.schema';
export * from './schemas/user.schema';
export * from './schemas/global-config.schema';

// Re-export commonly used types and schemas
export type {
  EmailVerificationResponse,
  PasswordResetResponse,
  JwtPayload
} from './types';

// Re-export specific schemas for easier access
export {
  passwordSetupSchema,
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordResetConfirmSchema
} from './schemas';

// Re-export transaction schemas
export {
  createEarnTransactionSchema,
  createRedeemTransactionSchema
} from './schemas/coin.schema';

// Re-export utility functions
export {
  formatIndianMobileNumber,
  generateOTP,
  validateMobileNumber,
  maskMobileNumber,
  maskEmail
} from './utils';
