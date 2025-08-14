"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pendingRequestsResponseSchema = exports.userBalanceSummarySchema = exports.balanceResponseSchema = exports.processPaymentResponseSchema = exports.coinAdjustmentResponseSchema = exports.coinAdjustmentSchema = exports.welcomeBonusResponseSchema = exports.welcomeBonusRequestSchema = exports.transactionListResponseSchema = exports.adminTransactionSearchSchema = exports.transactionSearchSchema = exports.rejectTransactionSchema = exports.processPaymentSchema = exports.updateTransactionToPaidSchema = exports.updateTransactionStatusSchema = exports.createAdjustmentSchema = exports.createWelcomeBonusSchema = exports.createRedeemTransactionResponseSchema = exports.createEarnTransactionResponseSchema = exports.createRedeemTransactionSchema = exports.createEarnTransactionSchema = exports.coinTransactionSchema = exports.coinBalanceSchema = void 0;
const zod_1 = require("zod");
exports.coinBalanceSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid balance ID format'),
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    balance: zod_1.z.number().min(0, 'Balance must be non-negative'),
    totalEarned: zod_1.z.number().min(0, 'Total earned must be non-negative'),
    totalRedeemed: zod_1.z.number().min(0, 'Total redeemed must be non-negative'),
    lastUpdated: zod_1.z.date(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.coinTransactionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid transaction ID format'),
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    brandId: zod_1.z.string().uuid('Invalid brand ID format').optional(),
    brand: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid brand ID format'),
        name: zod_1.z.string(),
        logoUrl: zod_1.z.string().optional(),
    }).optional(),
    type: zod_1.z.enum(['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT']),
    amount: zod_1.z.number().min(0, 'Amount must be non-negative'),
    billAmount: zod_1.z.number().min(0, 'Bill amount must be non-negative').optional(),
    coinsEarned: zod_1.z.number().min(0, 'Coins earned must be non-negative').optional(),
    coinsRedeemed: zod_1.z.number().min(0, 'Coins redeemed must be non-negative').optional(),
    status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'PAID']),
    receiptUrl: zod_1.z.string().url('Invalid receipt URL format').optional(),
    adminNotes: zod_1.z.string().max(1000, 'Admin notes too long').optional(),
    processedAt: zod_1.z.date().optional(),
    transactionId: zod_1.z.string().max(100, 'Transaction ID too long').optional(),
    billDate: zod_1.z.date().optional(),
    paymentProcessedAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.createEarnTransactionSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    brandId: zod_1.z.string().uuid('Invalid brand ID format'),
    billAmount: zod_1.z.number().min(0.01, 'Bill amount must be greater than 0'),
    billDate: zod_1.z.date().refine(date => date <= new Date(), 'Bill date cannot be in the future'),
    receiptUrl: zod_1.z.string().url('Invalid receipt URL format'),
    notes: zod_1.z.string().max(500, 'Notes too long').optional(),
});
exports.createRedeemTransactionSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    brandId: zod_1.z.string().uuid('Invalid brand ID format'),
    billAmount: zod_1.z.number().min(0.01, 'Bill amount must be greater than 0'),
    billDate: zod_1.z.date().refine(date => date <= new Date(), 'Bill date cannot be in the future'),
    coinsToRedeem: zod_1.z.number().min(1, 'Must redeem at least 1 coin'),
    notes: zod_1.z.string().max(500, 'Notes too long').optional(),
});
exports.createEarnTransactionResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    transaction: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid transaction ID format'),
        type: zod_1.z.literal('EARN'),
        status: zod_1.z.literal('PENDING'),
        billAmount: zod_1.z.number().min(0.01, 'Bill amount must be greater than 0'),
        billDate: zod_1.z.date(),
        coinsEarned: zod_1.z.number().min(0, 'Coins earned must be non-negative'),
        brand: zod_1.z.object({
            id: zod_1.z.string().uuid('Invalid brand ID format'),
            name: zod_1.z.string(),
            logoUrl: zod_1.z.string().optional(),
        }),
        createdAt: zod_1.z.date(),
    }),
    newBalance: zod_1.z.number().min(0, 'New balance must be non-negative'),
});
exports.createRedeemTransactionResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    transaction: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid transaction ID format'),
        type: zod_1.z.literal('REDEEM'),
        status: zod_1.z.literal('PENDING'),
        billAmount: zod_1.z.number().min(0.01, 'Bill amount must be greater than 0'),
        billDate: zod_1.z.date(),
        coinsRedeemed: zod_1.z.number().min(0, 'Coins redeemed must be non-negative'),
        brand: zod_1.z.object({
            id: zod_1.z.string().uuid('Invalid brand ID format'),
            name: zod_1.z.string(),
            logoUrl: zod_1.z.string().optional(),
        }),
        createdAt: zod_1.z.date(),
    }),
    newBalance: zod_1.z.number().min(0, 'New balance must be non-negative'),
});
exports.createWelcomeBonusSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    mobileNumber: zod_1.z.string().min(10, 'Mobile number must be at least 10 digits'),
});
exports.createAdjustmentSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    amount: zod_1.z.number().refine(val => val !== 0, 'Adjustment amount cannot be 0'),
    reason: zod_1.z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
    adminNotes: zod_1.z.string().max(1000, 'Admin notes too long').optional(),
});
exports.updateTransactionStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['APPROVED', 'REJECTED', 'PROCESSED', 'PAID']),
    adminNotes: zod_1.z.string().max(1000, 'Admin notes too long').optional(),
});
exports.updateTransactionToPaidSchema = zod_1.z.object({
    transactionId: zod_1.z.string().min(5, 'Transaction ID must be at least 5 characters').max(100, 'Transaction ID too long'),
    adminNotes: zod_1.z.string().max(1000, 'Admin notes too long').optional(),
});
exports.processPaymentSchema = zod_1.z.object({
    transactionId: zod_1.z.string().min(5, 'Transaction ID must be at least 5 characters').max(100, 'Transaction ID too long'),
    adminNotes: zod_1.z.string().max(1000, 'Admin notes too long').optional(),
});
exports.rejectTransactionSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Rejection reason is required').max(500, 'Rejection reason too long'),
    adminNotes: zod_1.z.string().max(1000, 'Admin notes too long').optional(),
});
exports.transactionSearchSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format').optional(),
    type: zod_1.z.enum(['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT']).optional(),
    status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'PAID']).optional(),
    brandId: zod_1.z.string().uuid('Invalid brand ID format').optional(),
    startDate: zod_1.z.date().optional(),
    endDate: zod_1.z.date().optional(),
    page: zod_1.z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});
exports.adminTransactionSearchSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format').optional(),
    type: zod_1.z.enum(['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT']).optional(),
    status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'PAID']).optional(),
    brandId: zod_1.z.string().uuid('Invalid brand ID format').optional(),
    startDate: zod_1.z.date().optional(),
    endDate: zod_1.z.date().optional(),
    page: zod_1.z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'billAmount', 'amount']).default('createdAt'),
    sortOrder: zod_1.z.enum(['ASC', 'DESC']).default('DESC'),
});
exports.transactionListResponseSchema = zod_1.z.object({
    transactions: zod_1.z.array(exports.coinTransactionSchema),
    total: zod_1.z.number().int().min(0, 'Total must be non-negative'),
    page: zod_1.z.number().int().min(1, 'Page must be at least 1'),
    limit: zod_1.z.number().int().min(1, 'Limit must be at least 1'),
    totalPages: zod_1.z.number().int().min(0, 'Total pages must be non-negative'),
});
exports.welcomeBonusRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    mobileNumber: zod_1.z.string().min(10, 'Mobile number must be at least 10 digits'),
});
exports.welcomeBonusResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    coinsAwarded: zod_1.z.number().int().min(0, 'Coins awarded must be non-negative'),
    newBalance: zod_1.z.number().min(0, 'New balance must be non-negative'),
    transactionId: zod_1.z.string().uuid('Invalid transaction ID format'),
});
exports.coinAdjustmentSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    amount: zod_1.z.number().refine(val => val !== 0, 'Adjustment amount cannot be 0'),
    reason: zod_1.z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
    adminNotes: zod_1.z.string().max(1000, 'Admin notes too long').optional(),
});
exports.coinAdjustmentResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    adjustmentAmount: zod_1.z.number(),
    newBalance: zod_1.z.number().min(0, 'New balance must be non-negative'),
    transactionId: zod_1.z.string().uuid('Invalid transaction ID format'),
});
exports.processPaymentResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    transactionId: zod_1.z.string().uuid('Invalid transaction ID format'),
    adminTransactionId: zod_1.z.string(),
    processedAt: zod_1.z.date(),
});
exports.balanceResponseSchema = zod_1.z.object({
    balance: zod_1.z.number().min(0, 'Balance must be non-negative'),
    totalEarned: zod_1.z.number().min(0, 'Total earned must be non-negative'),
    totalRedeemed: zod_1.z.number().min(0, 'Total redeemed must be non-negative'),
    lastUpdated: zod_1.z.date(),
});
exports.userBalanceSummarySchema = zod_1.z.object({
    balance: zod_1.z.number().min(0, 'Balance must be non-negative'),
    totalEarned: zod_1.z.number().min(0, 'Total earned must be non-negative'),
    totalRedeemed: zod_1.z.number().min(0, 'Total redeemed must be non-negative'),
    lastUpdated: zod_1.z.date(),
    pendingEarnRequests: zod_1.z.number().int().min(0, 'Pending earn requests must be non-negative'),
    pendingRedeemRequests: zod_1.z.number().int().min(0, 'Pending redeem requests must be non-negative'),
});
exports.pendingRequestsResponseSchema = zod_1.z.object({
    pendingEarnRequests: zod_1.z.number().int().min(0, 'Pending earn requests must be non-negative'),
    pendingRedeemRequests: zod_1.z.number().int().min(0, 'Pending redeem requests must be non-negative'),
    recentTransactions: zod_1.z.array(exports.coinTransactionSchema),
});
//# sourceMappingURL=coin.schema.js.map