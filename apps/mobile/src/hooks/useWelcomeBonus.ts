import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useCoinsStore } from '@/stores/coins.store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_BONUS_SHOWN_KEY = 'welcome_bonus_shown';

export const useWelcomeBonus = () => {
  const [shouldShowAnimation, setShouldShowAnimation] = useState(false);
  const [hasShownWelcomeBonus, setHasShownWelcomeBonus] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { balance } = useCoinsStore();

  useEffect(() => {
    try {
      // Safety check: ensure balance is available before checking welcome bonus
      if (balance && typeof balance === 'object') {
        if (typeof checkWelcomeBonusStatus === 'function') {
          checkWelcomeBonusStatus();
        }
      } else {
        // Balance not available yet, don't show animation
        setShouldShowAnimation(false);
      }
    } catch (error) {
      console.error('Error in useWelcomeBonus useEffect:', error);
      setShouldShowAnimation(false);
    }
  }, [user, isAuthenticated, balance]);

  const checkWelcomeBonusStatus = async () => {
    try {
      // Safety check: ensure user exists and has an ID
      if (!user?.id) {
        console.log('User not available yet, skipping welcome bonus check');
        setShouldShowAnimation(false);
        return;
      }

      // Check if we've already shown the welcome bonus for this user
      const storedKey = `${WELCOME_BONUS_SHOWN_KEY}_${user.id}`;
      const hasShown = await AsyncStorage.getItem(storedKey);
      
      if (hasShown === 'true') {
        setHasShownWelcomeBonus(true);
        setShouldShowAnimation(false);
        return;
      }

      // Check if user is authenticated and has coins
      if (isAuthenticated && user && balance && typeof balance === 'object') {
        // Check if this is a new user with welcome bonus
        const hasWelcomeBonus = balance.balance >= 100 && balance.totalEarned >= 100;
        
        if (hasWelcomeBonus && !hasShown) {
          setShouldShowAnimation(true);
        } else {
          setShouldShowAnimation(false);
        }
      } else {
        // User not authenticated or balance not available yet
        setShouldShowAnimation(false);
      }
    } catch (error) {
      console.error('Error checking welcome bonus status:', error);
      setShouldShowAnimation(false);
    }
  };

  const markWelcomeBonusAsShown = async () => {
    try {
      if (user?.id) {
        const storedKey = `${WELCOME_BONUS_SHOWN_KEY}_${user.id}`;
        await AsyncStorage.setItem(storedKey, 'true');
        setHasShownWelcomeBonus(true);
        setShouldShowAnimation(false);
      }
    } catch (error) {
      console.error('Error marking welcome bonus as shown:', error);
    }
  };

  const resetWelcomeBonusStatus = async () => {
    try {
      if (user?.id) {
        const storedKey = `${WELCOME_BONUS_SHOWN_KEY}_${user.id}`;
        await AsyncStorage.removeItem(storedKey);
        setHasShownWelcomeBonus(false);
        setShouldShowAnimation(false);
      }
    } catch (error) {
      console.error('Error resetting welcome bonus status:', error);
    }
  };

  return {
    shouldShowAnimation,
    hasShownWelcomeBonus,
    markWelcomeBonusAsShown,
    resetWelcomeBonusStatus,
  };
};

