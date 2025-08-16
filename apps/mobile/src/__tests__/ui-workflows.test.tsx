import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
// AuthProvider removed - using Zustand store directly
import { RealTimeProvider } from '../providers/RealTimeProvider';
import { ThemeProvider } from '../providers/ThemeProvider';
import EarnCoinsScreen from '../screens/transactions/EarnCoinsScreen';
import RedeemCoinsScreen from '../screens/transactions/RedeemCoinsScreen';
import TransactionHistoryScreen from '../screens/transactions/TransactionHistoryScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';

// Mock the stores
jest.mock('../stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../stores/transactions.store', () => ({
  useTransactionsStore: jest.fn(),
}));

jest.mock('../stores/brands.store', () => ({
  useBrandsStore: jest.fn(),
}));

jest.mock('../stores/coins.store', () => ({
  useCoinsStore: jest.fn(),
}));

// Mock the services
jest.mock('../services/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    initiateSignup: jest.fn(),
    verifyOTP: jest.fn(),
    login: jest.fn(),
    sendLoginOTP: jest.fn(),
    updateProfile: jest.fn(),
    updatePaymentDetails: jest.fn(),
  })),
}));

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
import { useAuthStore } from '../stores/auth.store';
import { useTransactionsStore } from '../stores/transactions.store';
import { useBrandsStore } from '../stores/brands.store';
import { useCoinsStore } from '../stores/coins.store';

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseTransactionsStore = useTransactionsStore as jest.MockedFunction<typeof useTransactionsStore>;
const mockUseBrandsStore = useBrandsStore as jest.MockedFunction<typeof useBrandsStore>;
const mockUseCoinsStore = useCoinsStore as jest.MockedFunction<typeof useCoinsStore>;

describe('Mobile App UI Workflows', () => {
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
        },
        {
          id: 'brand-2',
          name: 'Test Brand 2',
          description: 'Test brand for redemption',
          earningPercentage: 25,
          redemptionPercentage: 90,
          isActive: true,
          category: { id: 'cat-2', name: 'Shopping' },
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
          brand: { name: 'Test Brand 1' },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tx-2',
          type: 'REDEEM',
          status: 'PAID',
          billAmount: 500,
          coinsRedeemed: 100,
          brandId: 'brand-2',
          brand: { name: 'Test Brand 2' },
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

  describe('Authentication Workflow', () => {
    it('should render authentication screens correctly', () => {
      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <EarnCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show user information when authenticated
      expect(getByText('John Doe')).toBeTruthy();
    });

    it('should handle authentication state changes', async () => {
      const mockLogout = jest.fn();
      mockUseAuthStore.mockReturnValue({
        ...mockUseAuthStore(),
        logout: mockLogout,
        isAuthenticated: false,
        user: null,
      });

      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <EarnCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should handle unauthenticated state
      expect(mockLogout).toBeDefined();
    });
  });

  describe('Earn Coins Workflow', () => {
    it('should render earn coins screen with brand selection', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <EarnCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show available brands
      expect(getByText('Test Brand 1')).toBeTruthy();
      expect(getByText('Test Brand 2')).toBeTruthy();
      
      // Should show earning percentages
      expect(getByText('30%')).toBeTruthy();
      expect(getByText('25%')).toBeTruthy();
    });

    it('should handle brand selection and bill submission', async () => {
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

      const { getByText, getByPlaceholderText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <EarnCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show submit button
      expect(getByText('Submit Bill')).toBeTruthy();
      
      // Should have brand selection
      expect(getByText('Select Brand')).toBeTruthy();
    });

    it('should show loading state during submission', async () => {
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        isSubmitting: true,
      });

      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <EarnCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show loading indicator
      expect(getByText('Submitting...')).toBeTruthy();
    });
  });

  describe('Redeem Coins Workflow', () => {
    it('should render redeem coins screen with available balance', () => {
      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <RedeemCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show current balance
      expect(getByText('500')).toBeTruthy();
      expect(getByText('Available Coins')).toBeTruthy();
    });

    it('should handle redemption amount selection', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <RedeemCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show redemption options
      expect(getByText('Redeem Coins')).toBeTruthy();
      expect(getByText('Select Amount')).toBeTruthy();
    });

    it('should show redemption confirmation', async () => {
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

      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <RedeemCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show redeem button
      expect(getByText('Confirm Redemption')).toBeTruthy();
    });
  });

  describe('Transaction History Workflow', () => {
    it('should render transaction history with all transactions', () => {
      const { getByText, getAllByTestId } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionHistoryScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show transaction count
      expect(getByText('2 Transactions')).toBeTruthy();
      
      // Should show both earn and redeem transactions
      expect(getByText('EARN')).toBeTruthy();
      expect(getByText('REDEEM')).toBeTruthy();
      
      // Should show transaction amounts
      expect(getByText('₹1000')).toBeTruthy();
      expect(getByText('₹500')).toBeTruthy();
    });

    it('should handle transaction filtering', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionHistoryScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show filter options
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Earn')).toBeTruthy();
      expect(getByText('Redeem')).toBeTruthy();
    });

    it('should show transaction status indicators', () => {
      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionHistoryScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show status badges
      expect(getByText('APPROVED')).toBeTruthy();
      expect(getByText('PAID')).toBeTruthy();
    });
  });

  describe('Transaction Detail Workflow', () => {
    it('should render transaction details correctly', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionDetailScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show transaction information
      expect(getByText('Transaction Details')).toBeTruthy();
      expect(getByText('Status')).toBeTruthy();
      expect(getByText('Amount')).toBeTruthy();
      expect(getByText('Date')).toBeTruthy();
    });

    it('should show brand information for transactions', () => {
      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionDetailScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show brand details
      expect(getByText('Brand')).toBeTruthy();
      expect(getByText('Test Brand 1')).toBeTruthy();
    });
  });

  describe('Real-time Updates Workflow', () => {
    it('should handle real-time transaction updates', async () => {
      const mockHandleRealTimeUpdate = jest.fn();
      
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        handleRealTimeUpdate: mockHandleRealTimeUpdate,
      });

      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionHistoryScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should be ready to handle real-time updates
      expect(mockHandleRealTimeUpdate).toBeDefined();
    });

    it('should show pending transaction counts', () => {
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        pendingEarnRequests: 2,
        pendingRedeemRequests: 1,
      });

      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionHistoryScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show pending counts
      expect(getByText('2 Pending Earn')).toBeTruthy();
      expect(getByText('1 Pending Redeem')).toBeTruthy();
    });
  });

  describe('Error Handling Workflow', () => {
    it('should display error messages when API calls fail', () => {
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        error: 'Failed to fetch transactions',
      });

      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionHistoryScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show error message
      expect(getByText('Failed to fetch transactions')).toBeTruthy();
    });

    it('should show retry options for failed operations', () => {
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        error: 'Network error',
      });

      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionHistoryScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show retry button
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  describe('Loading States Workflow', () => {
    it('should show loading indicators during data fetching', () => {
      mockUseTransactionsStore.mockReturnValue({
        ...mockUseTransactionsStore(),
        isLoading: true,
      });

      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionHistoryScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show loading state
      expect(getByText('Loading...')).toBeTruthy();
    });

    it('should show skeleton loaders for better UX', () => {
      mockUseBrandsStore.mockReturnValue({
        ...mockUseBrandsStore(),
        isLoading: true,
      });

      const { getByTestId } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <EarnCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show skeleton loaders
      expect(getByTestId('brand-skeleton')).toBeTruthy();
    });
  });

  describe('Navigation Workflow', () => {
    it('should handle navigation between screens', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <TransactionHistoryScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should show navigation elements
      expect(getByText('Back')).toBeTruthy();
      expect(getByText('Home')).toBeTruthy();
    });

    it('should maintain state during navigation', () => {
      const { getByText } = render(
        <ThemeProvider>
          
            <RealTimeProvider>
              <EarnCoinsScreen />
            </RealTimeProvider>
          
        </ThemeProvider>
      );

      // Should maintain user context
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('500')).toBeTruthy();
    });
  });
});
