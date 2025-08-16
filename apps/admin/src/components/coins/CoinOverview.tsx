'use client'

import { useState } from 'react'
import { 
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

import { CoinSystemStats, AdminCoinTransaction } from '@/types/coins'

interface RecentTransaction {
  id: string
  userId: string
  userName: string
  type: 'WELCOME_BONUS' | 'EARN' | 'REDEEM' | 'ADJUSTMENT'
  amount: number
  timestamp: Date
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'PAID'
}

interface CoinOverviewProps {
  stats: CoinSystemStats
  recentTransactions: RecentTransaction[]
  onViewTransaction?: (transaction: RecentTransaction) => void
  onViewAllTransactions?: () => void
}

export function CoinOverview({ 
  stats, 
  recentTransactions, 
  onViewTransaction,
  onViewAllTransactions 
}: CoinOverviewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('7d')

  const getSystemHealthColor = (health: CoinSystemStats['systemHealth']) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSystemHealthIcon = (health: CoinSystemStats['systemHealth']) => {
    switch (health) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5" />
      case 'critical':
        return <ExclamationTriangleIcon className="w-5 h-5" />
      default:
        return <ExclamationTriangleIcon className="w-5 h-5" />
    }
  }

  const getTransactionTypeColor = (type: RecentTransaction['type']) => {
    switch (type) {
      case 'WELCOME_BONUS':
        return 'text-green-600 bg-green-100'
      case 'EARN':
        return 'text-blue-600 bg-blue-100'
      case 'REDEEM':
        return 'text-orange-600 bg-orange-100'
      case 'ADJUSTMENT':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTransactionStatusColor = (status: RecentTransaction['status']) => {
    switch (status) {
      case 'APPROVED':
      case 'PROCESSED':
      case 'PAID':
        return 'text-green-600 bg-green-100'
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'REJECTED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount)
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp)
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSystemHealthColor(stats.systemHealth)}`}>
            {getSystemHealthIcon(stats.systemHealth)}
            <span className="ml-2 capitalize">{stats.systemHealth}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Coins</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.totalCoinsInCirculation)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.totalUsers)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
                              <ChartBarIcon className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Welcome Bonuses</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.welcomeBonusesGiven)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.pendingRedemptions)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              {onViewAllTransactions && (
                <button
                  onClick={onViewAllTransactions}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  View All
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.userName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.userId.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                    {transaction.type === 'WELCOME_BONUS' ? 'WELCOME BONUS' : transaction.type}
                  </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {transaction.amount >= 0 ? '+' : ''}{formatAmount(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(transaction.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {onViewTransaction && (
                      <button
                        onClick={() => onViewTransaction(transaction)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {recentTransactions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p>No recent transactions</p>
                <p className="text-sm mt-2">Transactions will appear here as users interact with the system</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
