/**
 * Business logic constants for the application
 * Centralized configuration for business rules and limits
 */

export const COIN_CONSTANTS = {
  WELCOME_BONUS_AMOUNT: 100,
  MAX_TRANSACTION_AMOUNT: 10000,
  MIN_TRANSACTION_AMOUNT: 0.01,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const BRAND_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_LOGO_URL_LENGTH: 500,
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
  MAX_COMBINED_PERCENTAGE: 100,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const VALIDATION_CONSTANTS = {
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  COLOR_HEX_REGEX: /^#[0-9A-F]{6}$/i,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

export const TRANSACTION_TYPES = {
  WELCOME_BONUS: 'WELCOME_BONUS',
  EARNED: 'EARNED',
  REDEEMED: 'REDEEMED',
  EXPIRED: 'EXPIRED',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];
