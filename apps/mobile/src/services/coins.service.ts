import { 
  balanceResponseSchema,
  transactionListResponseSchema, 
  transactionSearchSchema,
  createWelcomeBonusSchema
} from '@shared/schemas';
import { environment } from '../config/environment';
import { apiService } from './api.service';
import type { z } from 'zod';

type BalanceResponse = z.infer<typeof balanceResponseSchema>;
type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;
type TransactionSearch = z.infer<typeof transactionSearchSchema>;
type WelcomeBonusRequest = z.infer<typeof createWelcomeBonusSchema>;

class CoinsService {
  async getBalance(): Promise<BalanceResponse> {
    try {
      console.log('[CoinsService] Fetching balance from API...');
      
      // Use the dedicated getCoinBalance method from apiService
      const response = await apiService.getCoinBalance();
      console.log('[CoinsService] Raw API response:', response);
      
      // Parse the response directly since apiService now returns raw data
      const parsedResponse = balanceResponseSchema.parse(response);
      console.log('[CoinsService] Parsed balance response:', parsedResponse);
      
      return parsedResponse;
    } catch (error) {
      console.error('[CoinsService] Error fetching balance:', error);
      if (error instanceof Error) {
        console.error('[CoinsService] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  async getTransactions(searchParams: TransactionSearch = { page: 1, limit: 20 }): Promise<TransactionListResponse> {
    const queryString = new URLSearchParams();
    
    if (searchParams.userId) queryString.append('userId', searchParams.userId);
    if (searchParams.type) queryString.append('type', searchParams.type);
    if (searchParams.status) queryString.append('status', searchParams.status);
    if (searchParams.brandId) queryString.append('brandId', searchParams.brandId);
    if (searchParams.startDate) queryString.append('startDate', searchParams.startDate.toISOString());
    if (searchParams.endDate) queryString.append('endDate', searchParams.endDate.toISOString());
    if (searchParams.page) queryString.append('page', searchParams.page.toString());
    if (searchParams.limit) queryString.append('limit', searchParams.limit.toString());

    const endpoint = queryString.toString() ? `coins/transactions?${queryString.toString()}` : 'coins/transactions';
    const response = await apiService.get(endpoint);
    
    return transactionListResponseSchema.parse(response);
  }

  async processWelcomeBonus(request: WelcomeBonusRequest): Promise<any> {
    try {
      const response = await apiService.post('welcome-bonus', request);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async createEarnTransaction(transactionData: any): Promise<any> {
    const response = await apiService.post('coins/transactions/earn', transactionData);
    return response;
  }

  async createRedeemTransaction(transactionData: any): Promise<any> {
    const response = await apiService.post('coins/transactions/redeem', transactionData);
    return response;
  }
}

export const coinsService = new CoinsService();
