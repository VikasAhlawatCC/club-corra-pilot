import { create } from 'zustand';
import { transactionsService } from '../services/transactions.service';
import { 
  createEarnTransactionSchema, 
  createRedeemTransactionSchema,
  transactionListResponseSchema 
} from '@shared/schemas';
import type { z } from 'zod';

type CreateEarnTransactionRequest = z.infer<typeof createEarnTransactionSchema>;
type CreateRedeemTransactionRequest = z.infer<typeof createRedeemTransactionSchema>;
type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;

interface TransactionsState {
  // State
  transactions: any[];
  pendingEarnRequests: number;
  pendingRedeemRequests: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Pagination
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  
  // Actions
  fetchTransactions: (searchParams?: any) => Promise<void>;
  submitEarnRequest: (earnData: CreateEarnTransactionRequest) => Promise<any>;
  submitRedeemRequest: (redeemData: CreateRedeemTransactionRequest) => Promise<any>;
  refreshTransactions: () => Promise<void>;
  handleRealTimeUpdate: (data: any) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  transactions: [],
  pendingEarnRequests: 0,
  pendingRedeemRequests: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  ...initialState,

  fetchTransactions: async (searchParams = { page: 1, limit: 20 }) => {
    try {
      set({ isLoading: true, error: null });
      const response = await transactionsService.getTransactions(searchParams);
      
      // Count pending requests
      const pendingEarn = response.transactions.filter(t => 
        t.type === 'EARN' && t.status === 'PENDING'
      ).length;
      const pendingRedeem = response.transactions.filter(t => 
        t.type === 'REDEEM' && t.status === 'PENDING'
      ).length;
      
      set({
        transactions: response.transactions,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        pendingEarnRequests: pendingEarn,
        pendingRedeemRequests: pendingRedeem,
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        isLoading: false 
      });
    }
  },

  submitEarnRequest: async (earnData: CreateEarnTransactionRequest) => {
    try {
      set({ isSubmitting: true, error: null });
      const response = await transactionsService.submitEarnRequest(earnData);
      
      // Refresh transactions to show the new one
      await get().refreshTransactions();
      
      set({ isSubmitting: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit earn request';
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  submitRedeemRequest: async (redeemData: CreateRedeemTransactionRequest) => {
    try {
      set({ isSubmitting: true, error: null });
      const response = await transactionsService.submitRedeemRequest(redeemData);
      
      // Refresh transactions to show the new one
      await get().refreshTransactions();
      
      set({ isSubmitting: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit redeem request';
      set({ error: errorMessage, isSubmitting: false });
      throw new Error(errorMessage);
    }
  },

  handleRealTimeUpdate: (data: any) => {
    if (data.type === 'TRANSACTION_UPDATE' && data.transaction) {
      set((state) => {
        const existingIndex = state.transactions.findIndex(t => t.id === data.transaction.id);
        if (existingIndex >= 0) {
          // Update existing transaction
          const updatedTransactions = [...state.transactions];
          updatedTransactions[existingIndex] = { ...updatedTransactions[existingIndex], ...data.transaction };
          return { transactions: updatedTransactions };
        } else {
          // Add new transaction
          return { transactions: [data.transaction, ...state.transactions] };
        }
      });
    }
  },

  refreshTransactions: async () => {
    const { page, limit } = get();
    await get().fetchTransactions({ page, limit });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
