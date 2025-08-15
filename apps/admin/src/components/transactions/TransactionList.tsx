'use client'

import React from 'react'
import { TransactionTable } from './TransactionTable'
import { TransactionDetailModal } from './TransactionDetailModal'
import { PaymentProcessingModal } from './PaymentProcessingModal'
import { TransactionActionButtons } from './TransactionActionButtons'
import type { CoinTransaction } from '@shared/schemas'

interface TransactionListProps {
  transactions: CoinTransaction[]
  isLoading: boolean
  selectedTransaction: CoinTransaction | null
  showDetailModal: boolean
  onTransactionSelect: (transaction: CoinTransaction) => void
  onDetailModalClose: () => void
  onPaymentModalClose: () => void
  onApproveEarn: (transactionId: string, adminNotes?: string) => Promise<void>
  onRejectEarn: (transactionId: string, adminNotes: string) => Promise<void>
  onApproveRedeem: (transactionId: string, adminNotes?: string) => Promise<void>
  onRejectRedeem: (transactionId: string, adminNotes: string) => Promise<void>
  onProcessPayment: (
    transactionId: string,
    paymentTransactionId: string,
    paymentMethod: string,
    paymentAmount: number,
    adminNotes?: string
  ) => Promise<void>
}

export function TransactionList({
  transactions,
  isLoading,
  selectedTransaction,
  showDetailModal,
  onTransactionSelect,
  onDetailModalClose,
  onPaymentModalClose,
  onApproveEarn,
  onRejectEarn,
  onApproveRedeem,
  onRejectRedeem,
  onProcessPayment,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">No transactions found</p>
        <p className="text-gray-400 text-sm mt-2">Transactions will appear here once they are created</p>
      </div>
    )
  }

  return (
    <>
      <TransactionTable
        transactions={transactions}
        onTransactionSelect={onTransactionSelect}
        onApproveEarn={onApproveEarn}
        onRejectEarn={onRejectEarn}
        onApproveRedeem={onApproveRedeem}
        onRejectRedeem={onRejectRedeem}
        onProcessPayment={onProcessPayment}
      />

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          isOpen={showDetailModal}
          onClose={onDetailModalClose}
        />
      )}

      {/* Payment Processing Modal */}
      {selectedTransaction && selectedTransaction.type === 'REDEEM' && (
        <PaymentProcessingModal
          transaction={selectedTransaction}
          isOpen={false} // This will be controlled by the parent
          onClose={onPaymentModalClose}
          onProcessPayment={onProcessPayment}
        />
      )}
    </>
  )
}
