import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../auth.store';
import { authService } from '@/services/auth.service';
import { UserStatus } from '@shared/types';

// Mock the auth service
jest.mock('@/services/auth.service');
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('AuthStore - Password Setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store state completely
    act(() => {
      useAuthStore.setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        currentMobileNumber: null,
      });
    });
  });

  describe('newSetupPassword', () => {
    const mockPasswordData = {
      mobileNumber: '9876543210',
      password: 'TestPassword123',
      confirmPassword: 'TestPassword123',
    };

    const mockUser = {
      id: 'user-123',
      mobileNumber: '9876543210',
      email: undefined,
      status: UserStatus.ACTIVE,
      isMobileVerified: true,
      isEmailVerified: false,
      hasWelcomeBonusProcessed: false,
      authProviders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully setup password and handle immediate account activation', async () => {
      // Arrange
      const mockResponse = {
        message: 'Password set successfully. Account activated.',
        userId: 'user-123',
        requiresEmailVerification: false,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
        user: mockUser,
      };

      mockAuthService.newSetupPassword.mockResolvedValue(mockResponse);
      mockAuthService.storeTokens.mockResolvedValue();

      // Set current mobile number in store
      act(() => {
        useAuthStore.setState({ currentMobileNumber: '9876543210' });
      });

      // Act
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        const response = await result.current.newSetupPassword(mockPasswordData);
        expect(response).toEqual(mockResponse);
      });

      // Assert
      expect(mockAuthService.newSetupPassword).toHaveBeenCalledWith(mockPasswordData);
      expect(mockAuthService.storeTokens).toHaveBeenCalledWith({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      // Check that store state was updated correctly
      const storeState = useAuthStore.getState();
      expect(storeState.isAuthenticated).toBe(true);
      expect(storeState.tokens).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
      expect(storeState.currentMobileNumber).toBe('9876543210');
    });

    it('should handle password setup without immediate activation', async () => {
      // Arrange
      const mockResponse = {
        message: 'Password set successfully. Please verify your email to activate account.',
        userId: 'user-123',
        requiresEmailVerification: true,
        user: mockUser,
      };

      mockAuthService.newSetupPassword.mockResolvedValue(mockResponse);

      // Set current mobile number in store
      act(() => {
        useAuthStore.setState({ currentMobileNumber: '9876543210' });
      });

      // Act
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        const response = await result.current.newSetupPassword(mockPasswordData);
        expect(response).toEqual(mockResponse);
      });

      // Assert
      expect(mockAuthService.newSetupPassword).toHaveBeenCalledWith(mockPasswordData);
      expect(mockAuthService.storeTokens).not.toHaveBeenCalled();

      // Check that store state was updated but not authenticated
      const storeState = useAuthStore.getState();
      expect(storeState.isAuthenticated).toBe(false);
      expect(storeState.tokens).toBeNull();
      expect(storeState.user).toEqual({
        ...mockUser,
        hasPassword: true,
        updatedAt: expect.any(Date),
      });
    });

    it('should throw error if no mobile number is found', async () => {
      // Arrange
      act(() => {
        useAuthStore.setState({ currentMobileNumber: null });
      });

      // Act & Assert
      const { result } = renderHook(() => useAuthStore());
      
      await expect(
        act(async () => {
          await result.current.newSetupPassword(mockPasswordData);
        })
      ).rejects.toThrow('No mobile number found. Please start signup again.');
    });

    it('should handle password strength validation errors', async () => {
      // Arrange
      const errorMessage = 'Password does not meet strength requirements';
      mockAuthService.newSetupPassword.mockRejectedValue(new Error(errorMessage));

      act(() => {
        useAuthStore.setState({ currentMobileNumber: '9876543210' });
      });

      // Act & Assert
      const { result } = renderHook(() => useAuthStore());
      
      await expect(
        act(async () => {
          await result.current.newSetupPassword(mockPasswordData);
        })
      ).rejects.toThrow('Password must be at least 8 characters with uppercase, lowercase, and numbers.');
    });

    it('should handle user not found errors', async () => {
      // Arrange
      const errorMessage = 'User not found';
      mockAuthService.newSetupPassword.mockRejectedValue(new Error(errorMessage));

      act(() => {
        useAuthStore.setState({ currentMobileNumber: '9876543210' });
      });

      // Act & Assert
      const { result } = renderHook(() => useAuthStore());
      
      await expect(
        act(async () => {
          await result.current.newSetupPassword(mockPasswordData);
        })
      ).rejects.toThrow('User authentication required. Please complete OTP verification first.');
    });

    it('should handle existing password errors', async () => {
      // Arrange
      const errorMessage = 'already has a password set';
      mockAuthService.newSetupPassword.mockRejectedValue(new Error(errorMessage));

      act(() => {
        useAuthStore.setState({ currentMobileNumber: '9876543210' });
      });

      // Act & Assert
      const { result } = renderHook(() => useAuthStore());
      
      await expect(
        act(async () => {
          await result.current.newSetupPassword(mockPasswordData);
        })
      ).rejects.toThrow('Account already exists. Please use the login page instead.');
    });

    it('should handle generic errors', async () => {
      // Arrange
      const errorMessage = 'Some generic error';
      mockAuthService.newSetupPassword.mockRejectedValue(new Error(errorMessage));

      act(() => {
        useAuthStore.setState({ currentMobileNumber: '9876543210' });
      });

      // Act & Assert
      const { result } = renderHook(() => useAuthStore());
      
      await expect(
        act(async () => {
          await result.current.newSetupPassword(mockPasswordData);
        })
      ).rejects.toThrow(errorMessage);
    });

    it('should set loading state during password setup', async () => {
      // Arrange
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockAuthService.newSetupPassword.mockReturnValue(mockPromise);

      act(() => {
        useAuthStore.setState({ currentMobileNumber: '9876543210' });
      });

      // Act
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.newSetupPassword(mockPasswordData);
      });

      // Assert - should be loading
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        message: 'Password set successfully. Account activated.',
        userId: 'user-123',
        requiresEmailVerification: false,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
        user: mockUser,
      });

      // Wait for the promise to resolve
      await act(async () => {
        await mockPromise;
      });

      // Assert - should not be loading anymore
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle missing user in response gracefully', async () => {
      // Arrange
      const mockResponse = {
        message: 'Password set successfully. Account activated.',
        userId: 'user-123',
        requiresEmailVerification: false,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
        // No user field
      };

      mockAuthService.newSetupPassword.mockResolvedValue(mockResponse);
      mockAuthService.storeTokens.mockResolvedValue();

      // Set current mobile number and existing user in store
      act(() => {
        useAuthStore.setState({ 
          currentMobileNumber: '9876543210',
          user: mockUser 
        });
      });

      // Act
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        const response = await result.current.newSetupPassword(mockPasswordData);
        expect(response).toEqual(mockResponse);
      });

      // Assert
      expect(mockAuthService.storeTokens).toHaveBeenCalled();
      
      // Should use existing user from store
      const storeState = useAuthStore.getState();
      expect(storeState.user).toBe(mockUser);
    });
  });

  describe('newAddEmail', () => {
    const mockEmailData = {
      mobileNumber: '9876543210',
      email: 'test@example.com',
    };

    const mockUser = {
      id: 'user-123',
      mobileNumber: '9876543210',
      email: 'test@example.com',
      status: 'ACTIVE',
      isMobileVerified: true,
      isEmailVerified: false,
      hasWelcomeBonusProcessed: false,
      authProviders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully add email and update user state', async () => {
      // Arrange
      const mockResponse = {
        message: 'Email added successfully. Please check your email for verification.',
        userId: 'user-123',
        accountActivated: false,
        user: mockUser,
      };

      mockAuthService.newAddEmail.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        const response = await result.current.newAddEmail(mockEmailData);
        expect(response).toEqual(mockResponse);
      });

      // Assert
      expect(mockAuthService.newAddEmail).toHaveBeenCalledWith(mockEmailData);

      // Check that store state was updated correctly
      const storeState = useAuthStore.getState();
      expect(storeState.user).toEqual(mockUser);
      expect(storeState.isAuthenticated).toBe(true);
    });

    it('should handle email addition errors', async () => {
      // Arrange
      const errorMessage = 'Invalid token';
      mockAuthService.newAddEmail.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      const { result } = renderHook(() => useAuthStore());
      
      await expect(
        act(async () => {
          await result.current.newAddEmail(mockEmailData);
        })
      ).rejects.toThrow('The verification link is invalid or has expired.');
    });

    it('should handle token expired errors', async () => {
      // Arrange
      const errorMessage = 'Token expired';
      mockAuthService.newAddEmail.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      const { result } = renderHook(() => useAuthStore());
      
      await expect(
        act(async () => {
          await result.current.newAddEmail(mockEmailData);
        })
      ).rejects.toThrow('The verification link has expired. Please request a new one.');
    });
  });
});
