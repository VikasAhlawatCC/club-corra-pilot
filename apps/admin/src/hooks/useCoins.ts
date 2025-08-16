import { useState, useCallback, useEffect } from 'react'
import { transactionApi, userApi, welcomeBonusApi } from '@/lib/api'
import { 
  CoinSystemStats, 
  AdminCoinTransaction, 
  TransactionFilters,
  TransactionStats,
  PaymentStats,
  UserCoinSummary 
} from '@/types/coins'

export const useCoins = () => {
  const [stats, setStats] = useState<CoinSystemStats | null>(null)
  const [transactions, setTransactions] = useState<AdminCoinTransaction[]>([])
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null)
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Fetch coin system statistics
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get transaction stats
      const statsResponse = await transactionApi.getTransactionStats()
      if (statsResponse.success) {
        const statsData = statsResponse.data
        
        // Calculate system health based on pending transactions
        let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
        if (statsData.pendingTransactions > 50) {
          systemHealth = 'critical'
        } else if (statsData.pendingTransactions > 20) {
          systemHealth = 'warning'
        }

        const systemStats: CoinSystemStats = {
          totalCoinsInCirculation: statsData.totalCoinsInCirculation || 0,
          totalUsers: statsData.totalUsers || 0,
          welcomeBonusesGiven: statsData.totalWelcomeBonuses || 0,
          pendingRedemptions: statsData.pendingTransactions || 0,
          activeBrands: statsData.activeBrands || 0,
          systemHealth
        }
        
        setStats(systemStats)
        setTransactionStats(statsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch transactions with filters
  const fetchTransactions = useCallback(async (filters: TransactionFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const { page = 1, limit = 20, userId, type, status, startDate, endDate } = filters
      
      const response = await transactionApi.getAllTransactions(page, limit, userId)
      if (response.success) {
        const { data, total, totalPages } = response.data
        
        // Transform backend data to admin format
        const adminTransactions: AdminCoinTransaction[] = data.map((tx: any) => ({
          id: tx.id,
          userId: tx.userId,
          userName: tx.user?.profile?.firstName && tx.user?.profile?.lastName 
            ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
            : 'Unknown User',
          userMobile: tx.user?.mobileNumber || 'N/A',
          type: tx.type,
          amount: tx.amount,
          status: tx.status,
          brandName: tx.brand?.name,
          brandId: tx.brandId,
          billAmount: tx.billAmount,
          receiptUrl: tx.receiptUrl,
          adminNotes: tx.adminNotes,
          createdAt: new Date(tx.createdAt),
          updatedAt: new Date(tx.updatedAt)
        }))
        
        setTransactions(adminTransactions)
        setPagination({
          page,
          limit,
          total,
          totalPages
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch payment statistics
  const fetchPaymentStats = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setError(null)
      
      const response = await transactionApi.getPaymentStats(startDate, endDate)
      if (response.success) {
        setPaymentStats(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment stats')
    }
  }, [])

  // Get user coin summary
  const getUserSummary = useCallback(async (userId: string): Promise<UserCoinSummary | null> => {
    try {
      const response = await userApi.getUserTransactionSummary(userId)
      if (response.success) {
        const { data } = response
        return {
          userId,
          userName: 'User', // Will be populated from user data
          userMobile: 'N/A', // Will be populated from user data
          currentBalance: data.balance,
          totalEarned: data.totalEarned,
          totalRedeemed: data.totalRedeemed,
          pendingRequests: data.pendingTransactions || 0,
          lastTransactionDate: data.recentTransactions?.[0]?.createdAt 
            ? new Date(data.recentTransactions[0].createdAt)
            : undefined
        }
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user summary')
      return null
    }
  }, [])

  // Approve transaction
  const approveTransaction = useCallback(async (transactionId: string, adminNotes?: string) => {
    try {
      setError(null)
      
      const response = await transactionApi.approveEarnTransaction(transactionId, 'current-admin-id', adminNotes)
      
      if (response.success) {
        // Refresh transactions to show updated status
        await fetchTransactions()
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve transaction')
      return false
    }
  }, [fetchTransactions])

  // Reject transaction
  const rejectTransaction = useCallback(async (transactionId: string, adminNotes: string) => {
    try {
      setError(null)
      
      const response = await transactionApi.rejectEarnTransaction(transactionId, 'current-admin-id', adminNotes)
      
      if (response.success) {
        // Refresh transactions to show updated status
        await fetchTransactions()
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject transaction')
      return false
    }
  }, [fetchTransactions])

  // Process payment
  const processPayment = useCallback(async (
    transactionId: string, 
    paymentTransactionId: string,
    paymentMethod: string,
    paymentAmount: number,
    adminNotes?: string
  ) => {
    try {
      setError(null)
      
      const response = await transactionApi.processPayment(
        transactionId,
        'current-admin-id',
        paymentTransactionId,
        paymentMethod,
        paymentAmount,
        adminNotes
      )
      
      if (response.success) {
        // Refresh transactions and payment stats
        await Promise.all([
          fetchTransactions(),
          fetchPaymentStats()
        ])
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment')
      return false
    }
  }, [fetchTransactions, fetchPaymentStats])

  // Create welcome bonus for a user (admin action)
  const createWelcomeBonus = useCallback(async (userId: string, mobileNumber: string) => {
    try {
      setError(null)
      
      const response = await welcomeBonusApi.createWelcomeBonus(userId, 100)
      
      if (response.success) {
        // Refresh stats and transactions
        await Promise.all([
          fetchStats(),
          fetchTransactions()
        ])
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create welcome bonus')
      return false
    }
  }, [fetchStats, fetchTransactions])

  // Initial data fetch
  useEffect(() => {
    fetchStats()
    fetchTransactions()
  }, [fetchStats, fetchTransactions])

  return {
    // State
    stats,
    transactions,
    transactionStats,
    paymentStats,
    loading,
    error,
    pagination,
    
    // Actions
    fetchStats,
    fetchTransactions,
    fetchPaymentStats,
    getUserSummary,
    approveTransaction,
    rejectTransaction,
    processPayment,
    createWelcomeBonus,
    
    // Utilities
    clearError: () => setError(null)
  }
}
