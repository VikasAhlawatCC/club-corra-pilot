'use client'

import { useState, useEffect } from 'react'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal'
import { PaymentProcessingModal } from '@/components/transactions/PaymentProcessingModal'
import { TransactionActionButtons } from '@/components/transactions/TransactionActionButtons'
import { useToast, ToastContainer } from '@/components/common'
import type { CoinTransaction } from '@shared/schemas'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<CoinTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<CoinTransaction | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Mock data for now - replace with actual API call
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // TODO: Replace with actual API call
        const mockTransactions: CoinTransaction[] = [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            userId: '550e8400-e29b-41d4-a716-446655440010',
            brandId: '550e8400-e29b-41d4-a716-446655440020',
            brand: {
              id: '550e8400-e29b-41d4-a716-446655440020',
              name: 'Starbucks',
              logoUrl: 'https://via.placeholder.com/40x40/006241/FFFFFF?text=S'
            },
            type: 'EARN',
            amount: 45,
            billAmount: 150,
            coinsEarned: 45,
            status: 'PENDING',
            receiptUrl: 'https://via.placeholder.com/300x200/CCCCCC/666666?text=Receipt',
            adminNotes: undefined,
            processedAt: undefined,
            transactionId: undefined,
            billDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            paymentProcessedAt: undefined,
            createdAt: new Date(Date.now() - 2 * 60 * 1000),
            updatedAt: new Date(Date.now() - 2 * 60 * 1000),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            userId: '550e8400-e29b-41d4-a716-446655440011',
            brandId: '550e8400-e29b-41d4-a716-446655440021',
            brand: {
              id: '550e8400-e29b-41d4-a716-446655440021',
              name: 'McDonald\'s',
              logoUrl: 'https://via.placeholder.com/40x40/FFBC0D/000000?text=M'
            },
            type: 'REDEEM',
            amount: 60,
            billAmount: 200,
            coinsRedeemed: 60,
            status: 'APPROVED',
            receiptUrl: undefined,
            adminNotes: 'Approved for payment processing',
            processedAt: new Date(Date.now() - 15 * 60 * 1000),
            transactionId: undefined,
            billDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            paymentProcessedAt: undefined,
            createdAt: new Date(Date.now() - 15 * 60 * 1000),
            updatedAt: new Date(Date.now() - 15 * 60 * 1000),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            userId: '550e8400-e29b-41d4-a716-446655440012',
            brandId: '550e8400-e29b-41d4-a716-446655440022',
            brand: {
              id: '550e8400-e29b-41d4-a716-446655440022',
              name: 'Domino\'s',
              logoUrl: 'https://via.placeholder.com/40x40/E31837/FFFFFF?text=D'
            },
            type: 'EARN',
            amount: 90,
            billAmount: 300,
            coinsEarned: 90,
            status: 'APPROVED',
            receiptUrl: 'https://via.placeholder.com/300x200/CCCCCC/666666?text=Receipt',
            adminNotes: 'Receipt verified and approved',
            processedAt: new Date(Date.now() - 60 * 60 * 1000),
            transactionId: undefined,
            billDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            paymentProcessedAt: undefined,
            createdAt: new Date(Date.now() - 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 60 * 60 * 1000),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            userId: '550e8400-e29b-41d4-a716-446655440013',
            brandId: '550e8400-e29b-41d4-a716-446655440023',
            brand: {
              id: '550e8400-e29b-41d4-a716-446655440023',
              name: 'Amazon',
              logoUrl: 'https://via.placeholder.com/40x40/FF9900/FFFFFF?text=A'
            },
            type: 'REDEEM',
            amount: 25,
            billAmount: 100,
            coinsRedeemed: 25,
            status: 'PAID',
            receiptUrl: undefined,
            adminNotes: 'Payment processed successfully',
            processedAt: new Date(Date.now() - 120 * 60 * 1000),
            transactionId: 'TXN123456789',
            billDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
            paymentProcessedAt: new Date(Date.now() - 120 * 60 * 1000),
            createdAt: new Date(Date.now() - 120 * 60 * 1000),
            updatedAt: new Date(Date.now() - 120 * 60 * 1000),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440005',
            userId: '550e8400-e29b-41d4-a716-446655440014',
            brandId: '550e8400-e29b-41d4-a716-446655440024',
            brand: {
              id: '550e8400-e29b-41d4-a716-446655440024',
              name: 'Flipkart',
              logoUrl: 'https://via.placeholder.com/40x40/2874F0/FFFFFF?text=F'
            },
            type: 'EARN',
            amount: 40,
            billAmount: 800,
            coinsEarned: 40,
            status: 'REJECTED',
            receiptUrl: 'https://via.placeholder.com/300x200/CCCCCC/666666?text=Receipt',
            adminNotes: 'Receipt image unclear, please resubmit',
            processedAt: new Date(Date.now() - 180 * 60 * 1000),
            transactionId: undefined,
            billDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
            paymentProcessedAt: undefined,
            createdAt: new Date(Date.now() - 180 * 60 * 1000),
            updatedAt: new Date(Date.now() - 180 * 60 * 1000),
          }
        ]
        setTransactions(mockTransactions)
        setFilteredTransactions(mockTransactions)
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Filter transactions based on search and filters
  useEffect(() => {
    let filtered = [...transactions]

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.brand?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, statusFilter, typeFilter])

  const handleView = (transaction: CoinTransaction) => {
    setSelectedTransaction(transaction)
    setShowDetailModal(true)
  }

  const handleApprove = async (transactionId: string, adminNotes?: string) => {
    try {
      // TODO: Replace with actual API call
      console.log('Approving transaction:', transactionId, adminNotes)
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'APPROVED', adminNotes }
            : t
        )
      )
      
      showSuccess('Transaction Approved', 'Transaction has been approved successfully')
    } catch (error) {
      console.error('Failed to approve transaction:', error)
      showError('Approval Failed', 'Failed to approve transaction. Please try again.')
    }
  }

  const handleReject = async (transactionId: string, reason: string, adminNotes?: string) => {
    try {
      // TODO: Replace with actual API call
      console.log('Rejecting transaction:', transactionId, reason, adminNotes)
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'REJECTED', adminNotes: adminNotes || reason }
            : t
        )
      )
      
      showSuccess('Transaction Rejected', 'Transaction has been rejected successfully')
    } catch (error) {
      console.error('Failed to reject transaction:', error)
      showError('Rejection Failed', 'Failed to reject transaction. Please try again.')
    }
  }

  const handleProcessPayment = (transactionId: string, adminTransactionId: string, adminNotes?: string) => {
    try {
      // TODO: Replace with actual API call
      console.log('Processing payment:', transactionId, adminTransactionId, adminNotes)
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'PAID', transactionId: adminTransactionId, adminNotes }
            : t
        )
      )
      
      showSuccess('Payment Processed', 'Payment has been processed successfully')
    } catch (error) {
      console.error('Failed to process payment:', error)
      showError('Payment Failed', 'Failed to process payment. Please try again.')
    }
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedTransaction(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
        <p className="mt-2 text-gray-600">
          Review and manage coin earning and redemption requests from users.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by ID, user, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="EARN">Earn</option>
              <option value="REDEEM">Redeem</option>
              <option value="WELCOME_BONUS">Welcome Bonus</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setTypeFilter('all')
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">{transactions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {transactions.filter(t => t.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {transactions.filter(t => t.status === 'APPROVED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paid</p>
              <p className="text-2xl font-semibold text-gray-900">
                {transactions.filter(t => t.status === 'PAID').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        {filteredTransactions.length === 0 && !isLoading ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new transaction.'
              }
            </p>
          </div>
        ) : (
          <TransactionTable
            transactions={filteredTransactions}
            onView={handleView}
            onApprove={handleApprove}
            onReject={handleReject}
            onProcessPayment={handleProcessPayment}
            isLoading={isLoading}
          />
        )}
      </div>

      {showDetailModal && selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
        />
      )}
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
