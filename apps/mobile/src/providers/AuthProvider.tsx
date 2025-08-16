import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth, isAuthenticated } = useAuthStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[AuthProvider] Initializing authentication...');
        await initializeAuth();
        console.log('[AuthProvider] Authentication initialized successfully');
      } catch (error) {
        console.error('[AuthProvider] Failed to initialize authentication:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [initializeAuth]);

  // Show loading state while initializing
  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
