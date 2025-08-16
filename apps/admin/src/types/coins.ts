// Admin-specific coin types for the admin portal
export interface CoinSystemStats {
  totalCoinsInCirculation: number
  totalUsers: number
  welcomeBonusesGiven: number
  pendingRedemptions: number
  activeBrands: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

export interface AdminCoinTransaction {
  id: string
  userId: string
  userName: string
  userMobile: string
  type: 'EARN' | 'REDEEM' | 'WELCOME_BONUS' | 'ADJUSTMENT'
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'PAID'
  brandName?: string
  brandId?: string
  billAmount?: number
  receiptUrl?: string
  adminNotes?: string
  createdAt: Date
  updatedAt: Date
}

export interface TransactionFilters {
  page?: number
  limit?: number
  userId?: string
  type?: 'EARN' | 'REDEEM' | 'WELCOME_BONUS' | 'ADJUSTMENT'
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'PAID'
  startDate?: string
  endDate?: string
}

export interface TransactionStats {
  totalTransactions: number
  pendingTransactions: number
  approvedTransactions: number
  rejectedTransactions: number
  totalCoinsEarned: number
  totalCoinsRedeemed: number
  totalWelcomeBonuses: number
  totalAdjustments: number
}

export interface PaymentStats {
  totalPayments: number
  totalAmountPaid: number
  pendingPayments: number
  completedPayments: number
  averagePaymentAmount: number
}

export interface UserCoinSummary {
  userId: string
  userName: string
  userMobile: string
  currentBalance: number
  totalEarned: number
  totalRedeemed: number
  pendingRequests: number
  lastTransactionDate?: Date
}
