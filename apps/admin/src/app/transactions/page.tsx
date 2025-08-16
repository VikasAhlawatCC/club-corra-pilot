'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { useToast, ToastContainer } from '@/components/common'
import { transactionApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminWebSocket } from '@/hooks/useWebSocket'
import type { CoinTransaction } from '@shared/schemas'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<CoinTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const { user } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  
  // WebSocket integration for real-time updates
  const { isConnected, pendingRequestCounts, recentActivity, connectionError } = useAdminWebSocket()

  // Refs to track modal state more reliably
  const modalOpenRef = useRef(false)
  const selectedTransactionRef = useRef<CoinTransaction | null>(null)

  // Transaction action handlers
  const handleApproveEarn = async (transactionId: string, adminNotes?: string) => {
    try {
      await transactionApi.approveEarnTransaction(transactionId, user?.id || 'admin-123', adminNotes)
      showSuccess('Earn transaction approved successfully')
      fetchTransactions()
    } catch (error) {
      console.error('Failed to approve earn transaction:', error)
      showError('Failed to approve earn transaction')
    }
  }

  const handleRejectEarn = async (transactionId: string, adminNotes: string) => {
    try {
      await transactionApi.rejectEarnTransaction(transactionId, user?.id || 'admin-123', adminNotes)
      showSuccess('Earn transaction rejected successfully')
      fetchTransactions()
    } catch (error) {
      console.error('Failed to reject earn transaction:', error)
      showError('Failed to reject earn transaction')
    }
  }

  const handleApproveRedeem = async (transactionId: string, adminNotes?: string) => {
    try {
      await transactionApi.approveRedeemTransaction(transactionId, user?.id || 'admin-123', adminNotes)
      showSuccess('Redeem transaction approved successfully')
      fetchTransactions()
    } catch (error) {
      console.error('Failed to approve redeem transaction:', error)
      showError('Failed to approve redeem transaction')
    }
  }

  const handleRejectRedeem = async (transactionId: string, adminNotes: string) => {
    try {
      await transactionApi.rejectRedeemTransaction(transactionId, user?.id || 'admin-123', adminNotes)
      showSuccess('Redeem transaction rejected successfully')
      fetchTransactions()
    } catch (error) {
      console.error('Failed to reject redeem transaction:', error)
      showError('Failed to reject redeem transaction')
    }
  }

  const handleProcessPayment = async (
    transactionId: string,
    paymentTransactionId: string,
    paymentMethod: string,
    paymentAmount: number,
    adminNotes?: string
  ) => {
    try {
      await transactionApi.processPayment(
        transactionId,
        user?.id || 'admin-123',
        paymentTransactionId,
        paymentMethod,
        paymentAmount,
        adminNotes
      )
      showSuccess('Payment processed successfully')
      fetchTransactions()
    } catch (error) {
      console.error('Failed to process payment:', error)
      showError('Failed to process payment')
    }
  }

  // Fetch transactions from API
  useEffect(() => {
    fetchTransactions()
  }, [statusFilter, typeFilter, searchTerm])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      // Use the proper API service instead of direct fetch
      const response = await transactionApi.getPendingTransactions(
        currentPage || 1,
        20,
        typeFilter === 'all' ? undefined : typeFilter as 'EARN' | 'REDEEM'
      )
      setTransactions(response.data?.data || [])
      setTotalPages(response.data?.totalPages || 1)
      setTotalTransactions(response.data?.total || 0)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      showError('Failed to fetch transactions')
      // Set empty state instead of mock data
      setTransactions([])
      setTotalPages(1)
      setTotalTransactions(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter transactions based on search and filters
  useEffect(() => {
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.brand?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status.toLowerCase() === statusFilter.toLowerCase())
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, statusFilter, typeFilter])

  // Simple state management
  const [selectedTransaction, setSelectedTransaction] = useState<CoinTransaction | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [isSelectingTransaction, setIsSelectingTransaction] = useState(false)

  const handleTransactionSelect = useCallback((transaction: CoinTransaction) => {
    // Prevent rapid successive clicks
    if (isSelectingTransaction) {
      return
    }
    
    setIsSelectingTransaction(true)
    
    // Set the transaction first
    setSelectedTransaction(transaction)
    selectedTransactionRef.current = transaction
    
    // Open the appropriate modal immediately
    if (transaction.status === 'PENDING') {
      setShowVerificationModal(true)
      setShowDetailModal(false) // Ensure detail modal is closed
      modalOpenRef.current = true
    } else {
      setShowDetailModal(true)
      setShowVerificationModal(false) // Ensure verification modal is closed
      modalOpenRef.current = true
    }
    
    // Re-enable selection after modal is fully open
    setTimeout(() => {
      setIsSelectingTransaction(false)
    }, 500) // Increased from 300ms to 500ms for better stability
  }, [isSelectingTransaction])

  const handleDetailModalClose = useCallback(() => {
    setShowDetailModal(false)
    modalOpenRef.current = false
    // Don't immediately clear selectedTransaction to prevent flickering
    // Clear it after a short delay to ensure smooth transition
    setTimeout(() => {
      setSelectedTransaction(null)
      selectedTransactionRef.current = null
    }, 100)
  }, [])

  const handleVerificationModalClose = useCallback(() => {
    setShowVerificationModal(false)
    modalOpenRef.current = false
    // Don't immediately clear selectedTransaction to prevent flickering
    // Clear it after a short delay to ensure smooth transition
    setTimeout(() => {
      setSelectedTransaction(null)
      selectedTransactionRef.current = null
    }, 100)
  }, [])

  const handlePaymentModalClose = useCallback(() => {
    // Payment modal is controlled by the TransactionList component
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchTransactions()
  }

  // Get connection status display
  const getConnectionStatusDisplay = () => {
    if (isConnected) {
      return {
        status: 'Live Updates Connected',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    } else if (connectionError) {
      return {
        status: 'Connection Error',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    } else {
      return {
        status: 'Connecting...',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      }
    }
  }

  const connectionStatus = getConnectionStatusDisplay()

  // Clean up state when transactions change or component unmounts
  useEffect(() => {
    return () => {
      // Only cleanup if not selecting and no modals are open
      if (!isSelectingTransaction && !modalOpenRef.current) {
        setSelectedTransaction(null)
        setShowDetailModal(false)
        setShowVerificationModal(false)
        selectedTransactionRef.current = null
        modalOpenRef.current = false
      }
    }
  }, [isSelectingTransaction])

  // Reset selection state when transactions change - but only if no modal is open
  useEffect(() => {
    // Only reset if we have a selected transaction and it's no longer in the list
    if (selectedTransaction && !transactions.find(t => t.id === selectedTransaction?.id)) {
      // Don't reset if we're currently showing a modal
      if (!modalOpenRef.current) {
        setSelectedTransaction(null)
        selectedTransactionRef.current = null
      }
    }
  }, [transactions, selectedTransaction])

  // Prevent modal from closing when transactions are refreshed
  useEffect(() => {
    // If we have a selected transaction and a modal is open, preserve the state
    if (selectedTransaction && modalOpenRef.current) {
      // Check if the selected transaction still exists in the current transactions
      const transactionExists = transactions.find(t => t.id === selectedTransaction.id)
      if (!transactionExists) {
        // Only close if the transaction was actually removed/deleted
        setShowDetailModal(false)
        setShowVerificationModal(false)
        setSelectedTransaction(null)
        selectedTransactionRef.current = null
        modalOpenRef.current = false
      }
    }
  }, [transactions, selectedTransaction])

  // Synchronize refs with state when component re-renders
  useEffect(() => {
    modalOpenRef.current = showDetailModal || showVerificationModal
    if (!selectedTransaction) {
      selectedTransactionRef.current = null
    }
  }, [showDetailModal, showVerificationModal, selectedTransaction])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
        <p className="text-gray-600">Review and process earn/redeem requests from users</p>
        
        {/* Real-time Status */}
        <div className="mt-4 p-4 rounded-lg border-2 border-dashed ${connectionStatus.borderColor} ${connectionStatus.bgColor}">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${connectionStatus.color} animate-pulse`}></div>
              <div>
                <span className={`font-medium ${connectionStatus.textColor}`}>
                  {connectionStatus.status}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  {isConnected 
                    ? 'Real-time updates are active. You\'ll see new transactions and status changes instantly.'
                    : 'Connection lost. Please check your network and refresh the page to reconnect.'
                  }
                </p>
              </div>
            </div>
            
            {isConnected && (
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Pending Requests</div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-blue-600">{pendingRequestCounts.earn}</span>
                    <span className="text-gray-500">Earn</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-purple-600">{pendingRequestCounts.redeem}</span>
                    <span className="text-gray-500">Redeem</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{pendingRequestCounts.total}</span>
                    <span className="text-gray-500">Total</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {!isConnected && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Reconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Transaction List */}
      <TransactionList
        transactions={filteredTransactions}
        isLoading={isLoading}
        selectedTransaction={selectedTransaction}
        showDetailModal={showDetailModal}
        showVerificationModal={showVerificationModal}
        onTransactionSelect={handleTransactionSelect}
        onDetailModalClose={handleDetailModalClose}
        onVerificationModalClose={handleVerificationModalClose}
        onPaymentModalClose={handlePaymentModalClose}
        onApproveEarn={handleApproveEarn}
        onRejectEarn={handleRejectEarn}
        onApproveRedeem={handleApproveRedeem}
        onRejectRedeem={handleRejectRedeem}
        onProcessPayment={handleProcessPayment}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
