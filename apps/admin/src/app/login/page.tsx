'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { EyeIcon, EyeSlashIcon, PhoneIcon, KeyIcon } from '@heroicons/react/24/outline'
import React from 'react' // Added for useEffect

// Mobile number or email validation regex
const MOBILE_OR_EMAIL_REGEX = /^(\+?[1-9]\d{1,14}|[0-9]{10,15}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/

// Validation functions
const validateMobileNumber = (input: string): string | null => {
  if (!input.trim()) return 'Mobile number or email is required'
  if (!MOBILE_OR_EMAIL_REGEX.test(input.trim())) {
    return 'Please enter a valid mobile number or email address'
  }
  return null
}

const validatePassword = (password: string): string | null => {
  if (!password.trim()) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters long'
  return null
}

const validateOtp = (otp: string): string | null => {
  if (!otp.trim()) return 'OTP code is required'
  if (!/^\d{6}$/.test(otp)) return 'OTP must be exactly 6 digits'
  return null
}

export default function LoginPage() {
  const [mobileNumber, setMobileNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isOtpLoading, setIsOtpLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [isBiometricLoading, setIsBiometricLoading] = useState(false)
  
  // Validation states
  const [mobileError, setMobileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [otpError, setOtpError] = useState<string | null>(null)
  
  // Rate limiting states
  const [otpRequestCount, setOtpRequestCount] = useState(0)
  const [lastOtpRequestTime, setLastOtpRequestTime] = useState<number>(0)
  const [otpCooldown, setOtpCooldown] = useState(0)
  
  const { login } = useAuth()
  const router = useRouter()

  // Rate limiting constants
  const MAX_OTP_REQUESTS = 3 // Maximum OTP requests per hour
  const OTP_COOLDOWN_TIME = 60 // Seconds to wait between OTP requests
  const OTP_RESET_TIME = 3600000 // 1 hour in milliseconds

  // Check if biometric authentication is available
  const checkBiometricAvailability = async () => {
    try {
      // Check if WebAuthn is supported
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setBiometricAvailable(available)
      }
    } catch (error) {
      console.log('Biometric authentication not available:', error)
      setBiometricAvailable(false)
    }
  }

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    if (!biometricAvailable) return

    setIsBiometricLoading(true)
    setError('')

    try {
      // Check if we have stored credentials
      const storedCredentials = localStorage.getItem('biometric_credentials')
      if (!storedCredentials) {
        setError('No biometric credentials found. Please login with password first.')
        setIsBiometricLoading(false)
        return
      }

      const credentials = JSON.parse(storedCredentials)
      
      // For demo purposes, we'll simulate biometric authentication
      // In production, you would use the WebAuthn API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate biometric check
      
      // If biometric auth succeeds, proceed with login
      await login(credentials.mobileNumber, credentials.password)
      router.push('/')
      
    } catch (error) {
      setError('Biometric authentication failed. Please try again or use password login.')
    } finally {
      setIsBiometricLoading(false)
    }
  }

  // Store biometric credentials after successful password login
  const storeBiometricCredentials = async () => {
    if (!biometricAvailable) return

    try {
      const credentials = {
        mobileNumber,
        password,
        timestamp: Date.now()
      }
      
      // In production, you would use WebAuthn to create and store credentials
      localStorage.setItem('biometric_credentials', JSON.stringify(credentials))
      
      // Show success message
      setError('')
      // You could show a success toast here
    } catch (error) {
      console.error('Failed to store biometric credentials:', error)
    }
  }

  // Check if OTP request is allowed
  const canRequestOtp = (): boolean => {
    const now = Date.now()
    
    // Reset counter if an hour has passed
    if (now - lastOtpRequestTime > OTP_RESET_TIME) {
      setOtpRequestCount(0)
      return true
    }
    
    // Check if we're within rate limits
    if (otpRequestCount >= MAX_OTP_REQUESTS) {
      return false
    }
    
    // Check cooldown period
    if (otpCooldown > 0) {
      return false
    }
    
    return true
  }

  // Get remaining time for OTP cooldown
  const getOtpCooldownTime = (): number => {
    if (otpCooldown <= 0) return 0
    return Math.ceil(otpCooldown / 1000)
  }

  // Update cooldown timer
  React.useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => {
        setOtpCooldown(prev => Math.max(0, prev - 1000))
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [otpCooldown])

  // Check biometric availability on mount
  React.useEffect(() => {
    checkBiometricAvailability()
  }, [])

  // Clear validation errors when switching methods
  const clearValidationErrors = () => {
    setMobileError(null)
    setPasswordError(null)
    setOtpError(null)
    setError('')
  }

  // Validate mobile number on input change
  const handleMobileNumberChange = (value: string) => {
    setMobileNumber(value)
    const validationError = validateMobileNumber(value)
    setMobileError(validationError)
  }

  // Validate password on input change
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const validationError = validatePassword(value)
    setPasswordError(validationError)
  }

  // Validate OTP on input change
  const handleOtpChange = (value: string) => {
    setOtpCode(value)
    const validationError = validateOtp(value)
    setOtpError(validationError)
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate form before submission
    const mobileValidation = validateMobileNumber(mobileNumber)
    const passwordValidation = validatePassword(password)
    
    setMobileError(mobileValidation)
    setPasswordError(passwordValidation)
    
    if (mobileValidation || passwordValidation) {
      return
    }

    setIsLoading(true)

    try {
      await login(mobileNumber, password)
      
      // Handle remember me functionality
      if (rememberMe) {
        // Store credentials securely (consider using a more secure method in production)
        const credentials = {
          mobileNumber: mobileNumber,
          rememberMe: true,
          timestamp: Date.now()
        }
        localStorage.setItem('remembered_credentials', JSON.stringify(credentials))
      } else {
        // Remove remembered credentials if not checked
        localStorage.removeItem('remembered_credentials')
      }

      // Store biometric credentials if available
      if (biometricAvailable) {
        await storeBiometricCredentials()
      }
      
      router.push('/')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      // Provide more specific error messages
      if (errorMessage.includes('mobile') || errorMessage.includes('phone')) {
        setError('Mobile number not found. Please check your mobile number.')
      } else if (errorMessage.includes('password') || errorMessage.includes('invalid')) {
        setError('Incorrect password. Please try again.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpRequest = async () => {
    if (!mobileNumber) {
      setMobileError('Mobile number is required')
      return
    }

    const mobileValidation = validateMobileNumber(mobileNumber)
    if (mobileValidation) {
      setMobileError(mobileValidation)
      return
    }

    // Check rate limiting
    if (!canRequestOtp()) {
      if (otpRequestCount >= MAX_OTP_REQUESTS) {
        setError(`Too many OTP requests. Please wait ${Math.ceil((OTP_RESET_TIME - (Date.now() - lastOtpRequestTime)) / 60000)} minutes before trying again.`)
      } else if (otpCooldown > 0) {
        setError(`Please wait ${getOtpCooldownTime()} seconds before requesting another OTP.`)
      }
      return
    }

    setError('')
    setIsOtpLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'}/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to send OTP')
      }

      // Update rate limiting state
      setOtpRequestCount(prev => prev + 1)
      setLastOtpRequestTime(Date.now())
      setOtpCooldown(OTP_COOLDOWN_TIME * 1000)
      setOtpSent(true)
      setError('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP'
      if (errorMessage.includes('mobile') || errorMessage.includes('phone')) {
        setError('Mobile number not found. Please check your mobile number.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsOtpLoading(false)
    }
  }

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    const mobileValidation = validateMobileNumber(mobileNumber)
    const otpValidation = validateOtp(otpCode)
    
    setMobileError(mobileValidation)
    setOtpError(otpValidation)
    
    if (mobileValidation || otpValidation) {
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'}/auth/login/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber, otpCode }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'OTP verification failed')
      }

      const data = await response.json()
      if (data.success) {
        // Store token and redirect
        localStorage.setItem('admin_token', data.data.accessToken)
        router.push('/')
      } else {
        throw new Error(data.message || 'OTP verification failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed'
      if (errorMessage.includes('OTP') || errorMessage.includes('code')) {
        setError('Invalid OTP code. Please check and try again.')
      } else if (errorMessage.includes('expired')) {
        setError('OTP has expired. Please request a new one.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!mobileNumber) {
      setMobileError('Mobile number is required')
      return
    }

    const mobileValidation = validateMobileNumber(mobileNumber)
    if (mobileValidation) {
      setMobileError(mobileValidation)
      return
    }

    setError('')
    setIsOtpLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to send password reset')
      }

      setError('Password reset instructions have been sent to your mobile number.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset'
      if (errorMessage.includes('mobile') || errorMessage.includes('phone')) {
        setError('Mobile number not found. Please check your mobile number.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsOtpLoading(false)
    }
  }

  const resetForm = () => {
    setMobileNumber('')
    setPassword('')
    setOtpCode('')
    setError('')
    setOtpSent(false)
    setLoginMethod('password')
    setRememberMe(false)
    clearValidationErrors()
  }

  // Switch login method with validation reset
  const switchToPassword = () => {
    setLoginMethod('password')
    clearValidationErrors()
  }

  const switchToOtp = () => {
    setLoginMethod('otp')
    clearValidationErrors()
  }

  // Load remembered credentials on component mount
  React.useEffect(() => {
    const remembered = localStorage.getItem('remembered_credentials')
    if (remembered) {
      try {
        const credentials = JSON.parse(remembered)
        const oneDay = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        
        // Check if credentials are still valid (less than 24 hours old)
        if (credentials.timestamp && (Date.now() - credentials.timestamp) < oneDay) {
          setMobileNumber(credentials.mobileNumber || '')
          setRememberMe(true)
        } else {
          // Remove expired credentials
          localStorage.removeItem('remembered_credentials')
        }
      } catch (error) {
        // Remove invalid credentials
        localStorage.removeItem('remembered_credentials')
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Club Corra Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>

        {/* Biometric Authentication Button */}
        {biometricAvailable && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleBiometricAuth}
              disabled={isBiometricLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBiometricLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Login with Biometrics
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Use fingerprint or face recognition
            </p>
          </div>
        )}
        
        {/* Login Method Toggle */}
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={switchToPassword}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
              loginMethod === 'password'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={switchToOtp}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border-t border-r border-b ${
              loginMethod === 'otp'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            OTP Login
          </button>
        </div>

        {/* Password Login Form */}
        {loginMethod === 'password' && (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="mobileNumber" className="sr-only">
                  Mobile number or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="text"
                    autoComplete="username"
                    required
                    className={`appearance-none relative block w-full pl-10 px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                      mobileError 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    placeholder="Mobile number or Email address"
                    value={mobileNumber}
                    onChange={(e) => handleMobileNumberChange(e.target.value)}
                  />
                </div>
                {mobileError && (
                  <p className="mt-1 text-sm text-red-600">{mobileError}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className={`appearance-none relative block w-full pl-10 px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                      passwordError 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                )}
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember my mobile number or email
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isOtpLoading || !mobileNumber}
                className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOtpLoading ? 'Sending...' : 'Forgot password?'}
              </button>
              <button
                type="button"
                onClick={switchToOtp}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Login with OTP
              </button>
            </div>
          </form>
        )}

        {/* OTP Login Form */}
        {loginMethod === 'otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleOtpLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="mobileNumberOtp" className="sr-only">
                  Mobile number or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="mobileNumberOtp"
                    name="mobileNumberOtp"
                    type="text"
                    autoComplete="username"
                    required
                    className={`appearance-none relative block w-full pl-10 px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                      mobileError 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    placeholder="Mobile number or Email address"
                    value={mobileNumber}
                    onChange={(e) => handleMobileNumberChange(e.target.value)}
                  />
                </div>
                {mobileError && (
                  <p className="mt-1 text-sm text-red-600">{mobileError}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="otpCode" className="sr-only">
                  OTP Code
                </label>
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                    otpError 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  maxLength={6}
                />
                {otpError && (
                  <p className="mt-1 text-sm text-red-600">{otpError}</p>
                )}
              </div>
            </div>

            {/* Rate limiting info */}
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Rate Limit:</span> {otpRequestCount}/{MAX_OTP_REQUESTS} OTP requests per hour
                    {otpCooldown > 0 && (
                      <span className="block mt-1">
                        Next request available in: {getOtpCooldownTime()}s
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleOtpRequest}
                  disabled={isOtpLoading || !mobileNumber || !!mobileError || !canRequestOtp()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOtpLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !otpCode || !!otpError}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP & Login'}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isOtpLoading || !mobileNumber || !!mobileError}
                className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOtpLoading ? 'Sending...' : 'Forgot password?'}
              </button>
              <button
                type="button"
                onClick={switchToPassword}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Login with Password
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Only authorized admin users can access this portal
          </p>
        </div>
      </div>
    </div>
  )
}
