import { 
  balanceResponseSchema,
  transactionListResponseSchema, 
  transactionSearchSchema,
  createWelcomeBonusSchema
} from '@shared/schemas';
import type { z } from 'zod';

type BalanceResponse = z.infer<typeof balanceResponseSchema>;
type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;
type TransactionSearch = z.infer<typeof transactionSearchSchema>;
type WelcomeBonusRequest = z.infer<typeof createWelcomeBonusSchema>;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.5:3001';

class CoinsService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/coins/${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        'X-Client-Type': 'mobile',
        'User-Agent': 'ClubCorra-Mobile/1.0.0',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getBalance(): Promise<BalanceResponse> {
    const response = await this.makeRequest('balance');
    return balanceResponseSchema.parse(response);
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

    const endpoint = queryString.toString() ? `transactions?${queryString.toString()}` : 'transactions';
    const response = await this.makeRequest(endpoint);
    
    return transactionListResponseSchema.parse(response);
  }

  async processWelcomeBonus(request: WelcomeBonusRequest): Promise<any> {
    const response = await this.makeRequest('welcome-bonus', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  }

  async createEarnTransaction(transactionData: any): Promise<any> {
    const response = await this.makeRequest('transactions/earn', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
    return response;
  }

  async createRedeemTransaction(transactionData: any): Promise<any> {
    const response = await this.makeRequest('transactions/redeem', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
    return response;
  }
}

export const coinsService = new CoinsService();
