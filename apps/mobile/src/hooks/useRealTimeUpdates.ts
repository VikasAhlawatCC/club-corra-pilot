import { useEffect } from 'react';
import { useRealTime } from '../providers/RealTimeProvider';
import { useCoinsStore } from '../stores/coins.store';
import { useTransactionsStore } from '../stores/transactions.store';

/**
 * Hook to connect WebSocket real-time updates to stores
 * This ensures that when WebSocket messages are received,
 * the appropriate stores are updated automatically
 */
export const useRealTimeUpdates = () => {
  const { lastMessage } = useRealTime();
  const { handleRealTimeUpdate: updateCoins } = useCoinsStore();
  const { handleRealTimeUpdate: updateTransactions } = useTransactionsStore();

  useEffect(() => {
    if (lastMessage) {
      // Handle balance updates
      if (lastMessage.event === 'balance_updated') {
        updateCoins({
          type: 'BALANCE_UPDATE',
          newBalance: lastMessage.data?.newBalance
        });
      }

      // Handle transaction updates
      if (lastMessage.event === 'transaction_status_changed') {
        updateTransactions({
          type: 'TRANSACTION_UPDATE',
          transaction: lastMessage.data
        });
      }
    }
  }, [lastMessage, updateCoins, updateTransactions]);
};
