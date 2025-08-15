import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthToken, AuthProvider } from '@shared/types';
import { authService } from '@/services/auth.service';
import { otpService } from '@/services/otp.service';
import { AUTH_ERROR_MESSAGES, getErrorMessage } from '@/constants/error-messages';

interface AuthState {
  // State
  user: User | null;
  tokens: AuthToken | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  currentMobileNumber: string | null;
  
  // OTP Verification States
  otpVerificationState: {
    isVerifying: boolean;
    attemptsRemaining: number;
    lastAttemptTime: number | null;
    isResendAvailable: boolean;
    resendCooldown: number;
    verificationMethod: 'SMS' | 'EMAIL' | null;
  };
  
  // Registration Flow States
  registrationState: {
    step: 'MOBILE' | 'OTP' | 'EMAIL' | 'PROFILE' | 'PASSWORD' | 'COMPLETE';
    mobileVerified: boolean;
    emailVerified: boolean;
    profileComplete: boolean;
    passwordSet: boolean;
  };
  
  // Session Management
  sessionState: {
    lastActivity: number;
    isSessionValid: boolean;
    autoRefreshEnabled: boolean;
    refreshTokenExpiry: number | null;
  };
  
  // Actions
  initiateSignup: (signupData: any) => Promise<any>;
  verifyOTP: (otp: string) => Promise<any>;
  resendOTP: () => Promise<any>;
  login: (mobileNumber: string, otp: string) => Promise<any>;
  sendLoginOTP: (mobileNumber: string) => Promise<any>;
  oauthSignup: (provider: 'GOOGLE', code: string, redirectUri: string) => Promise<any>;
  
  // NEW METHODS FOR PHASE 2B.1
  setupPassword: (userId: string, passwordData: any) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  requestEmailVerification: (email: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (token: string, passwordData: any) => Promise<any>;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  loginWithOAuth: (provider: 'GOOGLE' | 'FACEBOOK', accessToken: string) => Promise<any>;
  hasPassword: (userId: string) => Promise<boolean>;
  validatePasswordStrength: (password: string) => boolean;
  
  // NEW AUTH FLOW METHODS
  newInitialSignup: (signupData: any) => Promise<any>;
  newVerifySignupOtp: (verificationData: any) => Promise<any>;
  newSetupPassword: (passwordData: any) => Promise<any>;
  newAddEmail: (emailData: any) => Promise<any>;
  
  // Enhanced State Management Methods
  updateOTPVerificationState: (updates: Partial<AuthState['otpVerificationState']>) => void;
  updateRegistrationState: (updates: Partial<AuthState['registrationState']>) => void;
  updateSessionState: (updates: Partial<AuthState['sessionState']>) => void;
  resetOTPVerificationState: () => void;
  resetRegistrationState: () => void;
  
  updateProfile: (profileData: any) => Promise<any>;
  updatePaymentDetails: (paymentData: any) => Promise<any>;
  logout: () => void;
  clearAuth: () => void;
  
  // TOKEN MANAGEMENT
  initializeAuth: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  trackActivity: () => void;
  isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
      currentMobileNumber: null,

      // OTP Verification States
      otpVerificationState: {
        isVerifying: false,
        attemptsRemaining: 3,
        lastAttemptTime: null,
        isResendAvailable: true,
        resendCooldown: 0,
        verificationMethod: null,
      },
      
      // Registration Flow States
      registrationState: {
        step: 'MOBILE',
        mobileVerified: false,
        emailVerified: false,
        profileComplete: false,
        passwordSet: false,
      },
      
      // Session Management
      sessionState: {
        lastActivity: 0,
        isSessionValid: true,
        autoRefreshEnabled: true,
        refreshTokenExpiry: null,
      },

      // Actions
      initiateSignup: async (signupData: any) => {
        set({ isLoading: true, currentMobileNumber: signupData.mobileNumber });
        
        try {
          const response = await authService.initiateSignup(signupData);
          set({ currentMobileNumber: signupData.mobileNumber });
          return response;
        } catch (error) {
          console.error('Signup initiation failed:', error);
          // Provide specific error messages for common failures
          if (error instanceof Error) {
            if (error.message.includes('Mobile number already registered')) {
              throw new Error(AUTH_ERROR_MESSAGES.MOBILE_ALREADY_REGISTERED);
            } else if (error.message.includes('Email already registered')) {
              throw new Error(AUTH_ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
            } else if (error.message.includes('Invalid mobile number')) {
              throw new Error(AUTH_ERROR_MESSAGES.INVALID_MOBILE);
            } else if (error.message.includes('Invalid email')) {
              throw new Error(AUTH_ERROR_MESSAGES.INVALID_EMAIL);
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (otp: string) => {
        set({ isLoading: true });
        set((state) => ({ 
          otpVerificationState: { 
            ...state.otpVerificationState, 
            isVerifying: true 
          } 
        }));
        
        try {
          const mobileNumber = get().currentMobileNumber;
          if (!mobileNumber) {
            throw new Error('No mobile number found. Please start signup again.');
          }
          
          // Check attempts remaining
          const { attemptsRemaining } = get().otpVerificationState;
          if (attemptsRemaining <= 0) {
            throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
          }
          
          const response = await authService.verifyOTP(mobileNumber, otp);
          
          // Check if user is fully verified and tokens are provided
          if ('accessToken' in response && 'refreshToken' in response && 'user' in response) {
            // User is fully verified, store tokens and complete registration
            try {
              await authService.storeTokens({
                accessToken: response.accessToken as string,
                refreshToken: response.refreshToken as string,
                expiresIn: (response as any).expiresIn as number,
                tokenType: 'Bearer'
              });
              
              // Update states on successful verification with tokens
              set({ 
                user: response.user as User, 
                tokens: {
                  accessToken: response.accessToken as string,
                  refreshToken: response.refreshToken as string,
                  expiresIn: (response as any).expiresIn as number,
                  tokenType: 'Bearer'
                },
                isAuthenticated: true 
              });
              
              // Update registration state
              set((state) => ({
                registrationState: {
                  ...state.registrationState,
                  step: 'COMPLETE',
                  mobileVerified: true,
                  emailVerified: true,
                }
              }));
            } catch (error) {
              console.error('Failed to store tokens:', error);
              throw new Error('Failed to store authentication tokens');
            }
          } else if ('message' in response && 'requiresAdditionalVerification' in response) {
            // User is not fully verified yet, update registration state
            // In the new flow, we go to password setup instead of email verification
            
            // Check if the response contains user data (backend should return user object)
            if ('user' in response && response.user) {
              // Store the user object even when additional verification is needed
              set({ user: response.user as User });
            }
            
            set((state) => ({
              registrationState: {
                ...state.registrationState,
                step: 'PASSWORD',
                mobileVerified: true,
              }
            }));
          } else {
            // Handle unexpected response format
            console.warn('Unexpected response format from verifyOTP:', response);
            throw new Error('Unexpected response format from server');
          }
          
          // Reset OTP verification state
          get().resetOTPVerificationState();
          
          return response;
        } catch (error) {
          console.error('OTP verification failed:', error);
          
          // Update OTP verification state on failure
          const currentState = get().otpVerificationState;
          const newAttempts = currentState.attemptsRemaining - 1;
          const now = Date.now();
          
          set((state) => ({
            otpVerificationState: {
              ...state.otpVerificationState,
              attemptsRemaining: newAttempts,
              lastAttemptTime: now,
              isVerifying: false,
              isResendAvailable: newAttempts <= 0,
            }
          }));
          
          // Provide specific error messages for OTP failures
          if (error instanceof Error) {
            if (error.message.includes('Invalid OTP')) {
              throw new Error(AUTH_ERROR_MESSAGES.INVALID_OTP);
            } else if (error.message.includes('OTP expired')) {
              throw new Error(AUTH_ERROR_MESSAGES.OTP_EXPIRED);
            } else if (error.message.includes('Too many attempts')) {
              throw new Error(AUTH_ERROR_MESSAGES.OTP_TOO_MANY_ATTEMPTS);
            } else if (error.message.includes('Maximum OTP attempts exceeded')) {
              throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resendOTP: async () => {
        set({ isLoading: true });
        
        try {
          const mobileNumber = get().currentMobileNumber;
          if (!mobileNumber) {
            throw new Error('No mobile number found. Please start signup again.');
          }
          
          // Check resend cooldown
          const { resendCooldown, lastAttemptTime } = get().otpVerificationState;
          if (resendCooldown > 0 && lastAttemptTime) {
            const timeSinceLastAttempt = Date.now() - lastAttemptTime;
            if (timeSinceLastAttempt < resendCooldown * 1000) {
              const remainingTime = Math.ceil((resendCooldown * 1000 - timeSinceLastAttempt) / 1000);
              throw new Error(`Please wait ${remainingTime} seconds before requesting a new OTP.`);
            }
          }
          
          const response = await otpService.resendOtp(mobileNumber);
          
          // Update OTP verification state
          const now = Date.now();
          set((state) => ({
            otpVerificationState: {
              ...state.otpVerificationState,
              attemptsRemaining: 3,
              lastAttemptTime: now,
              isResendAvailable: false,
              resendCooldown: 60, // 60 seconds cooldown
            }
          }));
          
          // Start cooldown timer
          setTimeout(() => {
            set((state) => ({
              otpVerificationState: {
                ...state.otpVerificationState,
                isResendAvailable: true,
                resendCooldown: 0,
              }
            }));
          }, 60000);
          
          return response;
        } catch (error) {
          console.error('OTP resend failed:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (mobileNumber: string, otp: string) => {
        set({ isLoading: true });
        
        try {
          console.log('Auth store: Calling authService.login with:', { mobileNumber, otp });
          const response = await authService.login(mobileNumber, otp);
          console.log('Auth store: Received response:', response);
          console.log('Auth store: Response tokens:', response.tokens);
          
          // Store tokens securely
          console.log('Auth store: Attempting to store tokens...');
          await authService.storeTokens(response.tokens);
          console.log('Auth store: Tokens stored successfully');
          
          set({ 
            user: response.user, 
            tokens: response.tokens, 
            isAuthenticated: true,
            currentMobileNumber: mobileNumber 
          });
          
          return response;
        } catch (error) {
          console.error('Auth store: Login failed:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      sendLoginOTP: async (mobileNumber: string) => {
        set({ isLoading: true });
        
        try {
          const response = await authService.sendLoginOTP(mobileNumber);
          set({ currentMobileNumber: mobileNumber });
          return response;
        } catch (error) {
          console.error('Login OTP send failed:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      oauthSignup: async (provider: 'GOOGLE', code: string, redirectUri: string) => {
        set({ isLoading: true });
        
        try {
          const response = await authService.oauthSignup(provider, code, redirectUri);
          
          // Store tokens securely
          await authService.storeTokens(response.tokens);
          
          set({ 
            user: response.user, 
            tokens: response.tokens,
            isAuthenticated: true 
          });
          
          return response;
        } catch (error) {
          console.error('OAuth signup failed:', error);
          
          // Provide specific error messages for OAuth failures
          if (error instanceof Error) {
            if (error.message.includes('OAuth is not properly configured')) {
              throw new Error('OAuth is not properly configured. Please contact support.');
            } else if (error.message.includes('authentication failed')) {
              throw new Error('OAuth authentication failed. Please try again.');
            } else if (error.message.includes('Network error')) {
              throw new Error('Network error. Please check your internet connection and try again.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // NEW METHODS FOR PHASE 2B.1 IMPLEMENTATION

      setupPassword: async (mobileNumber: string, passwordData: any) => {
        set({ isLoading: true });
        
        try {
          const response = await authService.setupPassword(mobileNumber, {
            mobileNumber,
            ...passwordData
          });
          
          // Update user state to indicate password is set
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              hasPassword: true,
              updatedAt: new Date(),
            };
            set({ user: updatedUser });
          }
          
          return response;
        } catch (error) {
          console.error('Password setup failed:', error);
          // Provide specific error messages for password setup failures
          if (error instanceof Error) {
            if (error.message.includes('Password does not meet strength requirements')) {
              throw new Error('Password must be at least 8 characters with uppercase, lowercase, and numbers.');
            } else if (error.message.includes('User not found')) {
              throw new Error('User authentication required. Please complete OTP verification first.');
            } else if (error.message.includes('already has a password set')) {
              throw new Error('Account already exists. Please use the login page instead.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true });
        
        try {
          const response = await authService.verifyEmail(token);
          
          // Update user state with verification status
          if (response.user) {
            set({ 
              user: response.user,
              isAuthenticated: true 
            });
          }
          
          return response;
        } catch (error) {
          console.error('Email verification failed:', error);
          // Provide specific error messages for email verification failures
          if (error instanceof Error) {
            if (error.message.includes('Invalid token')) {
              throw new Error('The verification link is invalid or has expired.');
            } else if (error.message.includes('Token expired')) {
              throw new Error('The verification link has expired. Please request a new one.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      requestEmailVerification: async (email: string) => {
        set({ isLoading: true });
        
        try {
          const response = await authService.requestEmailVerification(email);
          return response;
        } catch (error) {
          console.error('Email verification request failed:', error);
          // Provide specific error messages for email verification request failures
          if (error instanceof Error) {
            if (error.message.includes('Email not found')) {
              throw new Error('No account found with this email address.');
            } else if (error.message.includes('Email already verified')) {
              throw new Error('This email is already verified.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      requestPasswordReset: async (email: string) => {
        set({ isLoading: true });
        
        try {
          const response = await authService.requestPasswordReset(email);
          return response;
        } catch (error) {
          console.error('Password reset request failed:', error);
          // Provide specific error messages for password reset request failures
          if (error instanceof Error) {
            if (error.message.includes('Email not found')) {
              throw new Error('No account found with this email address.');
            } else if (error.message.includes('Too many requests')) {
              throw new Error('Too many reset requests. Please wait before trying again.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (token: string, passwordData: any) => {
        set({ isLoading: true });
        
        try {
          const response = await authService.resetPassword(token, passwordData);
          return response;
        } catch (error) {
          console.error('Password reset failed:', error);
          // Provide specific error messages for password reset failures
          if (error instanceof Error) {
            if (error.message.includes('Invalid token')) {
              throw new Error('The reset link is invalid or has expired.');
            } else if (error.message.includes('Token expired')) {
              throw new Error('The reset link has expired. Please request a new one.');
            } else if (error.message.includes('Password does not meet strength requirements')) {
              throw new Error('Password must be at least 8 characters with uppercase, lowercase, and numbers.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithEmail: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await authService.loginWithEmail(email, password);
          
          // Store tokens securely
          await authService.storeTokens(response.tokens);
          
          set({ 
            user: response.user, 
            tokens: response.tokens, 
            isAuthenticated: true 
          });
          
          return response;
        } catch (error) {
          console.error('Email login failed:', error);
          // Provide specific error messages for email login failures
          if (error instanceof Error) {
            if (error.message.includes('Invalid credentials')) {
              throw new Error('Invalid email or password. Please try again.');
            } else if (error.message.includes('Account locked')) {
              throw new Error('Account is temporarily locked. Please try again later.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithOAuth: async (provider: 'GOOGLE' | 'FACEBOOK', code: string) => {
        set({ isLoading: true });
        
        try {
          const response = await authService.loginWithOAuth(provider, code);
          
          // Store tokens securely
          await authService.storeTokens(response.tokens);
          
          set({ 
            user: response.user, 
            tokens: response.tokens, 
            isAuthenticated: true 
          });
          
          return response;
        } catch (error) {
          console.error('OAuth login failed:', error);
          
          // Provide specific error messages for OAuth login failures
          if (error instanceof Error) {
            if (error.message.includes('Invalid token')) {
              throw new Error('Authentication failed. Please try again.');
            } else if (error.message.includes('Account not found')) {
              throw new Error('No account found with this OAuth provider. Please sign up first.');
            } else if (error.message.includes('Network error')) {
              throw new Error('Network error. Please check your internet connection and try again.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      hasPassword: async (userId: string) => {
        try {
          return await authService.hasPassword(userId);
        } catch (error) {
          console.error('Failed to check password status:', error);
          // Default to false if we can't determine
          return false;
        }
      },

      validatePasswordStrength: (password: string) => {
        return authService.validatePasswordStrength(password);
      },

      // NEW AUTH FLOW METHODS
      newInitialSignup: async (signupData: any) => {
        set({ isLoading: true });
        try {
          const response = await authService.newInitialSignup(signupData);
          set({ currentMobileNumber: signupData.mobileNumber });
          return response;
        } catch (error) {
          console.error('New initial signup failed:', error);
          if (error instanceof Error) {
            if (error.message.includes('Mobile number already registered')) {
              throw new Error(AUTH_ERROR_MESSAGES.MOBILE_ALREADY_REGISTERED);
            } else if (error.message.includes('Email already registered')) {
              throw new Error(AUTH_ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
            } else if (error.message.includes('Invalid mobile number')) {
              throw new Error(AUTH_ERROR_MESSAGES.INVALID_MOBILE);
            } else if (error.message.includes('Invalid email')) {
              throw new Error(AUTH_ERROR_MESSAGES.INVALID_EMAIL);
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      newVerifySignupOtp: async (verificationData: any) => {
        console.log('[DEBUG] newVerifySignupOtp called with:', verificationData);
        set({ isLoading: true });
        set((state) => ({ 
          otpVerificationState: { 
            ...state.otpVerificationState, 
            isVerifying: true 
          } 
        }));
        try {
          const mobileNumber = get().currentMobileNumber;
          if (!mobileNumber) {
            throw new Error('No mobile number found. Please start signup again.');
          }
          console.log('[DEBUG] Calling authService.newVerifySignupOtp');
          const response = await authService.newVerifySignupOtp(verificationData);
          console.log('[DEBUG] Response received:', response);
          if ('accessToken' in response && 'refreshToken' in response && 'user' in response) {
            try {
              await authService.storeTokens({
                accessToken: response.accessToken as string,
                refreshToken: response.refreshToken as string,
                expiresIn: (response as any).expiresIn as number,
                tokenType: 'Bearer'
              });
              set({ 
                user: response.user as User, 
                tokens: {
                  accessToken: response.accessToken as string,
                  refreshToken: response.refreshToken as string,
                  expiresIn: (response as any).expiresIn as number,
                  tokenType: 'Bearer'
                },
                isAuthenticated: true 
              });
              set((state) => ({
                registrationState: {
                  ...state.registrationState,
                  step: 'COMPLETE',
                  mobileVerified: true,
                  emailVerified: true,
                }
              }));
            } catch (error) {
              console.error('Failed to store tokens:', error);
              throw new Error('Failed to store authentication tokens');
            }
          } else if ('message' in response && ('requiresAdditionalVerification' in response || 'requiresPasswordSetup' in response)) {
            console.log('[DEBUG] Handling response with requiresPasswordSetup/requiresAdditionalVerification');
            if ('user' in response && response.user) {
              set({ user: response.user as User });
            }
            set((state) => ({
              registrationState: {
                ...state.registrationState,
                step: 'PASSWORD',
                mobileVerified: true,
              }
            }));
          } else {
            console.warn('Unexpected response format from newVerifySignupOtp:', response);
            throw new Error('Unexpected response format from server');
          }
          get().resetOTPVerificationState();
          return response;
        } catch (error) {
          console.error('New OTP verification failed:', error);
          const currentState = get().otpVerificationState;
          const newAttempts = currentState.attemptsRemaining - 1;
          const now = Date.now();
          set((state) => ({
            otpVerificationState: {
              ...state.otpVerificationState,
              attemptsRemaining: newAttempts,
              lastAttemptTime: now,
              isVerifying: false,
              isResendAvailable: newAttempts <= 0,
            }
          }));
          if (error instanceof Error) {
            if (error.message.includes('Invalid OTP')) {
              throw new Error(AUTH_ERROR_MESSAGES.INVALID_OTP);
            } else if (error.message.includes('OTP expired')) {
              throw new Error(AUTH_ERROR_MESSAGES.OTP_EXPIRED);
            } else if (error.message.includes('Too many attempts')) {
              throw new Error(AUTH_ERROR_MESSAGES.OTP_TOO_MANY_ATTEMPTS);
            } else if (error.message.includes('Maximum OTP attempts exceeded')) {
              throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          console.log('[DEBUG] newVerifySignupOtp finally block, setting isLoading to false');
          set({ isLoading: false });
        }
      },
      newSetupPassword: async (passwordData: any) => {
        set({ isLoading: true });
        try {
          const mobileNumber = get().currentMobileNumber;
          if (!mobileNumber) {
            throw new Error('No mobile number found. Please start signup again.');
          }
          const response = await authService.newSetupPassword(passwordData);
          if (response.user) {
            const updatedUser = {
              ...response.user,
              hasPassword: true,
              updatedAt: new Date(),
            };
            set({ user: updatedUser });
          }
          return response;
        } catch (error) {
          console.error('New password setup failed:', error);
          if (error instanceof Error) {
            if (error.message.includes('Password does not meet strength requirements')) {
              throw new Error('Password must be at least 8 characters with uppercase, lowercase, and numbers.');
            } else if (error.message.includes('User not found')) {
              throw new Error('User authentication required. Please complete OTP verification first.');
            } else if (error.message.includes('already has a password set')) {
              throw new Error('Account already exists. Please use the login page instead.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      newAddEmail: async (emailData: any) => {
        set({ isLoading: true });
        try {
          const response = await authService.newAddEmail(emailData);
          if (response.user) {
            set({ 
              user: response.user,
              isAuthenticated: true 
            });
          }
          return response;
        } catch (error) {
          console.error('New email addition failed:', error);
          if (error instanceof Error) {
            if (error.message.includes('Invalid token')) {
              throw new Error('The verification link is invalid or has expired.');
            } else if (error.message.includes('Token expired')) {
              throw new Error('The verification link has expired. Please request a new one.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Enhanced State Management Methods
      updateOTPVerificationState: (updates: Partial<AuthState['otpVerificationState']>) => {
        set((state) => ({ otpVerificationState: { ...state.otpVerificationState, ...updates } }));
      },
      updateRegistrationState: (updates: Partial<AuthState['registrationState']>) => {
        set((state) => ({ registrationState: { ...state.registrationState, ...updates } }));
      },
      updateSessionState: (updates: Partial<AuthState['sessionState']>) => {
        set((state) => ({ sessionState: { ...state.sessionState, ...updates } }));
      },
      resetOTPVerificationState: () => {
        set({ otpVerificationState: {
          isVerifying: false,
          attemptsRemaining: 3,
          lastAttemptTime: null,
          isResendAvailable: true,
          resendCooldown: 0,
          verificationMethod: null,
        } });
      },
      resetRegistrationState: () => {
        set({ registrationState: {
          step: 'MOBILE',
          mobileVerified: false,
          emailVerified: false,
          profileComplete: false,
          passwordSet: false,
        } });
      },

      // TOKEN MANAGEMENT METHODS

      initializeAuth: async () => {
        try {
          // Check if we have stored tokens
          const storedTokens = await authService.getStoredTokens();
          
          if (storedTokens) {
            // Verify tokens are still valid
            const isValid = !(await authService.isTokenExpired());
            
            if (isValid) {
              // Try to refresh tokens to get latest user data
              try {
                const newTokens = await authService.refreshToken(storedTokens.refreshToken);
                await authService.storeTokens(newTokens.tokens);
                
                // Update session state
                const now = Date.now();
                set({
                  tokens: newTokens.tokens,
                  user: newTokens.user,
                  isAuthenticated: true,
                  sessionState: {
                    lastActivity: now,
                    isSessionValid: true,
                    autoRefreshEnabled: true,
                    refreshTokenExpiry: null, // We'll calculate this from expiresIn if needed
                  }
                });
              } catch (error) {
                console.warn('Failed to refresh tokens, clearing auth state:', error);
                await authService.clearStoredTokens();
                set({
                  user: null,
                  tokens: null,
                  isAuthenticated: false,
                  sessionState: {
                    lastActivity: 0,
                    isSessionValid: false,
                    autoRefreshEnabled: false,
                    refreshTokenExpiry: null,
                  }
                });
              }
            } else {
              // Tokens are expired, clear them
              await authService.clearStoredTokens();
              set({
                user: null,
                tokens: null,
                isAuthenticated: false,
                sessionState: {
                  lastActivity: 0,
                  isSessionValid: false,
                  autoRefreshEnabled: false,
                  refreshTokenExpiry: null,
                }
              });
            }
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          // Clear any invalid state
          await authService.clearStoredTokens();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            sessionState: {
              lastActivity: 0,
              isSessionValid: false,
              autoRefreshEnabled: false,
              refreshTokenExpiry: null,
            }
          });
        }
      },

      refreshTokens: async () => {
        try {
          const newTokens = await authService.autoRefreshTokens();
          
          if (newTokens) {
            // Update session state
            const now = Date.now();
            set({ 
              tokens: newTokens,
              sessionState: {
                lastActivity: now,
                isSessionValid: true,
                autoRefreshEnabled: true,
                refreshTokenExpiry: null, // We'll calculate this from expiresIn if needed
              }
            });
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Failed to refresh tokens:', error);
          return false;
        }
      },

      // Track user activity for session management
      trackActivity: () => {
        const now = Date.now();
        set((state) => ({
          sessionState: {
            ...state.sessionState,
            lastActivity: now,
          }
        }));
      },

      // Check if session is still valid based on activity
      isSessionValid: () => {
        const { lastActivity, isSessionValid } = get().sessionState;
        if (!isSessionValid) return false;
        
        // Check if user has been inactive for more than 30 minutes
        const thirtyMinutes = 30 * 60 * 1000;
        const timeSinceLastActivity = Date.now() - lastActivity;
        
        return timeSinceLastActivity < thirtyMinutes;
      },

      updateProfile: async (profileData: any) => {
        set({ isLoading: true });
        
        try {
          // Call API to update profile
          const response = await authService.updateProfile(profileData);
          
          // Update local user state
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              profile: {
                ...currentUser.profile,
                ...profileData,
              },
              updatedAt: new Date(),
            };
            set({ user: updatedUser });
          }
          
          return response;
        } catch (error) {
          console.error('Profile update failed:', error);
          // Provide specific error messages for profile update failures
          if (error instanceof Error) {
            if (error.message.includes('Invalid data')) {
              throw new Error('Please check your profile information and try again.');
            } else if (error.message.includes('Unauthorized')) {
              throw new Error('You are not authorized to update this profile.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updatePaymentDetails: async (paymentData: any) => {
        set({ isLoading: true });
        
        try {
          // Call API to update payment details
          const response = await authService.updatePaymentDetails(paymentData);
          
          // Update local user state
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              paymentDetails: {
                ...currentUser.paymentDetails,
                ...paymentData,
              },
              updatedAt: new Date(),
            };
            set({ user: updatedUser });
          }
          
          return response;
        } catch (error) {
          console.error('Payment details update failed:', error);
          // Provide specific error messages for payment update failures
          if (error instanceof Error) {
            if (error.message.includes('Invalid UPI ID')) {
              throw new Error('Please enter a valid UPI ID format.');
            } else if (error.message.includes('Unauthorized')) {
              throw new Error('You are not authorized to update payment details.');
            } else {
              throw error;
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Welcome bonus logic - called when user completes profile and payment setup
      processWelcomeBonus: async () => {
        const currentUser = get().user;
        if (!currentUser?.id) {
          throw new Error('User not authenticated');
        }

        try {
          // This would typically call the coins service to create welcome bonus
          // For now, we'll just update the user state to indicate welcome bonus processed
          const updatedUser = {
            ...currentUser,
            hasWelcomeBonusProcessed: true,
            updatedAt: new Date(),
          };
          set({ user: updatedUser });
          
          // In a real implementation, you would call the coins service here
          // await coinsService.createWelcomeBonus(currentUser.id);
          
          return { success: true, message: 'Welcome bonus processed successfully' };
        } catch (error) {
          console.error('Welcome bonus processing failed:', error);
          throw error;
        }
      },

      // Show welcome bonus notification when user first logs in
      showWelcomeBonusNotification: async () => {
        const currentUser = get().user;
        if (!currentUser?.id) {
          return null;
        }

        // Check if user has already received welcome bonus notification
        if (currentUser.hasWelcomeBonusProcessed) {
          return null;
        }

        try {
          // Check if user has welcome bonus transaction (this would be an API call in real implementation)
          // For now, we'll simulate the check
          const hasWelcomeBonus = true; // This should come from API
          
          if (hasWelcomeBonus) {
            // Update user state to prevent duplicate notifications
            const updatedUser = {
              ...currentUser,
              hasWelcomeBonusProcessed: true,
              updatedAt: new Date(),
            };
            set({ user: updatedUser });

            // Return notification data for UI display
            return {
              type: 'WELCOME_BONUS',
              title: 'Welcome to Club Corra! 🎉',
              message: 'You\'ve received 100 Corra Coins as a welcome bonus!',
              coins: 100,
              timestamp: new Date(),
            };
          }

          return null;
        } catch (error) {
          console.error('Failed to show welcome bonus notification:', error);
          return null;
        }
      },

      logout: async () => {
        // Clear stored tokens
        await authService.clearStoredTokens();
        
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          currentMobileNumber: null,
          // Reset OTP verification state
          otpVerificationState: {
            isVerifying: false,
            attemptsRemaining: 3,
            lastAttemptTime: null,
            isResendAvailable: true,
            resendCooldown: 0,
            verificationMethod: null,
          },
          // Reset registration state
          registrationState: {
            step: 'MOBILE',
            mobileVerified: false,
            emailVerified: false,
            profileComplete: false,
            passwordSet: false,
          },
          // Reset session state
          sessionState: {
            lastActivity: 0,
            isSessionValid: false,
            autoRefreshEnabled: false,
            refreshTokenExpiry: null,
          },
        });
      },

      clearAuth: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          currentMobileNumber: null,
          // Reset OTP verification state
          otpVerificationState: {
            isVerifying: false,
            attemptsRemaining: 3,
            lastAttemptTime: null,
            isResendAvailable: true,
            resendCooldown: 0,
            verificationMethod: null,
          },
          // Reset registration state
          registrationState: {
            step: 'MOBILE',
            mobileVerified: false,
            emailVerified: false,
            profileComplete: false,
            passwordSet: false,
          },
          // Reset session state
          sessionState: {
            lastActivity: 0,
            isSessionValid: false,
            autoRefreshEnabled: false,
            refreshTokenExpiry: null,
          },
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        // Persist OTP verification state for better UX
        otpVerificationState: {
          attemptsRemaining: state.otpVerificationState.attemptsRemaining,
          lastAttemptTime: state.otpVerificationState.lastAttemptTime,
          isResendAvailable: state.otpVerificationState.isResendAvailable,
          resendCooldown: state.otpVerificationState.resendCooldown,
          verificationMethod: state.otpVerificationState.verificationMethod,
        },
        // Persist registration flow state
        registrationState: state.registrationState,
        // Persist session state
        sessionState: {
          lastActivity: state.sessionState.lastActivity,
          isSessionValid: state.sessionState.isSessionValid,
          autoRefreshEnabled: state.sessionState.autoRefreshEnabled,
        },
      }),
    }
  )
);
