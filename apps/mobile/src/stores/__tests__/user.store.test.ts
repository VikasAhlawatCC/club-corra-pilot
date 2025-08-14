import { renderHook, act } from '@testing-library/react-native';
import { useUserStore } from '../user.store';
import { UserProfile, PaymentDetails } from '@shared/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('User Store', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset store to initial state
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.clearProfile();
    });
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useUserStore());
      
      expect(result.current.profile).toBeNull();
      expect(result.current.paymentDetails).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Profile Management', () => {
    it('sets profile correctly', () => {
      const { result } = renderHook(() => useUserStore());
      const mockProfile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
      };
      
      act(() => {
        result.current.setProfile(mockProfile);
      });
      
      expect(result.current.profile).toEqual(mockProfile);
    });

    it('updates profile with partial data', async () => {
      const { result } = renderHook(() => useUserStore());
      const initialProfile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
      };
      
      // Set initial profile
      act(() => {
        result.current.setProfile(initialProfile);
      });
      
      // Update with partial data
      const updatedFields: Partial<UserProfile> = {
        firstName: 'Jane',
        dateOfBirth: new Date('1992-05-15'),
      };
      
      await act(async () => {
        await result.current.updateProfile(updatedFields);
      });
      
      expect(result.current.profile?.firstName).toBe('Jane');
      expect(result.current.profile?.lastName).toBe('Doe'); // Should remain unchanged
      expect(result.current.profile?.dateOfBirth).toEqual(new Date('1992-05-15'));
      expect(result.current.profile?.gender).toBe('MALE'); // Should remain unchanged
    });

    it('clears profile correctly', () => {
      const { result } = renderHook(() => useUserStore());
      const mockProfile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
      };
      
      // Set profile first
      act(() => {
        result.current.setProfile(mockProfile);
      });
      
      expect(result.current.profile).toEqual(mockProfile);
      
      // Clear profile
      act(() => {
        result.current.clearProfile();
      });
      
      expect(result.current.profile).toBeNull();
    });

    it('handles profile with minimal required fields', () => {
      const { result } = renderHook(() => useUserStore());
      const minimalProfile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
      };
      
      act(() => {
        result.current.setProfile(minimalProfile);
      });
      
      expect(result.current.profile?.firstName).toBe('John');
      expect(result.current.profile?.lastName).toBe('Doe');
      expect(result.current.profile?.dateOfBirth).toBeUndefined();
      expect(result.current.profile?.gender).toBeUndefined();
    });
  });

  describe('Payment Details Management', () => {
    it('sets payment details correctly', () => {
      const { result } = renderHook(() => useUserStore());
      const mockPaymentDetails: PaymentDetails = {
        upiId: 'john.doe@upi',
      };
      
      act(() => {
        result.current.setPaymentDetails(mockPaymentDetails);
      });
      
      expect(result.current.paymentDetails).toEqual(mockPaymentDetails);
    });

    it('updates payment details with partial data', async () => {
      const { result } = renderHook(() => useUserStore());
      const initialPaymentDetails: PaymentDetails = {
        upiId: 'john.doe@upi',
      };
      
      // Set initial payment details
      act(() => {
        result.current.setPaymentDetails(initialPaymentDetails);
      });
      
      // Update with partial data
      const updatedFields: Partial<PaymentDetails> = {
        upiId: 'jane.doe@upi',
      };
      
      await act(async () => {
        await result.current.updatePaymentDetails(updatedFields);
      });
      
      expect(result.current.paymentDetails?.upiId).toBe('jane.doe@upi');
    });

    it('clears payment details correctly', () => {
      const { result } = renderHook(() => useUserStore());
      const mockPaymentDetails: PaymentDetails = {
        upiId: 'john.doe@upi',
      };
      
      // Set payment details first
      act(() => {
        result.current.setPaymentDetails(mockPaymentDetails);
      });
      
      expect(result.current.paymentDetails).toEqual(mockPaymentDetails);
      
      // Clear payment details
      act(() => {
        result.current.clearProfile(); // This clears both profile and payment details
      });
      
      expect(result.current.paymentDetails).toBeNull();
    });

    it('handles payment details without UPI ID', () => {
      const { result } = renderHook(() => useUserStore());
      const minimalPaymentDetails: PaymentDetails = {};
      
      act(() => {
        result.current.setPaymentDetails(minimalPaymentDetails);
      });
      
      expect(result.current.paymentDetails?.upiId).toBeUndefined();
    });
  });

  describe('Loading State', () => {
    it('sets loading state during profile update', async () => {
      const { result } = renderHook(() => useUserStore());
      
      // Start profile update
      const updatePromise = act(async () => {
        await result.current.updateProfile({ firstName: 'Jane' });
      });
      
      // Loading should be true during operation
      expect(result.current.isLoading).toBe(true);
      
      // Wait for operation to complete
      await updatePromise;
      
      // Loading should be false after operation
      expect(result.current.isLoading).toBe(false);
    });

    it('sets loading state during payment details update', async () => {
      const { result } = renderHook(() => useUserStore());
      
      // Start payment details update
      const updatePromise = act(async () => {
        await result.current.updatePaymentDetails({ upiId: 'new@upi' });
      });
      
      // Loading should be true during operation
      expect(result.current.isLoading).toBe(true);
      
      // Wait for operation to complete
      await updatePromise;
      
      // Loading should be false after operation
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Store Reset', () => {
    it('resets store to initial state', () => {
      const { result } = renderHook(() => useUserStore());
      
      // Set some state
      const mockProfile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockPaymentDetails: PaymentDetails = {
        upiId: 'john.doe@upi',
      };
      
      act(() => {
        result.current.setProfile(mockProfile);
        result.current.setPaymentDetails(mockPaymentDetails);
      });
      
      // Verify state is set
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.paymentDetails).toEqual(mockPaymentDetails);
      
      // Reset store
      act(() => {
        result.current.clearProfile();
      });
      
      // Verify state is reset
      expect(result.current.profile).toBeNull();
      expect(result.current.paymentDetails).toBeNull();
    });
  });

  describe('Store Persistence', () => {
    it('persists user data', () => {
      const { result } = renderHook(() => useUserStore());
      
      // Set user data
      const mockProfile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
      };
      
      act(() => {
        result.current.setProfile(mockProfile);
      });
      
      // Data should be set
      expect(result.current.profile).toEqual(mockProfile);
    });

    it('handles missing persisted state', () => {
      const { result } = renderHook(() => useUserStore());
      
      // Store should handle missing state gracefully
      expect(result.current.profile).toBeNull();
      expect(result.current.paymentDetails).toBeNull();
    });
  });

  describe('Data Validation', () => {
    it('handles profile with special characters', () => {
      const { result } = renderHook(() => useUserStore());
      const profileWithSpecialChars: UserProfile = {
        firstName: 'José',
        lastName: 'O\'Connor',
        dateOfBirth: new Date('1990-01-01'),
      };
      
      act(() => {
        result.current.setProfile(profileWithSpecialChars);
      });
      
      expect(result.current.profile?.firstName).toBe('José');
      expect(result.current.profile?.lastName).toBe('O\'Connor');
    });

    it('handles empty profile submission', () => {
      const { result } = renderHook(() => useUserStore());
      
      // Should not crash with empty profile
      act(() => {
        result.current.setProfile({} as UserProfile);
      });
      
      // Should handle gracefully
      expect(result.current.profile).toBeDefined();
    });

    it('handles rapid profile updates', async () => {
      const { result } = renderHook(() => useUserStore());
      
      // Set initial profile
      act(() => {
        result.current.setProfile({
          firstName: 'John',
          lastName: 'Doe',
        });
      });
      
      // Rapid updates
      await act(async () => {
        await Promise.all([
          result.current.updateProfile({ firstName: 'Jane' }),
          result.current.updateProfile({ lastName: 'Smith' }),
          result.current.updateProfile({ gender: 'FEMALE' }),
        ]);
      });
      
      expect(result.current.profile?.firstName).toBe('Jane');
      expect(result.current.profile?.lastName).toBe('Smith');
      expect(result.current.profile?.gender).toBe('FEMALE');
    });
  });
});
