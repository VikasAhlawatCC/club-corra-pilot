import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, PaymentDetails } from '@shared/types';

interface UserState {
  // State
  profile: UserProfile | null;
  paymentDetails: PaymentDetails | null;
  isLoading: boolean;
  
  // Actions
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  updatePaymentDetails: (paymentData: Partial<PaymentDetails>) => Promise<void>;
  clearProfile: () => void;
  setProfile: (profile: UserProfile) => void;
  setPaymentDetails: (paymentDetails: PaymentDetails) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      paymentDetails: null,
      isLoading: false,

      // Actions
      updateProfile: async (profileData: Partial<UserProfile>) => {
        set({ isLoading: true });
        
        try {
          // TODO: Implement API call to update profile
          // const response = await userService.updateProfile(profileData);
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update local state
          const currentProfile = get().profile;
          const updatedProfile = {
            ...currentProfile,
            ...profileData,
          } as UserProfile;
          
          set({ profile: updatedProfile });
          
        } catch (error) {
          console.error('Profile update failed:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updatePaymentDetails: async (paymentData: Partial<PaymentDetails>) => {
        set({ isLoading: true });
        
        try {
          // TODO: Implement API call to update payment details
          // const response = await userService.updatePaymentDetails(paymentData);
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update local state
          const currentPaymentDetails = get().paymentDetails;
          const updatedPaymentDetails = {
            ...currentPaymentDetails,
            ...paymentData,
          } as PaymentDetails;
          
          set({ paymentDetails: updatedPaymentDetails });
          
        } catch (error) {
          console.error('Payment details update failed:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearProfile: () => {
        set({
          profile: null,
          paymentDetails: null,
        });
      },

      setProfile: (profile: UserProfile) => {
        set({ profile });
      },

      setPaymentDetails: (paymentDetails: PaymentDetails) => {
        set({ paymentDetails });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        paymentDetails: state.paymentDetails,
      }),
    }
  )
);
