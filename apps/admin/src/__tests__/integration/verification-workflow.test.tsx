import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '../../providers/AuthProvider'
import TransactionList from '../../components/transactions/TransactionList'
import TransactionVerificationModal from '../../components/transactions/TransactionVerificationModal'
import type { CoinTransaction } from '@shared/schemas'

// Mock the API services
jest.mock('../../lib/api', () => ({
  transactionApi: {
    getPendingTransactions: jest.fn(),
    getUserVerificationData: jest.fn(),
    approveEarnTransaction: jest.fn(),
    rejectEarnTransaction: jest.fn(),
    approveRedeemTransaction: jest.fn(),
    rejectRedeemTransaction: jest.fn(),
    processPayment: jest.fn(),
  },
}))

const mockTransactions: CoinTransaction[] = [
  {
    id: 'tx-1',
    userId: 'user-1',
    type: 'EARN',
    status: 'PENDING',
    billAmount: 1000,
    billDate: new Date('2024-01-15'),
    receiptUrl: 'https://example.com/receipt1.jpg',
    coinsEarned: 300,
    coinsRedeemed: 0,
    brandId: 'brand-1',
    brand: {
      id: 'brand-1',
      name: 'Brand A',
      description: 'Brand A description',
      earningPercentage: 30,
      redemptionPercentage: 100,
      maxRedemptionAmount: 2000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'tx-2',
    userId: 'user-2',
    type: 'REDEEM',
    status: 'PENDING',
    billAmount: 500,
    billDate: new Date('2024-01-16'),
    receiptUrl: 'https://example.com/receipt2.jpg',
    coinsEarned: 0,
    coinsRedeemed: 100,
    brandId: 'brand-2',
    brand: {
      id: 'brand-2',
      name: 'Brand B',
      description: 'Brand B description',
      earningPercentage: 25,
      redemptionPercentage: 90,
      maxRedemptionAmount: 1500,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date('2024-01-16T11:00:00Z'),
    updatedAt: new Date('2024-01-16T11:00:00Z'),
  },
]

const mockUserDetails = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  mobileNumber: '9876543210',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
  },
  paymentDetails: {
    mobileNumber: '9876543210',
    upiId: 'john@upi',
  },
}

const mockPendingRequests = {
  data: [mockTransactions[0]],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
}

describe('Verification Workflow Integration Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    // Setup default mock implementations
    const { transactionApi } = require('../../lib/api')
    transactionApi.getPendingTransactions.mockResolvedValue({
      success: true,
      message: 'Pending transactions retrieved successfully',
      data: {
        data: mockTransactions,
        total: mockTransactions.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    })

    transactionApi.getUserVerificationData.mockResolvedValue({
      success: true,
      data: {
        user: mockUserDetails,
        pendingRequests: mockPendingRequests,
      },
    })

    transactionApi.approveEarnTransaction.mockResolvedValue({
      success: true,
      message: 'Transaction approved successfully',
      data: { transaction: { ...mockTransactions[0], status: 'APPROVED' } },
    })

    transactionApi.rejectEarnTransaction.mockResolvedValue({
      success: true,
      message: 'Transaction rejected successfully',
      data: { transactionId: 'tx-1', adminNotes: 'Amount mismatch' },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Verification Workflow', () => {
    it('should complete full earn transaction verification workflow', async () => {
      const user = userEvent.setup()
      const { transactionApi } = require('../../lib/api')

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              <TransactionList />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      )

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText('Brand A')).toBeInTheDocument()
        expect(screen.getByText('₹1,000.00')).toBeInTheDocument()
      })

      // Click verify button
      const verifyButton = screen.getByRole('button', { name: /verify/i })
      await user.click(verifyButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Verify receipt')).toBeInTheDocument()
      })

      // Fill verification form
      const observedInput = screen.getByLabelText(/Enter the amount observed on the receipt/i)
      await user.type(observedInput, '1000')

      const verificationCheckbox = screen.getByRole('checkbox', { name: /confirm receipt verification/i })
      await user.click(verificationCheckbox)

      // Submit approval
      const approveButton = screen.getByRole('button', { name: /approve/i })
      await user.click(approveButton)

      // Verify API call
      await waitFor(() => {
        expect(transactionApi.approveEarnTransaction).toHaveBeenCalledWith(
          'tx-1',
          expect.any(String), // adminUserId
          undefined // adminNotes
        )
      })

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should complete full redeem transaction verification workflow', async () => {
      const user = userEvent.setup()
      const { transactionApi } = require('../../lib/api')

      // Mock user verification data for redeem transaction
      transactionApi.getUserVerificationData.mockResolvedValue({
        success: true,
        data: {
          user: mockUserDetails,
          pendingRequests: {
            data: [mockTransactions[1]],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        },
      })

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              <TransactionList />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      )

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText('Brand B')).toBeInTheDocument()
        expect(screen.getByText('₹500.00')).toBeInTheDocument()
      })

      // Click verify button for redeem transaction
      const verifyButtons = screen.getAllByRole('button', { name: /verify/i })
      const redeemVerifyButton = verifyButtons[1] // Second verify button for redeem transaction
      await user.click(redeemVerifyButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Verify receipt')).toBeInTheDocument()
      })

      // Fill verification form
      const observedInput = screen.getByLabelText(/Enter the amount observed on the receipt/i)
      await user.type(observedInput, '500')

      const verificationCheckbox = screen.getByRole('checkbox', { name: /confirm receipt verification/i })
      await user.click(verificationCheckbox)

      // Submit approval and payment
      const approveAndPayButton = screen.getByRole('button', { name: /approve & pay/i })
      await user.click(approveAndPayButton)

      // Verify API call
      await waitFor(() => {
        expect(transactionApi.approveRedeemTransaction).toHaveBeenCalledWith(
          'tx-2',
          expect.any(String), // adminUserId
          undefined // adminNotes
        )
      })

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should handle transaction rejection workflow', async () => {
      const user = userEvent.setup()
      const { transactionApi } = require('../../lib/api')

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              <TransactionList />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      )

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText('Brand A')).toBeInTheDocument()
      })

      // Click verify button
      const verifyButton = screen.getByRole('button', { name: /verify/i })
      await user.click(verifyButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Add rejection note
      const rejectionNoteInput = screen.getByLabelText(/Add reason for rejection if applicable/i)
      await user.type(rejectionNoteInput, 'Amount mismatch on receipt')

      // Submit rejection
      const rejectButton = screen.getByRole('button', { name: /reject/i })
      await user.click(rejectButton)

      // Verify API call
      await waitFor(() => {
        expect(transactionApi.rejectEarnTransaction).toHaveBeenCalledWith(
          'tx-1',
          expect.any(String), // adminUserId
          'Amount mismatch on receipt' // adminNotes
        )
      })

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling in Workflow', () => {
    it('should handle API errors gracefully during verification', async () => {
      const user = userEvent.setup()
      const { transactionApi } = require('../../lib/api')

      // Mock API error
      transactionApi.getUserVerificationData.mockRejectedValue(new Error('Network error'))

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              <TransactionList />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      )

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText('Brand A')).toBeInTheDocument()
      })

      // Click verify button
      const verifyButton = screen.getByRole('button', { name: /verify/i })
      await user.click(verifyButton)

      // Modal should open and show error
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Failed to load user data. Please try again.')).toBeInTheDocument()
      })

      // Error should be dismissible
      const dismissButton = screen.getByText('Dismiss')
      await user.click(dismissButton)

      expect(screen.queryByText('Failed to load user data. Please try again.')).not.toBeInTheDocument()
    })

    it('should handle approval submission errors', async () => {
      const user = userEvent.setup()
      const { transactionApi } = require('../../lib/api')

      // Mock approval error
      transactionApi.approveEarnTransaction.mockRejectedValue(new Error('Approval failed'))

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              <TransactionList />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      )

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText('Brand A')).toBeInTheDocument()
      })

      // Click verify button
      const verifyButton = screen.getByRole('button', { name: /verify/i })
      await user.click(verifyButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Fill verification form
      const observedInput = screen.getByLabelText(/Enter the amount observed on the receipt/i)
      await user.type(observedInput, '1000')

      const verificationCheckbox = screen.getByRole('checkbox', { name: /confirm receipt verification/i })
      await user.click(verificationCheckbox)

      // Submit approval
      const approveButton = screen.getByRole('button', { name: /approve/i })
      await user.click(approveButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to approve transaction. Please try again.')).toBeInTheDocument()
      })

      // Modal should remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Performance and User Experience', () => {
    it('should show loading states during form submission', async () => {
      const user = userEvent.setup()
      const { transactionApi } = require('../../lib/api')

      // Mock slow approval
      transactionApi.approveEarnTransaction.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              <TransactionList />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      )

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText('Brand A')).toBeInTheDocument()
      })

      // Click verify button
      const verifyButton = screen.getByRole('button', { name: /verify/i })
      await user.click(verifyButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Fill verification form
      const observedInput = screen.getByLabelText(/Enter the amount observed on the receipt/i)
      await user.type(observedInput, '1000')

      const verificationCheckbox = screen.getByRole('checkbox', { name: /confirm receipt verification/i })
      await user.click(verificationCheckbox)

      // Submit approval
      const approveButton = screen.getByRole('button', { name: /approve/i })
      await user.click(approveButton)

      // Should show loading state
      expect(screen.getByText('Approving...')).toBeInTheDocument()
      expect(approveButton).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Approving...')).not.toBeInTheDocument()
      })
    })

    it('should maintain form state during navigation', async () => {
      const user = userEvent.setup()

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              <TransactionList />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      )

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText('Brand A')).toBeInTheDocument()
      })

      // Click verify button
      const verifyButton = screen.getByRole('button', { name: /verify/i })
      await user.click(verifyButton)

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Fill some form data
      const observedInput = screen.getByLabelText(/Enter the amount observed on the receipt/i)
      await user.type(observedInput, '1000')

      const adminNotesInput = screen.getByLabelText(/Add optional admin notes/i)
      await user.type(adminNotesInput, 'Test notes')

      // Navigate to next request (if available)
      const nextButton = screen.getByLabelText(/Next request/i)
      if (!nextButton.disabled) {
        await user.click(nextButton)

        // Form should reset for new request
        expect(screen.getByDisplayValue('')).toBeInTheDocument()
        expect(screen.getByDisplayValue('')).toBeInTheDocument()
      }
    })
  })
})
