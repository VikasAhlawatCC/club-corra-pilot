import { apiService } from './api.service';
import { 
  createEarnTransactionSchema, 
  createRedeemTransactionSchema,
  transactionListResponseSchema 
} from '@shared/schemas';
import type { z } from 'zod';

type CreateEarnTransactionRequest = z.infer<typeof createEarnTransactionSchema>;
type CreateRedeemTransactionRequest = z.infer<typeof createRedeemTransactionSchema>;
type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;

class TransactionsService {
  private readonly baseUrl = '/coins/transactions';

  /**
   * Submit an earn request with bill details
   */
  async submitEarnRequest(earnData: CreateEarnTransactionRequest): Promise<any> {
    try {
      const response = await apiService.post(`${this.baseUrl}/earn`, earnData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to submit earn request: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Submit a redeem request
   */
  async submitRedeemRequest(redeemData: CreateRedeemTransactionRequest): Promise<any> {
    try {
      const response = await apiService.post(`${this.baseUrl}/redeem`, redeemData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to submit redeem request: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactions(searchParams: any = {}): Promise<TransactionListResponse> {
    try {
      const response = await apiService.get(this.baseUrl, { params: searchParams });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch transactions: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get transaction details by ID
   */
  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${transactionId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch transaction details: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get user's current transactions (paginated)
   */
  async getMyTransactions(page: number = 1, limit: number = 20): Promise<TransactionListResponse> {
    try {
      const response = await apiService.get(`${this.baseUrl}/my`, { 
        params: { page, limit } 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch my transactions: ${error.message || 'Unknown error'}`);
    }
  }
}

export const transactionsService = new TransactionsService();
