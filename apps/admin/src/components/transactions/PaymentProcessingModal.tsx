'use client'

import { useState } from 'react'
import { XMarkIcon, CurrencyDollarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { CoinTransaction } from '@shared/schemas'

interface PaymentProcessingModalProps {
  transaction: CoinTransaction | null
  isOpen: boolean
  onClose: () => void
  onProcessPayment: (transactionId: string, adminTransactionId: string, adminNotes?: string) => void
  isLoading?: boolean
}

export function PaymentProcessingModal({ 
  transaction, 
  isOpen, 
  onClose, 
  onProcessPayment,
  isLoading = false 
}: PaymentProcessingModalProps) {
  const [adminTransactionId, setAdminTransactionId] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  if (!isOpen || !transaction) return null

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!adminTransactionId.trim()) {
      newErrors.adminTransactionId = 'Transaction ID is required'
    } else if (adminTransactionId.trim().length < 5) {
      newErrors.adminTransactionId = 'Transaction ID must be at least 5 characters'
    } else if (adminTransactionId.trim().length > 100) {
      newErrors.adminTransactionId = 'Transaction ID cannot exceed 100 characters'
    }

    if (adminNotes.trim().length > 1000) {
      newErrors.adminNotes = 'Admin notes cannot exceed 1000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    onProcessPayment(transaction.id, adminTransactionId.trim(), adminNotes.trim() || undefined)
    
    // Reset form
    setAdminTransactionId('')
    setAdminNotes('')
    setErrors({})
  }

  const handleClose = () => {
    setAdminTransactionId('')
    setAdminNotes('')
    setErrors({})
    onClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="w-6 h-6 mr-2 text-purple-600" />
            Process Payment
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Transaction Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">User ID:</span>
              <span className="font-mono text-gray-900">{transaction.userId.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Brand:</span>
              <span className="text-gray-900">{transaction.brand?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bill Amount:</span>
              <span className="font-semibold text-gray-900">
                {transaction.billAmount ? formatCurrency(transaction.billAmount) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Coins Redeemed:</span>
              <span className="font-semibold text-orange-600">
                {transaction.coinsRedeemed || 0} coins
              </span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Payment Processing</p>
              <p className="mt-1">
                This action will mark the redemption as paid. Ensure you have processed the actual UPI payment 
                to the user before proceeding.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminTransactionId" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Transaction ID *
            </label>
            <input
              type="text"
              id="adminTransactionId"
              value={adminTransactionId}
              onChange={(e) => setAdminTransactionId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.adminTransactionId ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your payment transaction ID"
              required
            />
            {errors.adminTransactionId && (
              <p className="mt-1 text-sm text-red-600">{errors.adminTransactionId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This should be the transaction ID from your UPI payment app (e.g., Google Pay, PhonePe)
            </p>
          </div>

          <div>
            <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.adminNotes ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Add any additional notes about this payment..."
            />
            {errors.adminNotes && (
              <p className="mt-1 text-sm text-red-600">{errors.adminNotes}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {adminNotes.length}/1000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                  Process Payment
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Additional Information */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">What happens next?</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Transaction status will be updated to "PAID"</li>
            <li>• User will receive a notification about payment completion</li>
            <li>• Payment will be recorded in the audit trail</li>
            <li>• Transaction will be marked as completed</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
