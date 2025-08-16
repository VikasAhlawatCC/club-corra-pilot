'use client'

import { useCoins } from '@/hooks/useCoins'
import { CoinOverview } from '@/components/coins/CoinOverview'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export default function CoinsPage() {
  const {
    stats,
    transactions,
    loading,
    error,
    pagination,
    fetchStats,
    fetchTransactions,
    clearError
  } = useCoins()

  // Transform transactions to match component interface
  const recentTransactions = transactions.slice(0, 10).map(tx => ({
    id: tx.id,
    userId: tx.userId,
    userName: tx.userName,
    type: tx.type,
    amount: tx.amount,
    timestamp: tx.createdAt,
    status: tx.status
  }))

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorAlert 
        message={error} 
        onRetry={() => {
          clearError()
          fetchStats()
          fetchTransactions()
        }}
        onDismiss={clearError}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Coin System Overview</h1>
        <p className="text-gray-600">Monitor coin distribution, transactions, and system health</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Coins in Circulation</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {stats ? stats.totalCoinsInCirculation.toLocaleString() : '...'}
          </p>
          <p className="text-sm text-gray-500">Across all users</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Welcome Bonuses Given</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats ? stats.welcomeBonusesGiven.toLocaleString() : '...'}
          </p>
          <p className="text-sm text-gray-500">100 coins each</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Pending Redemptions</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stats ? stats.pendingRedemptions.toLocaleString() : '...'}
          </p>
          <p className="text-sm text-gray-500">Awaiting approval</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Coin System Statistics
          </h3>
          
          {stats && (
            <CoinOverview
              stats={stats}
              recentTransactions={recentTransactions}
              onViewTransaction={(transaction) => console.log('View transaction:', transaction)}
              onViewAllTransactions={() => console.log('View all transactions')}
            />
          )}
        </div>
      </div>

      {/* Pagination Info */}
      {pagination.totalPages > 1 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} transactions
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchTransactions({ page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchTransactions({ page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
