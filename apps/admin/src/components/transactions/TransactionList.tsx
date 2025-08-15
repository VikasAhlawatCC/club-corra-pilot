  'use client'

import React from 'react'
import { TransactionTable } from './TransactionTable'
import { TransactionDetailModal } from './TransactionDetailModal'
import { TransactionVerificationModal } from './TransactionVerificationModal'
import { PaymentProcessingModal } from './PaymentProcessingModal'
import { TransactionActionButtons } from './TransactionActionButtons'
import type { CoinTransaction } from '@shared/schemas'

interface TransactionListProps {
  transactions: CoinTransaction[]
  isLoading: boolean
  selectedTransaction: CoinTransaction | null
  showDetailModal: boolean
  showVerificationModal: boolean
  onTransactionSelect: (transaction: CoinTransaction) => void
  onDetailModalClose: () => void
  onVerificationModalClose: () => void
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
  showVerificationModal,
  onTransactionSelect,
  onDetailModalClose,
  onVerificationModalClose,
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

      {/* Stable Modal Container - Prevents DOM manipulation errors */}
      <div className="modal-container">
        {/* Transaction Verification Modal for Pending Transactions */}
        {selectedTransaction && selectedTransaction.status === 'PENDING' && (
          <div key={`verification-container-${selectedTransaction.id}`}>
            <TransactionVerificationModal
              key={`verification-${selectedTransaction.id}`}
              transaction={selectedTransaction}
              isOpen={showVerificationModal}
              onClose={onVerificationModalClose}
              onApprove={async (transactionId: string, verificationData: any) => {
                if (selectedTransaction.type === 'EARN') {
                  await onApproveEarn(transactionId, verificationData.adminNotes)
                } else if (selectedTransaction.type === 'REDEEM') {
                  await onApproveRedeem(transactionId, verificationData.adminNotes)
                }
              }}
              onReject={async (transactionId: string, reason: string, adminNotes?: string) => {
                if (selectedTransaction.type === 'EARN') {
                  await onRejectEarn(transactionId, reason)
                } else if (selectedTransaction.type === 'REDEEM') {
                  await onRejectRedeem(transactionId, reason)
                }
              }}
              onApproveAndPay={selectedTransaction.type === 'REDEEM' ? async (transactionId: string, verificationData: any) => {
                // For redeem transactions, we can process payment after approval
                await onApproveRedeem(transactionId, verificationData.adminNotes)
                // TODO: Handle payment processing
              } : undefined}
            />
          </div>
        )}

        {/* Transaction Detail Modal for Completed Transactions */}
        {selectedTransaction && selectedTransaction.status !== 'PENDING' && (
          <div key={`detail-container-${selectedTransaction.id}`}>
            <TransactionDetailModal
              key={`detail-${selectedTransaction.id}`}
              transaction={selectedTransaction}
              isOpen={showDetailModal}
              onClose={onDetailModalClose}
            />
          </div>
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
      </div>
    </>
  )
}
