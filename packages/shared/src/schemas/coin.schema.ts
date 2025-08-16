import { z } from 'zod';

// Base coin schemas
export const coinBalanceSchema = z.object({
  id: z.string().uuid('Invalid balance ID format'),
  userId: z.string().uuid('Invalid user ID format'),
  balance: z.number().min(0, 'Balance must be non-negative'),
  totalEarned: z.number().min(0, 'Total earned must be non-negative'),
  totalRedeemed: z.number().min(0, 'Total redeemed must be non-negative'),
  lastUpdated: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const coinTransactionSchema = z.object({
  id: z.string().uuid('Invalid transaction ID format'),
  userId: z.string().uuid('Invalid user ID format'),
  brandId: z.string().uuid('Invalid brand ID format').optional(),
  brand: z.object({
    id: z.string().uuid('Invalid brand ID format'),
    name: z.string(),
    logoUrl: z.string().optional(),
  }).optional(),
  type: z.enum(['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT']),
  amount: z.number().min(0, 'Amount must be non-negative'),
  billAmount: z.number().min(0, 'Bill amount must be non-negative').optional(),
  coinsEarned: z.number().min(0, 'Coins earned must be non-negative').optional(),
  coinsRedeemed: z.number().min(0, 'Coins redeemed must be non-negative').optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'PAID']),
  receiptUrl: z.string().url('Invalid receipt URL format').optional(),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
  processedAt: z.date().optional(),
  transactionId: z.string().max(100, 'Transaction ID too long').optional(),
  billDate: z.date().optional(),
  paymentProcessedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Transaction creation schemas
export const createEarnTransactionSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  brandId: z.string().uuid('Invalid brand ID format'),
  billAmount: z.number().min(0.01, 'Bill amount must be greater than 0'),
  billDate: z.date().refine(date => date <= new Date(), 'Bill date cannot be in the future'),
  receiptUrl: z.string().url('Invalid receipt URL format'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const createRedeemTransactionSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  brandId: z.string().uuid('Invalid brand ID format'),
  billAmount: z.number().min(0.01, 'Bill amount must be greater than 0'),
  billDate: z.date().refine(date => date <= new Date(), 'Bill date cannot be in the future'),
  coinsToRedeem: z.number().min(1, 'Must redeem at least 1 coin'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Earn transaction response schema
export const createEarnTransactionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  transaction: z.object({
    id: z.string().uuid('Invalid transaction ID format'),
    type: z.literal('EARN'),
    status: z.literal('PENDING'),
    billAmount: z.number().min(0.01, 'Bill amount must be greater than 0'),
    billDate: z.date(),
    coinsEarned: z.number().min(0, 'Coins earned must be non-negative'),
    brand: z.object({
      id: z.string().uuid('Invalid brand ID format'),
      name: z.string(),
      logoUrl: z.string().optional(),
    }),
    createdAt: z.date(),
  }),
  newBalance: z.number().min(0, 'New balance must be non-negative'),
});

// Redeem transaction response schema
export const createRedeemTransactionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  transaction: z.object({
    id: z.string().uuid('Invalid transaction ID format'),
    type: z.literal('REDEEM'),
    status: z.literal('PENDING'),
    billAmount: z.number().min(0.01, 'Bill amount must be greater than 0'),
    billDate: z.date(),
    coinsRedeemed: z.number().min(0, 'Coins redeemed must be non-negative'),
    brand: z.object({
      id: z.string().uuid('Invalid brand ID format'),
      name: z.string(),
      logoUrl: z.string().optional(),
    }),
    createdAt: z.date(),
  }),
  newBalance: z.number().min(0, 'New balance must be non-negative'),
});

export const createWelcomeBonusSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
});

export const createAdjustmentSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  amount: z.number().refine(val => val !== 0, 'Adjustment amount cannot be 0'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
});

// Transaction update schemas
export const updateTransactionStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PROCESSED', 'PAID']),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
});

// Update transaction to PAID status (for payment processing)
export const updateTransactionToPaidSchema = z.object({
  transactionId: z.string().min(5, 'Transaction ID must be at least 5 characters').max(100, 'Transaction ID too long'),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
});

// Payment processing schema
export const processPaymentSchema = z.object({
  transactionId: z.string().min(5, 'Transaction ID must be at least 5 characters').max(100, 'Transaction ID too long'),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
});

// Transaction rejection schema
export const rejectTransactionSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500, 'Rejection reason too long'),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
});

// Transaction search and filtering schemas
export const transactionSearchSchema = z.object({
  userId: z.string().uuid('Invalid user ID format').optional(),
  type: z.enum(['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'PAID']).optional(),
  brandId: z.string().uuid('Invalid brand ID format').optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});

// Admin transaction search schema with additional filtering options
export const adminTransactionSearchSchema = z.object({
  userId: z.string().uuid('Invalid user ID format').optional(),
  type: z.enum(['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'PAID']).optional(),
  brandId: z.string().uuid('Invalid brand ID format').optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'billAmount', 'amount']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export const transactionListResponseSchema = z.object({
  transactions: z.array(coinTransactionSchema),
  total: z.number().int().min(0, 'Total must be non-negative'),
  page: z.number().int().min(1, 'Page must be at least 1'),
  limit: z.number().int().min(1, 'Limit must be at least 1'),
  totalPages: z.number().int().min(0, 'Total pages must be non-negative'),
});

// Welcome bonus schemas
export const welcomeBonusRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
});

export const welcomeBonusResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  coinsAwarded: z.number().int().min(0, 'Coins awarded must be non-negative'),
  newBalance: z.number().min(0, 'New balance must be non-negative'),
  transactionId: z.string().uuid('Invalid transaction ID format'),
});

// Coin adjustment schemas
export const coinAdjustmentSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  amount: z.number().refine(val => val !== 0, 'Adjustment amount cannot be 0'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
});

export const coinAdjustmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  adjustmentAmount: z.number(),
  newBalance: z.number().min(0, 'New balance must be non-negative'),
  transactionId: z.string().uuid('Invalid transaction ID format'),
});

// Payment processing response schema
export const processPaymentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  transactionId: z.string().uuid('Invalid transaction ID format'),
  adminTransactionId: z.string(),
  processedAt: z.date(),
});

// Balance schemas
export const balanceResponseSchema = z.object({
  balance: z.union([
    z.string().transform((val) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }),
    z.number().min(0, 'Balance must be non-negative')
  ]).transform((val) => typeof val === 'number' ? val : parseFloat(val) || 0),
  
  totalEarned: z.union([
    z.string().transform((val) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }),
    z.number().min(0, 'Total earned must be non-negative')
  ]).transform((val) => typeof val === 'number' ? val : parseFloat(val) || 0),
  
  totalRedeemed: z.union([
    z.string().transform((val) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }),
    z.number().min(0, 'Total redeemed must be non-negative')
  ]).transform((val) => typeof val === 'number' ? val : parseFloat(val) || 0),
  
  lastUpdated: z.union([
    z.string().transform((val) => new Date(val)),
    z.date()
  ]),
  
  // Additional fields that the API returns
  id: z.string().uuid('Invalid balance ID format').optional(),
  userId: z.string().uuid('Invalid user ID format').optional(),
  createdAt: z.union([
    z.string().transform((val) => new Date(val)),
    z.date()
  ]).optional(),
  updatedAt: z.union([
    z.string().transform((val) => new Date(val)),
    z.date()
  ]).optional(),
});

// User balance summary schema with pending requests
export const userBalanceSummarySchema = z.object({
  balance: z.number().min(0, 'Balance must be non-negative'),
  totalEarned: z.number().min(0, 'Total earned must be non-negative'),
  totalRedeemed: z.number().min(0, 'Total redeemed must be non-negative'),
  lastUpdated: z.date(),
  pendingEarnRequests: z.number().int().min(0, 'Pending earn requests must be non-negative'),
  pendingRedeemRequests: z.number().int().min(0, 'Pending redeem requests must be non-negative'),
});

// Pending requests response schema
export const pendingRequestsResponseSchema = z.object({
  pendingEarnRequests: z.number().int().min(0, 'Pending earn requests must be non-negative'),
  pendingRedeemRequests: z.number().int().min(0, 'Pending redeem requests must be non-negative'),
  recentTransactions: z.array(coinTransactionSchema),
});

// Verification form schemas
export const verificationFormSchema = z.object({
  observedAmount: z.number().min(0.01, 'Observed amount must be greater than 0'),
  receiptDate: z.string().min(1, 'Receipt date is required'), // Changed to string to match frontend
  verificationConfirmed: z.boolean(), // Changed to match frontend
  rejectionNote: z.string().max(1000, 'Rejection note too long').optional(),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
});

export const userVerificationDataSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  mobileNumber: z.string(),
  email: z.string().email('Invalid email format').optional(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }).optional(),
  paymentDetails: z.object({
    mobileNumber: z.string().optional(),
    upiId: z.string().optional(),
  }).optional(),
});

export const userVerificationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    user: userVerificationDataSchema,
    pendingRequests: pendingRequestsResponseSchema,
  }),
});

// Type exports
export type CoinBalance = z.infer<typeof coinBalanceSchema>;
export type CoinTransaction = z.infer<typeof coinTransactionSchema>;
export type CreateEarnTransactionRequest = z.infer<typeof createEarnTransactionSchema>;
export type CreateRedeemTransactionRequest = z.infer<typeof createRedeemTransactionSchema>;
export type CreateEarnTransactionResponse = z.infer<typeof createEarnTransactionResponseSchema>;
export type CreateRedeemTransactionResponse = z.infer<typeof createRedeemTransactionResponseSchema>;
export type CreateWelcomeBonusRequest = z.infer<typeof createWelcomeBonusSchema>;
export type CreateAdjustmentRequest = z.infer<typeof createAdjustmentSchema>;
export type UpdateTransactionStatusRequest = z.infer<typeof updateTransactionStatusSchema>;
export type UpdateTransactionToPaidRequest = z.infer<typeof updateTransactionToPaidSchema>;
export type ProcessPaymentRequest = z.infer<typeof processPaymentSchema>;
export type RejectTransactionRequest = z.infer<typeof rejectTransactionSchema>;
export type ProcessPaymentResponse = z.infer<typeof processPaymentResponseSchema>;
export type TransactionSearchRequest = z.infer<typeof transactionSearchSchema>;
export type AdminTransactionSearchRequest = z.infer<typeof adminTransactionSearchSchema>;
export type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;
export type WelcomeBonusRequest = z.infer<typeof welcomeBonusRequestSchema>;
export type WelcomeBonusResponse = z.infer<typeof welcomeBonusResponseSchema>;
export type CoinAdjustmentRequest = z.infer<typeof coinAdjustmentSchema>;
export type CoinAdjustmentResponse = z.infer<typeof coinAdjustmentResponseSchema>;
export type BalanceResponse = z.infer<typeof balanceResponseSchema>;
export type UserBalanceSummary = z.infer<typeof userBalanceSummarySchema>;
export type PendingRequestsResponse = z.infer<typeof pendingRequestsResponseSchema>;
export type VerificationFormData = z.infer<typeof verificationFormSchema>;
export type UserVerificationData = z.infer<typeof userVerificationDataSchema>;
export type UserVerificationResponse = z.infer<typeof userVerificationResponseSchema>;
