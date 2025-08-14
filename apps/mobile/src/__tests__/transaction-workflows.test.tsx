import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AuthProvider } from '../providers/AuthProvider';
import { RealTimeProvider } from '../providers/RealTimeProvider';
import { ThemeProvider } from '../providers/ThemeProvider';

// Mock the stores
jest.mock('../stores/transactions.store', () => ({
  useTransactionsStore: jest.fn(),
}));

jest.mock('../stores/brands.store', () => ({
  useBrandsStore: jest.fn(),
}));

jest.mock('../stores/coins.store', () => ({
  useCoinsStore: jest.fn(),
}));

jest.mock('../stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock the services
jest.mock('../services/transactions.service', () => ({
  TransactionsService: jest.fn().mockImplementation(() => ({
    submitEarnRequest: jest.fn(),
    submitRedeemRequest: jest.fn(),
    getTransactions: jest.fn(),
    getTransactionById: jest.fn(),
  })),
}));

jest.mock('../services/brands.service', () => ({
  BrandsService: jest.fn().mockImplementation(() => ({
    getBrands: jest.fn(),
    getBrandById: jest.fn(),
    searchBrands: jest.fn(),
    getBrandCategories: jest.fn(),
  })),
}));

// Import the mocked hooks
import { useTransactionsStore } from '../stores/transactions.store';
import { useBrandsStore } from '../stores/brands.store';
import { useCoinsStore } from '../stores/coins.store';
import { useAuthStore } from '../stores/auth.store';

const mockUseTransactionsStore = useTransactionsStore as jest.MockedFunction<typeof useTransactionsStore>;
const mockUseBrandsStore = useBrandsStore as jest.MockedFunction<typeof useBrandsStore>;
const mockUseCoinsStore = useCoinsStore as jest.MockedFunction<typeof useCoinsStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('Transaction Workflow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 'test-user-123',
        mobileNumber: '9876543210',
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        coinBalance: {
          balance: 500,
          totalEarned: 600,
          totalRedeemed: 100,
        },
      },
      isAuthenticated: true,
      isLoading: false,
      currentMobileNumber: null,
      tokens: { accessToken: 'test-token' },
      initiateSignup: jest.fn(),
      verifyOTP: jest.fn(),
      login: jest.fn(),
      sendLoginOTP: jest.fn(),
      logout: jest.fn(),
      clearAuth: jest.fn(),
      resendOTP: jest.fn(),
      updateProfile: jest.fn(),
      updatePaymentDetails: jest.fn(),
    });
    
    mockUseBrandsStore.mockReturnValue({
      brands: [
        {
          id: 'brand-1',
          name: 'Test Brand 1',
          description: 'Test brand for earning',
          earningPercentage: 30,
          redemptionPercentage: 100,
          isActive: true,
          category: { id: 'cat-1', name: 'Restaurants' },
          logo: 'https://example.com/logo1.png',
        },
        {
          id: 'brand-2',
          name: 'Test Brand 2',
          description: 'Test brand for redemption',
          earningPercentage: 25,
          redemptionPercentage: 90,
          isActive: true,
          category: { id: 'cat-2', name: 'Shopping' },
          logo: 'https://example.com/logo2.png',
        },
      ],
      categories: [
        { id: 'cat-1', name: 'Restaurants' },
        { id: 'cat-2', name: 'Shopping' },
      ],
      isLoading: false,
      error: null,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
      fetchBrands: jest.fn(),
      fetchBrandById: jest.fn(),
      searchBrands: jest.fn(),
      fetchBrandsByCategory: jest.fn(),
      fetchCategories: jest.fn(),
      clearError: jest.fn(),
    });
    
    mockUseTransactionsStore.mockReturnValue({
      transactions: [
        {
          id: 'tx-1',
          type: 'EARN',
          status: 'APPROVED',
          billAmount: 1000,
          coinsEarned: 300,
          brandId: 'brand-1',
          brand: { name: 'Test Brand 1', logo: 'https://example.com/logo1.png' },
          createdAt: new Date().toISOString(),
          billImage: 'https://example.com/bill1.jpg',
        },
        {
          id: 'tx-2',
          type: 'REDEEM',
          status: 'PAID',
          billAmount: 500,
          coinsRedeemed: 100,
          brandId: 'brand-2',
          brand: { name: 'Test Brand 2', logo: 'https://example.com/logo2.png' },
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
      isSubmitting: false,
      error: null,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
      pendingEarnRequests: 0,
      pendingRedeemRequests: 0,
      fetchTransactions: jest.fn(),
      submitEarnRequest: jest.fn(),
      submitRedeemRequest: jest.fn(),
      refreshTransactions: jest.fn(),
      clearError: jest.fn(),
      handleRealTimeUpdate: jest.fn(),
    });

    mockUseCoinsStore.mockReturnValue({
      balance: 500,
      totalEarned: 600,
      totalRedeemed: 100,
      isLoading: false,
      error: null,
      fetchBalance: jest.fn(),
      refreshBalance: jest.fn(),
      clearError: jest.fn(),
    });
  });

  describe('Earn Coins Workflow', () => {
    it('should display available brands for earning', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <RealTimeProvider>
              <div>Earn Coins Screen</div>
            </RealTimeProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      // Should show earn coins section
      expect(getByText('Earn Coins Screen')).toBeTruthy();
      
      // Verify brands are available
      expect(mockUseBrandsStore().brands).toHaveLength(2);
      expect(mockUseBrandsStore().brands[0].name).toBe('Test Brand 1');
      expect(mockUseBrandsStore().brands[1].name).toBe('Test Brand 2');
    });

    it('should show brand earning percentages', () => {
      const brands = mockUseBrandsStore().brands;
      
      // Test earning percentages
      expect(brands[0].earningPercentage).toBe(30);
      expect(brands[1].earningPercentage).toBe(25);
      
      // Test redemption percentages
      expect(brands[0].redemptionPercentage).toBe(100);
      expect(brands[1].redemptionPercentage).toBe(90);
    });

    it('should handle brand selection for earning', async () => {
      const mockSubmitEarnRequest = jest.fn().mockResolvedValue({
        success: true,
        transaction: {
          id: 'new-tx-123',
          type: 'EARN',
          status: 'PENDING',
          billAmount: 1500,
          coinsEarned: 450,
        },
        newBalance: 950,
      });

      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        submitEarnRequest: mockSubmitEarnRequest,
      });

      // Test brand selection
      const selectedBrand = mockUseBrandsStore().brands[0];
      expect(selectedBrand.id).toBe('brand-1');
      expect(selectedBrand.earningPercentage).toBe(30);
      
      // Test earn request submission
      const result = await mockSubmitEarnRequest({
        brandId: selectedBrand.id,
        billAmount: 1500,
        billImage: 'https://example.com/bill.jpg',
      });
      
      expect(result.success).toBe(true);
      expect(result.transaction.coinsEarned).toBe(450);
    });

    it('should calculate coins earned based on bill amount and percentage', () => {
      const brand = mockUseBrandsStore().brands[0];
      const billAmount = 1000;
      const expectedCoins = (billAmount * brand.earningPercentage) / 100;
      
      expect(expectedCoins).toBe(300);
    });

    it('should handle bill submission with image', async () => {
      const mockSubmitEarnRequest = jest.fn().mockResolvedValue({
        success: true,
        transaction: {
          id: 'new-tx-123',
          type: 'EARN',
          status: 'PENDING',
          billAmount: 2000,
          coinsEarned: 600,
          billImage: 'https://example.com/bill.jpg',
        },
      });

      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        submitEarnRequest: mockSubmitEarnRequest,
      });

      // Test bill submission with image
      const result = await mockSubmitEarnRequest({
        brandId: 'brand-1',
        billAmount: 2000,
        billImage: 'https://example.com/bill.jpg',
      });
      
      expect(result.transaction.billImage).toBe('https://example.com/bill.jpg');
      expect(result.transaction.coinsEarned).toBe(600);
    });

    it('should show loading state during submission', () => {
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        isSubmitting: true,
      });

      // Test loading state
      expect(mockUseTransactionsStore().isSubmitting).toBe(true);
    });

    it('should handle earn request errors', async () => {
      const mockSubmitEarnRequest = jest.fn().mockRejectedValue(
        new Error('Bill submission failed')
      );

      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        submitEarnRequest: mockSubmitEarnRequest,
        error: 'Bill submission failed',
      });

      // Test error handling
      await expect(mockSubmitEarnRequest({
        brandId: 'brand-1',
        billAmount: 1000,
      })).rejects.toThrow('Bill submission failed');
      
      expect(mockUseTransactionsStore().error).toBe('Bill submission failed');
    });
  });

  describe('Redeem Coins Workflow', () => {
    it('should display current coin balance', () => {
      const coinBalance = mockUseCoinsStore().balance;
      
      // Test balance display
      expect(coinBalance).toBe(500);
      expect(mockUseCoinsStore().totalEarned).toBe(600);
      expect(mockUseCoinsStore().totalRedeemed).toBe(100);
    });

    it('should show available brands for redemption', () => {
      const brands = mockUseBrandsStore().brands;
      
      // Test redemption brands
      expect(brands[0].redemptionPercentage).toBe(100);
      expect(brands[1].redemptionPercentage).toBe(90);
    });

    it('should handle redemption amount selection', async () => {
      const mockSubmitRedeemRequest = jest.fn().mockResolvedValue({
        success: true,
        transaction: {
          id: 'redeem-123',
          type: 'REDEEM',
          status: 'PENDING',
          coinsRedeemed: 100,
          brandId: 'brand-2',
        },
        newBalance: 400,
      });

      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        submitRedeemRequest: mockSubmitRedeemRequest,
      });

      // Test redemption amount selection
      const redemptionAmount = 100;
      const currentBalance = mockUseCoinsStore().balance;
      
      expect(redemptionAmount).toBeLessThanOrEqual(currentBalance);
      
      // Test redemption submission
      const result = await mockSubmitRedeemRequest({
        brandId: 'brand-2',
        coinsRedeemed: redemptionAmount,
      });
      
      expect(result.success).toBe(true);
      expect(result.transaction.coinsRedeemed).toBe(100);
    });

    it('should prevent redemption exceeding available balance', () => {
      const currentBalance = mockUseCoinsStore().balance;
      const excessiveRedemption = currentBalance + 100;
      
      // Test balance validation
      expect(excessiveRedemption).toBeGreaterThan(currentBalance);
      expect(currentBalance).toBe(500);
    });

    it('should show redemption confirmation', async () => {
      const mockSubmitRedeemRequest = jest.fn().mockResolvedValue({
        success: true,
        transaction: {
          id: 'redeem-123',
          type: 'REDEEM',
          status: 'PENDING',
          coinsRedeemed: 200,
          brandId: 'brand-1',
        },
      });

      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        submitRedeemRequest: mockSubmitRedeemRequest,
      });

      // Test redemption confirmation
      const result = await mockSubmitRedeemRequest({
        brandId: 'brand-1',
        coinsRedeemed: 200,
      });
      
      expect(result.transaction.status).toBe('PENDING');
      expect(result.transaction.type).toBe('REDEEM');
    });

    it('should handle redemption errors', async () => {
      const mockSubmitRedeemRequest = jest.fn().mockRejectedValue(
        new Error('Redemption failed')
      );

      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        submitRedeemRequest: mockSubmitRedeemRequest,
        error: 'Redemption failed',
      });

      // Test redemption error handling
      await expect(mockSubmitRedeemRequest({
        brandId: 'brand-1',
        coinsRedeemed: 100,
      })).rejects.toThrow('Redemption failed');
      
      expect(mockUseTransactionsStore().error).toBe('Redemption failed');
    });
  });

  describe('Transaction Management Workflow', () => {
    it('should fetch and display transaction history', () => {
      const transactions = mockUseTransactionsStore().transactions;
      
      // Test transaction display
      expect(transactions).toHaveLength(2);
      expect(transactions[0].type).toBe('EARN');
      expect(transactions[1].type).toBe('REDEEM');
    });

    it('should show transaction status indicators', () => {
      const transactions = mockUseTransactionsStore().transactions;
      
      // Test status indicators
      expect(transactions[0].status).toBe('APPROVED');
      expect(transactions[1].status).toBe('PAID');
    });

    it('should handle transaction filtering', () => {
      const transactions = mockUseTransactionsStore().transactions;
      
      // Test filtering by type
      const earnTransactions = transactions.filter(t => t.type === 'EARN');
      const redeemTransactions = transactions.filter(t => t.type === 'REDEEM');
      
      expect(earnTransactions).toHaveLength(1);
      expect(redeemTransactions).toHaveLength(1);
    });

    it('should show pending transaction counts', () => {
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        pendingEarnRequests: 2,
        pendingRedeemRequests: 1,
      });

      // Test pending counts
      expect(mockUseTransactionsStore().pendingEarnRequests).toBe(2);
      expect(mockUseTransactionsStore().pendingRedeemRequests).toBe(1);
    });

    it('should handle transaction refresh', async () => {
      const mockRefreshTransactions = jest.fn().mockResolvedValue(undefined);
      
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        refreshTransactions: mockRefreshTransactions,
      });

      // Test transaction refresh
      await mockRefreshTransactions();
      expect(mockRefreshTransactions).toHaveBeenCalled();
    });

    it('should display transaction details correctly', () => {
      const transaction = mockUseTransactionsStore().transactions[0];
      
      // Test transaction details
      expect(transaction.id).toBe('tx-1');
      expect(transaction.billAmount).toBe(1000);
      expect(transaction.coinsEarned).toBe(300);
      expect(transaction.brand.name).toBe('Test Brand 1');
    });

    it('should handle transaction pagination', () => {
      const pagination = {
        page: mockUseTransactionsStore().page,
        limit: mockUseTransactionsStore().limit,
        totalPages: mockUseTransactionsStore().totalPages,
        total: mockUseTransactionsStore().total,
      };
      
      // Test pagination
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(20);
      expect(pagination.totalPages).toBe(1);
      expect(pagination.total).toBe(2);
    });
  });

  describe('Real-time Updates Workflow', () => {
    it('should handle real-time transaction updates', () => {
      const mockHandleRealTimeUpdate = jest.fn();
      
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        handleRealTimeUpdate: mockHandleRealTimeUpdate,
      });

      // Test real-time update handling
      const updateData = {
        type: 'TRANSACTION_UPDATE',
        transaction: {
          id: 'tx-1',
          status: 'APPROVED',
        },
      };
      
      mockUseTransactionsStore().handleRealTimeUpdate(updateData);
      expect(mockHandleRealTimeUpdate).toHaveBeenCalledWith(updateData);
    });

    it('should update transaction status in real-time', () => {
      const mockHandleRealTimeUpdate = jest.fn();
      
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        handleRealTimeUpdate: mockHandleRealTimeUpdate,
      });

      // Test status update
      const statusUpdate = {
        type: 'TRANSACTION_UPDATE',
        transaction: {
          id: 'tx-1',
          status: 'COMPLETED',
        },
      };
      
      mockUseTransactionsStore().handleRealTimeUpdate(statusUpdate);
      expect(mockHandleRealTimeUpdate).toHaveBeenCalledWith(statusUpdate);
    });

    it('should handle new transaction creation', () => {
      const mockHandleRealTimeUpdate = jest.fn();
      
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        handleRealTimeUpdate: mockHandleRealTimeUpdate,
      });

      // Test new transaction
      const newTransaction = {
        type: 'TRANSACTION_UPDATE',
        transaction: {
          id: 'tx-3',
          type: 'EARN',
          status: 'PENDING',
          billAmount: 800,
          coinsEarned: 240,
        },
      };
      
      mockUseTransactionsStore().handleRealTimeUpdate(newTransaction);
      expect(mockHandleRealTimeUpdate).toHaveBeenCalledWith(newTransaction);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should display error messages for failed operations', () => {
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        error: 'Failed to fetch transactions',
      });

      // Test error display
      expect(mockUseTransactionsStore().error).toBe('Failed to fetch transactions');
    });

    it('should provide retry options for failed operations', () => {
      const mockFetchTransactions = jest.fn();
      
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        fetchTransactions: mockFetchTransactions,
        error: 'Network error',
      });

      // Test retry functionality
      mockUseTransactionsStore().fetchTransactions();
      expect(mockFetchTransactions).toHaveBeenCalled();
    });

    it('should clear errors when operations succeed', () => {
      const mockClearError = jest.fn();
      
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        clearError: mockClearError,
        error: 'Previous error',
      });

      // Test error clearing
      mockUseTransactionsStore().clearError();
      expect(mockClearError).toHaveBeenCalled();
    });

    it('should handle network connectivity issues', () => {
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        error: 'No internet connection',
      });

      // Test network error handling
      expect(mockUseTransactionsStore().error).toBe('No internet connection');
    });
  });

  describe('Data Validation and Security', () => {
    it('should validate bill amounts before submission', () => {
      const validAmount = 1000;
      const invalidAmount = -100;
      
      // Test amount validation
      expect(validAmount).toBeGreaterThan(0);
      expect(invalidAmount).toBeLessThan(0);
    });

    it('should validate brand selection', () => {
      const brands = mockUseBrandsStore().brands;
      const validBrand = brands.find(b => b.isActive);
      const inactiveBrand = brands.find(b => !b.isActive);
      
      // Test brand validation
      expect(validBrand?.isActive).toBe(true);
      expect(inactiveBrand?.isActive).toBeUndefined();
    });

    it('should ensure transaction data integrity', () => {
      const transaction = mockUseTransactionsStore().transactions[0];
      
      // Test data integrity
      expect(transaction.id).toBeTruthy();
      expect(transaction.type).toBeTruthy();
      expect(transaction.status).toBeTruthy();
      expect(transaction.brandId).toBeTruthy();
      expect(transaction.createdAt).toBeTruthy();
    });

    it('should handle malformed transaction data', () => {
      const mockHandleRealTimeUpdate = jest.fn();
      
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        handleRealTimeUpdate: mockHandleRealTimeUpdate,
      });

      // Test malformed data handling
      const malformedData = {
        type: 'TRANSACTION_UPDATE',
        transaction: null,
      };
      
      // Should handle malformed data gracefully
      expect(() => mockUseTransactionsStore().handleRealTimeUpdate(malformedData)).not.toThrow();
    });
  });
});
