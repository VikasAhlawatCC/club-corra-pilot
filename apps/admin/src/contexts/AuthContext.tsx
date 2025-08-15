'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  permissions: string[]
}

interface AuthContextType {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check if we have a stored token
      const token = localStorage.getItem('admin_token')
      if (token) {
        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/auth/admin/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUser(data.data.user)
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('admin_token')
          }
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('admin_token')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Remove invalid token
      localStorage.removeItem('admin_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()
      
      if (data.success) {
        // Store token
        localStorage.setItem('admin_token', data.data.accessToken)
        setUser(data.data.user)
      } else {
        throw new Error(data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
  }

  const refreshUser = async () => {
    await checkAuthStatus()
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
