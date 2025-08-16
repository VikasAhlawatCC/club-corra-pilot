import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/auth.store';
import { useCoinsStore } from '../stores/coins.store';

const WELCOME_BONUS_SHOWN_KEY = 'welcome_bonus_shown';
const WELCOME_BONUS_PROCESSED_KEY = 'welcome_bonus_processed';
const WELCOME_BONUS_FROM_PASSWORD_SETUP_KEY = 'welcome_bonus_from_password_setup';

export const useWelcomeBonus = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { processWelcomeBonus, fetchBalance } = useCoinsStore();
  const [shouldShowAnimation, setShouldShowAnimation] = useState(false);

  const checkWelcomeBonusStatus = useCallback(async () => {
    if (!user?.id) return;

    const shownKey = `${WELCOME_BONUS_SHOWN_KEY}_${user.id}`;
    const processedKey = `${WELCOME_BONUS_PROCESSED_KEY}_${user.id}`;
    const fromPasswordSetupKey = `${WELCOME_BONUS_FROM_PASSWORD_SETUP_KEY}_${user.id}`;

    try {
      const [hasShown, hasProcessed, fromPasswordSetup] = await Promise.all([
        AsyncStorage.getItem(shownKey),
        AsyncStorage.getItem(processedKey),
        AsyncStorage.getItem(fromPasswordSetupKey),
      ]);

      // Only show welcome bonus if user came from password setup flow
      if (fromPasswordSetup === 'true' && !hasShown) {
        // If welcome bonus hasn't been processed yet, process it
        if (!hasProcessed && user.mobileNumber) {
          await processWelcomeBonus(user.id, user.mobileNumber);
          await AsyncStorage.setItem(processedKey, 'true');
          setShouldShowAnimation(true);
          await fetchBalance();
        } else if (hasProcessed && !hasShown) {
          // If processed but animation not shown, show it
          setShouldShowAnimation(true);
        }
      }
    } catch (error) {
      console.error('Error checking welcome bonus status:', error);
    }
  }, [user?.id, user?.mobileNumber, processWelcomeBonus, fetchBalance]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      checkWelcomeBonusStatus();
    }
  }, [isAuthenticated, user?.id, checkWelcomeBonusStatus]);

  const markWelcomeBonusAsShown = async () => {
    if (!user?.id) return;
    
    try {
      const shownKey = `${WELCOME_BONUS_SHOWN_KEY}_${user.id}`;
      await AsyncStorage.setItem(shownKey, 'true');
      setShouldShowAnimation(false);
    } catch (error) {
      console.error('Error marking welcome bonus as shown:', error);
    }
  };

  const setWelcomeBonusFromPasswordSetup = async () => {
    if (!user?.id) return;
    
    try {
      const fromPasswordSetupKey = `${WELCOME_BONUS_FROM_PASSWORD_SETUP_KEY}_${user.id}`;
      await AsyncStorage.setItem(fromPasswordSetupKey, 'true');
    } catch (error) {
      console.error('Error setting welcome bonus from password setup:', error);
    }
  };

  const resetWelcomeBonusStatus = async () => {
    if (!user?.id) return;
    
    try {
      const shownKey = `${WELCOME_BONUS_SHOWN_KEY}_${user.id}`;
      const processedKey = `${WELCOME_BONUS_PROCESSED_KEY}_${user.id}`;
      const fromPasswordSetupKey = `${WELCOME_BONUS_FROM_PASSWORD_SETUP_KEY}_${user.id}`;
      
      await Promise.all([
        AsyncStorage.removeItem(shownKey),
        AsyncStorage.removeItem(processedKey),
        AsyncStorage.removeItem(fromPasswordSetupKey),
      ]);
      
      setShouldShowAnimation(false);
    } catch (error) {
      console.error('Error resetting welcome bonus status:', error);
    }
  };

  return {
    shouldShowAnimation,
    markWelcomeBonusAsShown,
    setWelcomeBonusFromPasswordSetup,
    resetWelcomeBonusStatus,
  };
};


