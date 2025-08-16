import { useState, useEffect, useCallback } from 'react';
import { useCoinsStore } from '../stores/coins.store';
import { useRealTimeUpdates } from './useRealTimeUpdates';
import { useAuthStore } from '../stores/auth.store';

export const useCoinBalance = () => {
  const { balance, fetchBalance } = useCoinsStore();
  const { isConnected } = useRealTimeUpdates();
  const { isAuthenticated, user, tokens } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('[useCoinBalance] Balance state changed:', {
      balance,
      balanceType: typeof balance,
      balanceBalance: balance?.balance,
      balanceBalanceType: typeof balance?.balance,
      totalEarned: balance?.totalEarned,
      totalRedeemed: balance?.totalRedeemed
    });
  }, [balance]);

  // Debug authentication state
  useEffect(() => {
    console.log('[useCoinBalance] Auth state:', {
      isAuthenticated,
      hasUser: !!user,
      hasTokens: !!tokens,
      userId: user?.id
    });
  }, [isAuthenticated, user, tokens]);

  // Refresh balance manually
  const refreshBalance = useCallback(async () => {
    try {
      if (!isAuthenticated || !user?.id || !tokens?.accessToken) {
        console.warn('[useCoinBalance] Cannot refresh balance: not authenticated or missing tokens');
        return;
      }

      setIsRefreshing(true);
      console.log('[useCoinBalance] Refreshing balance for user:', user.id);
      await fetchBalance();
    } catch (error) {
      console.error('[useCoinBalance] Failed to refresh balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchBalance, isAuthenticated, user?.id, tokens?.accessToken]);

  // Fetch balance on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated && user?.id && tokens?.accessToken) {
      console.log('[useCoinBalance] User authenticated, fetching balance...');
      refreshBalance();
    } else {
      console.log('[useCoinBalance] User not authenticated, skipping balance fetch');
    }
  }, [isAuthenticated, user?.id, tokens?.accessToken, refreshBalance]);

  return {
    balance: balance?.balance || 0,
    totalEarned: balance?.totalEarned || 0,
    totalRedeemed: balance?.totalRedeemed || 0,
    isRefreshing,
    refreshBalance,
    isConnected: isConnected || false,
  };
};
