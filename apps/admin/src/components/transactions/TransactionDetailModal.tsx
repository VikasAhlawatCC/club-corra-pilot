'use client'

import { XMarkIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import type { CoinTransaction } from '@shared/schemas'

interface TransactionDetailModalProps {
  transaction: CoinTransaction | null
  isOpen: boolean
  onClose: () => void
}

export function TransactionDetailModal({ 
  transaction, 
  isOpen, 
  onClose 
}: TransactionDetailModalProps) {
  if (!isOpen || !transaction) return null

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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Transaction Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Transaction Info */}
          <div className="space-y-6">
            {/* Basic Transaction Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm text-gray-900">{transaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                    {transaction.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{formatDate(transaction.createdAt)}</span>
                </div>
                {transaction.processedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed:</span>
                    <span className="text-gray-900">{formatDate(transaction.processedAt)}</span>
                  </div>
                )}
                {transaction.paymentProcessedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Processed:</span>
                    <span className="text-gray-900">{formatDate(transaction.paymentProcessedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* User Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">User Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono text-sm text-gray-900">{transaction.userId}</span>
                </div>
              </div>
            </div>

            {/* Brand Information */}
            {transaction.brand && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Brand Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Brand:</span>
                    <span className="text-gray-900">{transaction.brand.name}</span>
                  </div>
                  {transaction.brand.logoUrl && (
                    <div className="flex justify-center">
                      <img 
                        src={transaction.brand.logoUrl} 
                        alt={transaction.brand.name}
                        className="h-16 w-16 object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Financial Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h4>
              <div className="space-y-3">
                {transaction.billAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bill Amount:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(transaction.billAmount)}
                    </span>
                  </div>
                )}
                {transaction.coinsEarned && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coins Earned:</span>
                    <span className="text-lg font-semibold text-green-600">
                      +{transaction.coinsEarned} coins
                    </span>
                  </div>
                )}
                {transaction.coinsRedeemed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coins Redeemed:</span>
                    <span className="text-lg font-semibold text-orange-600">
                      -{transaction.coinsRedeemed} coins
                    </span>
                  </div>
                )}
                {transaction.amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction Amount:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            {(transaction.billDate || transaction.transactionId || transaction.adminNotes) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h4>
                <div className="space-y-3">
                  {transaction.billDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bill Date:</span>
                      <span className="text-gray-900">{formatDate(transaction.billDate)}</span>
                    </div>
                  )}
                  {transaction.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Transaction ID:</span>
                      <span className="font-mono text-sm text-gray-900">{transaction.transactionId}</span>
                    </div>
                  )}
                  {transaction.adminNotes && (
                    <div>
                      <span className="text-gray-600 block mb-2">Admin Notes:</span>
                      <p className="text-gray-900 bg-white p-3 rounded border text-sm">
                        {transaction.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Receipt & Actions */}
          <div className="space-y-6">
            {/* Receipt Image */}
            {transaction.receiptUrl && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Receipt</h4>
                <div className="space-y-3">
                  <div className="relative group">
                    <img 
                      src={transaction.receiptUrl} 
                      alt="Receipt"
                      className="w-full h-auto rounded-lg border-2 border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <a 
                      href={transaction.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <DocumentTextIcon className="w-4 h-4 mr-2" />
                      View Full Size
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                {transaction.status === 'PENDING' && (
                  <>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                      Approve Transaction
                    </button>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                      Reject Transaction
                    </button>
                  </>
                )}
                {transaction.type === 'REDEEM' && transaction.status === 'APPROVED' && (
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    Process Payment
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Transaction Timeline */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Transaction Created</p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
                {transaction.processedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Processed</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.processedAt)}</p>
                    </div>
                  </div>
                )}
                {transaction.paymentProcessedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Processed</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.paymentProcessedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
