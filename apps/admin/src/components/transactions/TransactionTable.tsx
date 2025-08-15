'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import type { CoinTransaction } from '@shared/schemas'

interface TransactionTableProps {
  transactions: CoinTransaction[]
  onView?: (transaction: CoinTransaction) => void
  onTransactionSelect?: (transaction: CoinTransaction) => void
  onApprove?: (transactionId: string, adminNotes?: string) => void
  onReject?: (transactionId: string, reason: string, adminNotes?: string) => void
  onApproveEarn?: (transactionId: string, adminNotes?: string) => void
  onRejectEarn?: (transactionId: string, adminNotes: string) => void
  onApproveRedeem?: (transactionId: string, adminNotes?: string) => void
  onRejectRedeem?: (transactionId: string, adminNotes: string) => void
  onProcessPayment?: (
    transactionId: string, 
    paymentTransactionId: string, 
    paymentMethod: string, 
    paymentAmount: number, 
    adminNotes?: string
  ) => void
  isLoading?: boolean
}

export function TransactionTable({ 
  transactions, 
  onView, 
  onTransactionSelect,
  onApprove, 
  onReject, 
  onApproveEarn,
  onRejectEarn,
  onApproveRedeem,
  onRejectRedeem,
  onProcessPayment,
  isLoading = false 
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<keyof CoinTransaction>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedTransaction, setSelectedTransaction] = useState<CoinTransaction | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'payment' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [paymentTransactionId, setPaymentTransactionId] = useState('')
  const [isRowClickable, setIsRowClickable] = useState(true)

  // Cleanup effect to reset state when component unmounts or props change
  useEffect(() => {
    return () => {
      setIsRowClickable(true)
    }
  }, [])

  // Reset row clickability when onTransactionSelect changes
  useEffect(() => {
    setIsRowClickable(true)
  }, [onTransactionSelect])

  const handleSort = (field: keyof CoinTransaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return sortDirection === 'asc' ? -1 : 1
    if (bValue === undefined) return sortDirection === 'asc' ? 1 : -1
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getTransactionTypeColor = (type: CoinTransaction['type']) => {
    switch (type) {
      case 'EARN':
        return 'text-green-600 bg-green-100'
      case 'REDEEM':
        return 'text-orange-600 bg-orange-100'
      case 'WELCOME_BONUS':
        return 'text-blue-600 bg-blue-100'
      case 'ADJUSTMENT':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: CoinTransaction['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-100'
      case 'REJECTED':
        return 'text-red-600 bg-red-100'
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'PROCESSED':
        return 'text-blue-600 bg-blue-100'
      case 'PAID':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: CoinTransaction['status']) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'REJECTED':
        return <XCircleIcon className="w-4 h-4" />
      case 'PENDING':
        return <ClockIcon className="w-4 h-4" />
      case 'PROCESSED':
        return <CurrencyDollarIcon className="w-4 h-4" />
      case 'PAID':
        return <CheckCircleIcon className="w-4 h-4" />
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />
    }
  }

  const handleAction = () => {
    if (!selectedTransaction) return

    switch (actionType) {
      case 'approve':
        onApprove?.(selectedTransaction.id, adminNotes)
        break
      case 'reject':
        if (!rejectionReason.trim()) return
        onReject?.(selectedTransaction.id, rejectionReason, adminNotes)
        break
      case 'payment':
        if (!paymentTransactionId.trim()) return
        onProcessPayment?.(
          selectedTransaction.id, 
          paymentTransactionId, 
          'bank_transfer', // Default payment method
          selectedTransaction.amount, // Use transaction amount
          adminNotes
        )
        break
    }

    // Reset form
    setSelectedTransaction(null)
    setActionType(null)
    setAdminNotes('')
    setRejectionReason('')
    setPaymentTransactionId('')
  }

  const canApprove = (transaction: CoinTransaction) => {
    return transaction.status === 'PENDING' && 
           (transaction.type === 'EARN' || transaction.type === 'REDEEM')
  }

  const canReject = (transaction: CoinTransaction) => {
    return transaction.status === 'PENDING' && 
           (transaction.type === 'EARN' || transaction.type === 'REDEEM')
  }

  const canProcessPayment = (transaction: CoinTransaction) => {
    return transaction.type === 'REDEEM' && transaction.status === 'APPROVED'
  }

  const handleRowClick = useCallback((transaction: CoinTransaction) => {
    if (!isRowClickable || !onTransactionSelect) return
    
    // Immediately disable row clicks to prevent rapid successive clicks
    setIsRowClickable(false)
    
    // Call the parent handler immediately
    onTransactionSelect(transaction)
    
    // Re-enable row clicks after modal is fully open
    setTimeout(() => {
      setIsRowClickable(true)
    }, 500) // Reduced from 800ms to 500ms
  }, [onTransactionSelect, isRowClickable])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  Date
                  {sortField === 'createdAt' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.map((transaction) => (
              <tr 
                key={transaction.id} 
                className={`transition-all duration-150 ${
                  transaction.status === 'PENDING' ? 'border-l-4 border-l-blue-500' : ''
                } ${
                  isRowClickable 
                    ? 'hover:bg-blue-50 cursor-pointer' 
                    : 'cursor-not-allowed opacity-75'
                } ${
                  !isRowClickable ? 'pointer-events-none' : ''
                }`}
                onClick={() => handleRowClick(transaction)}
                title={transaction.status === 'PENDING' ? 'Click to verify receipt' : 'Click to view details'}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.userId.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                    {transaction.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.brand?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span>₹{transaction.billAmount || 0}</span>
                    {transaction.coinsEarned && (
                      <span className="text-xs text-green-600">+{transaction.coinsEarned} coins</span>
                    )}
                    {transaction.coinsRedeemed && (
                      <span className="text-xs text-orange-600">-{transaction.coinsRedeemed} coins</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {getStatusIcon(transaction.status)}
                    <span className="ml-1">{transaction.status}</span>
                    {transaction.status === 'PENDING' && (
                      <span className="ml-2 text-blue-600 text-xs">(Click to verify)</span>
                    )}
                    {!isRowClickable && (
                      <span className="ml-2 text-gray-500 text-xs">(Processing...)</span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {onView && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onView(transaction)
                        }}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    )}
                    {canProcessPayment(transaction) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTransaction(transaction)
                          setActionType('payment')
                        }}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                        title="Process Payment"
                      >
                        <CurrencyDollarIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p>No transactions found</p>
              <p className="text-sm mt-2">Transactions will appear here as users submit requests</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedTransaction && actionType && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType === 'approve' && 'Approve Transaction'}
                {actionType === 'reject' && 'Reject Transaction'}
                {actionType === 'payment' && 'Process Payment'}
              </h3>
              
              <div className="space-y-4">
                {actionType === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Enter rejection reason..."
                      required
                    />
                  </div>
                )}

                {actionType === 'payment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      value={paymentTransactionId}
                      onChange={(e) => setPaymentTransactionId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter payment transaction ID..."
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Add admin notes..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAction}
                    className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                      actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                      actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {actionType === 'approve' && 'Approve'}
                    {actionType === 'reject' && 'Reject'}
                    {actionType === 'payment' && 'Process Payment'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTransaction(null)
                      setActionType(null)
                      setAdminNotes('')
                      setRejectionReason('')
                      setPaymentTransactionId('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
