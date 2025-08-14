import { create } from 'zustand';
import { coinsService } from '../services/coins.service';
import { balanceResponseSchema, transactionListResponseSchema, coinTransactionSchema } from '@shared/schemas';
import type { z } from 'zod';

type BalanceResponse = z.infer<typeof balanceResponseSchema>;
type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;
type CoinTransaction = z.infer<typeof coinTransactionSchema>;

interface CoinsState {
  balance: BalanceResponse | null;
  transactions: CoinTransaction[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  
  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: (searchParams?: any) => Promise<void>;
  processWelcomeBonus: (userId: string, mobileNumber: string) => Promise<void>;
  createEarnTransaction: (transactionData: any) => Promise<void>;
  createRedeemTransaction: (transactionData: any) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  balance: null,
  transactions: [],
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

export const useCoinsStore = create<CoinsState>((set, get) => ({
  ...initialState,

  fetchBalance: async () => {
    try {
      set({ isLoading: true, error: null });
      const balance = await coinsService.getBalance();
      set({ balance, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
        isLoading: false 
      });
    }
  },

  fetchTransactions: async (searchParams = { page: 1, limit: 20 }) => {
    try {
      set({ isLoading: true, error: null });
      const response = await coinsService.getTransactions(searchParams);
      
      set({
        transactions: response.transactions,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        isLoading: false 
      });
    }
  },

  processWelcomeBonus: async (userId: string, mobileNumber: string) => {
    try {
      set({ isLoading: true, error: null });
      await coinsService.processWelcomeBonus({ userId, mobileNumber });
      // Refresh balance after welcome bonus
      await get().fetchBalance();
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to process welcome bonus',
        isLoading: false 
      });
    }
  },

  createEarnTransaction: async (transactionData: any) => {
    try {
      set({ isLoading: true, error: null });
      await coinsService.createEarnTransaction(transactionData);
      // Refresh transactions and balance
      await get().fetchTransactions();
      await get().fetchBalance();
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create earn transaction',
        isLoading: false 
      });
    }
  },

  createRedeemTransaction: async (transactionData: any) => {
    try {
      set({ isLoading: true, error: null });
      await coinsService.createRedeemTransaction(transactionData);
      // Refresh transactions and balance
      await get().fetchTransactions();
      await get().fetchBalance();
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create redeem transaction',
        isLoading: false 
      });
    }
  },

  handleRealTimeUpdate: (data: any) => {
    if (data.type === 'BALANCE_UPDATE' && data.newBalance !== undefined) {
      set((state) => ({
        balance: state.balance ? { ...state.balance, balance: data.newBalance } : null
      }));
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),
}));
