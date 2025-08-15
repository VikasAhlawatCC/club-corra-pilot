'use client'

import { useState } from 'react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import type { CoinTransaction } from '@shared/schemas'

interface TransactionActionButtonsProps {
  transaction: CoinTransaction
  onApprove: (transactionId: string, adminNotes?: string) => void
  onReject: (transactionId: string, reason: string, adminNotes?: string) => void
  onProcessPayment: (
    transactionId: string, 
    paymentTransactionId: string, 
    paymentMethod: string, 
    paymentAmount: number, 
    adminNotes?: string
  ) => void
  isLoading?: boolean
}

export function TransactionActionButtons({ 
  transaction, 
  onApprove, 
  onReject, 
  onProcessPayment,
  isLoading = false 
}: TransactionActionButtonsProps) {
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [paymentTransactionId, setPaymentTransactionId] = useState('')

  const canApprove = transaction.status === 'PENDING' && 
                     (transaction.type === 'EARN' || transaction.type === 'REDEEM')

  const canReject = transaction.status === 'PENDING' && 
                    (transaction.type === 'EARN' || transaction.type === 'REDEEM')

  const canProcessPayment = transaction.type === 'REDEEM' && transaction.status === 'APPROVED'

  const handleApprove = () => {
    if (!adminNotes.trim()) {
      onApprove(transaction.id)
    } else {
      onApprove(transaction.id, adminNotes.trim())
    }
    setShowApproveModal(false)
    setAdminNotes('')
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) return
    
    onReject(transaction.id, rejectionReason.trim(), adminNotes.trim() || undefined)
    setShowRejectModal(false)
    setRejectionReason('')
    setAdminNotes('')
  }

  const handleProcessPayment = () => {
    if (!paymentTransactionId.trim()) return
    
    onProcessPayment(
      transaction.id, 
      paymentTransactionId.trim(), 
      'bank_transfer', // Default payment method
      transaction.amount, // Use transaction amount
      adminNotes.trim() || undefined
    )
    setShowPaymentModal(false)
    setPaymentTransactionId('')
    setAdminNotes('')
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Status Display */}
      <div className="flex items-center space-x-2">
        {getStatusIcon(transaction.status)}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
          {transaction.status}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {canApprove && (
          <button
            onClick={() => setShowApproveModal(true)}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Approve
          </button>
        )}

        {canReject && (
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <XCircleIcon className="w-3 h-3 mr-1" />
            Reject
          </button>
        )}

        {canProcessPayment && (
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <CurrencyDollarIcon className="w-3 h-3 mr-1" />
            Process Payment
          </button>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Transaction</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Add admin notes..."
                    maxLength={1000}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {adminNotes.length}/1000 characters
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleApprove}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowApproveModal(false)
                      setAdminNotes('')
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Transaction</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Enter rejection reason..."
                    required
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Add admin notes..."
                    maxLength={1000}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {adminNotes.length}/1000 characters
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectionReason('')
                      setAdminNotes('')
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Process Payment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID *
                  </label>
                  <input
                    type="text"
                    value={paymentTransactionId}
                    onChange={(e) => setPaymentTransactionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter payment transaction ID..."
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Add admin notes..."
                    maxLength={1000}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {adminNotes.length}/1000 characters
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleProcessPayment}
                    disabled={!paymentTransactionId.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Process Payment
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false)
                      setPaymentTransactionId('')
                      setAdminNotes('')
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
