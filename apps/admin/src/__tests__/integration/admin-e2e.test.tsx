import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '../../providers/AuthProvider';
import TransactionTable from '../../components/transactions/TransactionTable';
import TransactionDetailModal from '../../components/transactions/TransactionDetailModal';
import TransactionActionButtons from '../../components/transactions/TransactionActionButtons';
import PaymentProcessingModal from '../../components/transactions/PaymentProcessingModal';
import BrandForm from '../../components/brands/BrandForm';
import BrandTable from '../../components/brands/BrandTable';

// Mock the API services
jest.mock('../../services/api', () => ({
  getTransactions: jest.fn(),
  approveTransaction: jest.fn(),
  rejectTransaction: jest.fn(),
  processPayment: jest.fn(),
  getBrands: jest.fn(),
  createBrand: jest.fn(),
  updateBrand: jest.fn(),
  deleteBrand: jest.fn(),
}));

const mockApi = require('../../services/api');

describe('Admin Portal End-to-End Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Setup default mock implementations
    mockApi.getTransactions.mockResolvedValue({
      transactions: [
        {
          id: 'tx-1',
          type: 'EARN',
          status: 'PENDING',
          billAmount: 1000,
          coinsEarned: 300,
          user: { firstName: 'John', lastName: 'Doe', mobileNumber: '9876543210' },
          brand: { name: 'Test Brand 1' },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tx-2',
          type: 'REDEEM',
          status: 'APPROVED',
          billAmount: 500,
          coinsRedeemed: 100,
          user: { firstName: 'Jane', lastName: 'Smith', mobileNumber: '9876543211' },
          brand: { name: 'Test Brand 2' },
          createdAt: new Date().toISOString(),
        },
      ],
      total: 2,
      page: 1,
      limit: 20,
    });

    mockApi.getBrands.mockResolvedValue({
      brands: [
        {
          id: 'brand-1',
          name: 'Test Brand 1',
          description: 'Test brand for earning',
          earningPercentage: 30,
          redemptionPercentage: 100,
          overallMaxCap: 2000,
          brandwiseMaxCap: 2000,
          isActive: true,
        },
        {
          id: 'brand-2',
          name: 'Test Brand 2',
          description: 'Test brand for redemption',
          earningPercentage: 25,
          redemptionPercentage: 90,
          overallMaxCap: 1500,
          brandwiseMaxCap: 1500,
          isActive: true,
        },
      ],
      total: 2,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Transaction Management Workflow', () => {
    it('should display transactions with proper filtering and pagination', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <TransactionTable />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
        expect(screen.getByText('Test Brand 1')).toBeTruthy();
        expect(screen.getByText('Test Brand 2')).toBeTruthy();
      });

      // Verify transaction details
      expect(screen.getByText('₹1,000')).toBeTruthy();
      expect(screen.getByText('₹500')).toBeTruthy();
      expect(screen.getByText('+300 coins')).toBeTruthy();
      expect(screen.getByText('-100 coins')).toBeTruthy();

      // Verify status badges
      expect(screen.getByText('PENDING')).toBeTruthy();
      expect(screen.getByText('APPROVED')).toBeTruthy();
    });

    it('should approve earn request successfully', async () => {
      mockApi.approveTransaction.mockResolvedValue({
        success: true,
        message: 'Transaction approved successfully',
        transaction: {
          id: 'tx-1',
          status: 'APPROVED',
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <TransactionActionButtons
                transaction={{
                  id: 'tx-1',
                  type: 'EARN',
                  status: 'PENDING',
                }}
                onStatusChange={jest.fn()}
              />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Click approve button
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      // Verify API call
      await waitFor(() => {
        expect(mockApi.approveTransaction).toHaveBeenCalledWith('tx-1', {
          adminNotes: '',
        });
      });

      // Verify success message
      expect(screen.getByText('Transaction approved successfully')).toBeTruthy();
    });

    it('should reject earn request with reason', async () => {
      mockApi.rejectTransaction.mockResolvedValue({
        success: true,
        message: 'Transaction rejected successfully',
        transaction: {
          id: 'tx-1',
          status: 'REJECTED',
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <TransactionActionButtons
                transaction={{
                  id: 'tx-1',
                  type: 'EARN',
                  status: 'PENDING',
                }}
                onStatusChange={jest.fn()}
              />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Click reject button
      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      // Enter rejection reason
      const reasonInput = screen.getByPlaceholderText('Enter rejection reason');
      fireEvent.change(reasonInput, { target: { value: 'Invalid receipt' } });

      // Submit rejection
      const submitButton = screen.getByText('Submit Rejection');
      fireEvent.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockApi.rejectTransaction).toHaveBeenCalledWith('tx-1', {
          reason: 'Invalid receipt',
          adminNotes: '',
        });
      });
    });

    it('should process payment for approved redemption', async () => {
      mockApi.processPayment.mockResolvedValue({
        success: true,
        message: 'Payment processed successfully',
        transaction: {
          id: 'tx-2',
          status: 'PAID',
          transactionId: 'ADMIN_TX_12345',
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <PaymentProcessingModal
                transaction={{
                  id: 'tx-2',
                  type: 'REDEEM',
                  status: 'APPROVED',
                  billAmount: 500,
                  coinsRedeemed: 100,
                }}
                isOpen={true}
                onClose={jest.fn()}
                onSuccess={jest.fn()}
              />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Enter transaction ID
      const transactionIdInput = screen.getByPlaceholderText('Enter admin transaction ID');
      fireEvent.change(transactionIdInput, { target: { value: 'ADMIN_TX_12345' } });

      // Add notes
      const notesInput = screen.getByPlaceholderText('Add notes (optional)');
      fireEvent.change(notesInput, { target: { value: 'Payment processed via UPI' } });

      // Process payment
      const processButton = screen.getByText('Process Payment');
      fireEvent.click(processButton);

      // Verify API call
      await waitFor(() => {
        expect(mockApi.processPayment).toHaveBeenCalledWith('tx-2', {
          transactionId: 'ADMIN_TX_12345',
          adminNotes: 'Payment processed via UPI',
        });
      });
    });
  });

  describe('Brand Management Workflow', () => {
    it('should create new brand successfully', async () => {
      mockApi.createBrand.mockResolvedValue({
        success: true,
        message: 'Brand created successfully',
        brand: {
          id: 'brand-3',
          name: 'New Test Brand',
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <BrandForm onSubmit={jest.fn()} />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Fill brand form
      const nameInput = screen.getByPlaceholderText('Enter brand name');
      fireEvent.change(nameInput, { target: { value: 'New Test Brand' } });

      const descriptionInput = screen.getByPlaceholderText('Enter brand description');
      fireEvent.change(descriptionInput, { target: { value: 'New test brand description' } });

      const earningPercentageInput = screen.getByPlaceholderText('Enter earning percentage');
      fireEvent.change(earningPercentageInput, { target: { value: '35' } });

      const redemptionPercentageInput = screen.getByPlaceholderText('Enter redemption percentage');
      fireEvent.change(redemptionPercentageInput, { target: { value: '95' } });

      const overallMaxCapInput = screen.getByPlaceholderText('Enter overall max cap');
      fireEvent.change(overallMaxCapInput, { target: { value: '2500' } });

      const brandwiseMaxCapInput = screen.getByPlaceholderText('Enter brandwise max cap');
      fireEvent.change(brandwiseMaxCapInput, { target: { value: '2500' } });

      // Submit form
      const submitButton = screen.getByText('Create Brand');
      fireEvent.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockApi.createBrand).toHaveBeenCalledWith({
          name: 'New Test Brand',
          description: 'New test brand description',
          earningPercentage: 35,
          redemptionPercentage: 95,
          overallMaxCap: 2500,
          brandwiseMaxCap: 2500,
        });
      });
    });

    it('should update existing brand successfully', async () => {
      mockApi.updateBrand.mockResolvedValue({
        success: true,
        message: 'Brand updated successfully',
        brand: {
          id: 'brand-1',
          name: 'Updated Test Brand 1',
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <BrandForm
                brand={{
                  id: 'brand-1',
                  name: 'Test Brand 1',
                  description: 'Test brand for earning',
                  earningPercentage: 30,
                  redemptionPercentage: 100,
                  overallMaxCap: 2000,
                  brandwiseMaxCap: 2000,
                  isActive: true,
                }}
                onSubmit={jest.fn()}
              />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Update brand name
      const nameInput = screen.getByDisplayValue('Test Brand 1');
      fireEvent.change(nameInput, { target: { value: 'Updated Test Brand 1' } });

      // Update earning percentage
      const earningPercentageInput = screen.getByDisplayValue('30');
      fireEvent.change(earningPercentageInput, { target: { value: '40' } });

      // Submit form
      const submitButton = screen.getByText('Update Brand');
      fireEvent.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockApi.updateBrand).toHaveBeenCalledWith('brand-1', {
          name: 'Updated Test Brand 1',
          description: 'Test brand for earning',
          earningPercentage: 40,
          redemptionPercentage: 100,
          overallMaxCap: 2000,
          brandwiseMaxCap: 2000,
        });
      });
    });

    it('should display brands with proper filtering', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <BrandTable />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Wait for brands to load
      await waitFor(() => {
        expect(screen.getByText('Test Brand 1')).toBeTruthy();
        expect(screen.getByText('Test Brand 2')).toBeTruthy();
      });

      // Verify brand details
      expect(screen.getByText('30%')).toBeTruthy();
      expect(screen.getByText('100%')).toBeTruthy();
      expect(screen.getByText('25%')).toBeTruthy();
      expect(screen.getByText('90%')).toBeTruthy();

      // Verify caps
      expect(screen.getByText('₹2,000')).toBeTruthy();
      expect(screen.getByText('₹1,500')).toBeTruthy();
    });
  });

  describe('Real-time Feature Testing', () => {
    it('should update transaction status in real-time', async () => {
      const mockWebSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      // Mock WebSocket connection
      jest.mock('../../hooks/useWebSocket', () => ({
        useWebSocket: () => mockWebSocket,
      }));

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <TransactionTable />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Simulate real-time status update
      const statusUpdateEvent = {
        event: 'transaction_status_changed',
        data: {
          transactionId: 'tx-1',
          newStatus: 'APPROVED',
        },
      };

      // Trigger WebSocket event
      const statusChangeHandler = mockWebSocket.on.mock.calls.find(
        call => call[0] === 'transaction_status_changed'
      )?.[1];

      if (statusChangeHandler) {
        statusChangeHandler(statusUpdateEvent);
      }

      // Verify status updated in UI
      await waitFor(() => {
        expect(screen.getByText('APPROVED')).toBeTruthy();
      });
    });

    it('should show real-time notifications for new requests', async () => {
      const mockNotification = {
        id: 'notif-1',
        type: 'NEW_REQUEST',
        message: 'New earn request from John Doe',
        isRead: false,
      };

      // Mock notification service
      jest.mock('../../hooks/useNotifications', () => ({
        useNotifications: () => ({
          notifications: [mockNotification],
          markAsRead: jest.fn(),
        }),
      }));

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <TransactionTable />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Verify notification appears
      await waitFor(() => {
        expect(screen.getByText('New earn request from John Doe')).toBeTruthy();
      });
    });
  });

  describe('Performance and Security Testing', () => {
    it('should handle large transaction lists efficiently', async () => {
      // Create large transaction list
      const largeTransactionList = Array.from({ length: 1000 }, (_, i) => ({
        id: `tx-${i}`,
        type: i % 2 === 0 ? 'EARN' : 'REDEEM',
        status: 'PENDING',
        billAmount: 1000 + i * 10,
        coinsEarned: i % 2 === 0 ? 300 + i * 3 : undefined,
        coinsRedeemed: i % 2 === 1 ? 100 + i : undefined,
        user: { firstName: `User${i}`, lastName: `Last${i}`, mobileNumber: `98765432${i.toString().padStart(2, '0')}` },
        brand: { name: `Brand${i % 5}` },
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }));

      mockApi.getTransactions.mockResolvedValue({
        transactions: largeTransactionList,
        total: 1000,
        page: 1,
        limit: 20,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <TransactionTable />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Verify transactions load without performance issues
      await waitFor(() => {
        expect(screen.getByText('User0')).toBeTruthy();
        expect(screen.getByText('User999')).toBeTruthy();
      });
    });

    it('should validate form inputs correctly', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <BrandForm onSubmit={jest.fn()} />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Try to submit without required fields
      const submitButton = screen.getByText('Create Brand');
      fireEvent.click(submitButton);

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText('Brand name is required')).toBeTruthy();
        expect(screen.getByText('Earning percentage is required')).toBeTruthy();
        expect(screen.getByText('Redemption percentage is required')).toBeTruthy();
      });

      // Test invalid percentage values
      const earningPercentageInput = screen.getByPlaceholderText('Enter earning percentage');
      fireEvent.change(earningPercentageInput, { target: { value: '150' } });

      const redemptionPercentageInput = screen.getByPlaceholderText('Enter redemption percentage');
      fireEvent.change(redemptionPercentageInput, { target: { value: '-10' } });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Earning percentage must be between 0 and 100')).toBeTruthy();
        expect(screen.getByText('Redemption percentage must be between 0 and 100')).toBeTruthy();
      });
    });

    it('should enforce admin authentication for sensitive operations', async () => {
      // Mock unauthenticated state
      jest.mock('../../hooks/useAuth', () => ({
        useAuth: () => ({
          isAuthenticated: false,
          user: null,
        }),
      }));

      render(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AuthProvider>
              <TransactionActionButtons
                transaction={{
                  id: 'tx-1',
                  type: 'EARN',
                  status: 'PENDING',
                }}
                onStatusChange={jest.fn()}
              />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Verify action buttons are disabled for unauthenticated users
      const approveButton = screen.getByText('Approve');
      const rejectButton = screen.getByText('Reject');

      expect(approveButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });
  });
});
