import { useState, useEffect, useCallback } from 'react';
import { useCoinsStore } from '../stores/coins.store';
import { useRealTimeUpdates } from './useRealTimeUpdates';

export const useCoinBalance = () => {
  const { balance, fetchBalance } = useCoinsStore();
  const { isConnected } = useRealTimeUpdates();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh balance manually
  const refreshBalance = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await fetchBalance();
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchBalance]);

  // Listen for real-time balance updates
  useEffect(() => {
    try {
      // Safety check: ensure isConnected is defined before using it
      if (isConnected === true) {
        // The WebSocket connection will automatically update the balance
        // through the store when balance updates are received
        console.log('WebSocket connected, listening for balance updates');
      } else if (isConnected === false) {
        console.log('WebSocket disconnected, not listening for balance updates');
      } else {
        console.log('WebSocket connection status unknown, not listening for balance updates');
      }
    } catch (error) {
      console.error('Error in useCoinBalance useEffect:', error);
    }
  }, [isConnected]);

  // Refresh balance on mount
  useEffect(() => {
    try {
      if (typeof refreshBalance === 'function') {
        refreshBalance();
      }
    } catch (error) {
      console.error('Error in useCoinBalance mount useEffect:', error);
    }
  }, [refreshBalance]);

  return {
    balance: balance?.balance || 0,
    totalEarned: balance?.totalEarned || 0,
    totalRedeemed: balance?.totalRedeemed || 0,
    isRefreshing,
    refreshBalance,
    isConnected: isConnected || false, // Ensure we always return a boolean
  };
};
