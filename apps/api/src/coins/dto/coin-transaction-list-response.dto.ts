import { CoinTransaction } from '../entities/coin-transaction.entity';

export class CoinTransactionListResponseDto {
  data: CoinTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
