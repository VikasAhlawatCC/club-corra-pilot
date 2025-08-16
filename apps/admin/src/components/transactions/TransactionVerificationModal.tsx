'use client'

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  XCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import type { CoinTransaction } from '@shared/schemas'
import { verificationFormSchema } from '@shared/schemas'
import { transactionApi } from '../../lib/api'
import { VerificationModalSkeleton } from '../common/LoadingSkeleton'

interface TransactionVerificationModalProps {
  transaction: CoinTransaction | null
  isOpen: boolean
  onClose: () => void
  onApprove: (transactionId: string, verificationData: VerificationFormData) => void
  onReject: (transactionId: string, reason: string, adminNotes?: string) => void
  onApproveAndPay?: (transactionId: string, verificationData: VerificationFormData) => void
}

interface VerificationFormData {
  observedAmount: number
  receiptDate: string
  verificationConfirmed: boolean
  rejectionNote?: string
  adminNotes?: string
}

interface UserDetails {
  id: string
  name?: string
  email?: string
  mobileNumber?: string
  profile?: {
    firstName?: string
    lastName?: string
  }
  paymentDetails?: {
    mobileNumber?: string
    upiId?: string
  }
}

interface PendingRequest {
  id: string
  type: 'EARN' | 'REDEEM'
  billAmount: number
  billDate: Date
  receiptUrl?: string
  createdAt: Date
  brand?: {
    name: string
  }
}

export const TransactionVerificationModal = memo(function TransactionVerificationModal({ 
  transaction, 
  isOpen, 
  onClose,
  onApprove,
  onReject,
  onApproveAndPay
}: TransactionVerificationModalProps) {
  const [verificationData, setVerificationData] = useState<VerificationFormData>({
    observedAmount: 0,
    receiptDate: '',
    verificationConfirmed: false,
    rejectionNote: ''
  })
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [currentRequestIndex, setCurrentRequestIndex] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageScale, setImageScale] = useState(1)
  const [imageRotation, setImageRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [keyboardFeedback, setKeyboardFeedback] = useState<string | null>(null)

  const onCloseRef = useRef(onClose)
  const pendingRequestsRef = useRef(pendingRequests)
  const currentRequestIndexRef = useRef(currentRequestIndex)

  // Update refs when props change
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    pendingRequestsRef.current = pendingRequests
  }, [pendingRequests])

  useEffect(() => {
    currentRequestIndexRef.current = currentRequestIndex
  }, [currentRequestIndex])

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      setVerificationData({
        observedAmount: transaction.billAmount || 0,
        receiptDate: transaction.billDate ? new Date(transaction.billDate).toISOString().split('T')[0] : '',
        verificationConfirmed: false,
        rejectionNote: '',
        adminNotes: ''
      })
      setCurrentImageIndex(0)
      setImageScale(1)
      setImageRotation(0)
      setCurrentRequestIndex(0)
      setIsImageLoading(true)
      setImageLoadError(false)
      
      // Fetch user details and pending requests
      fetchUserVerificationData(transaction.userId)
    }
  }, [transaction])

  const fetchUserVerificationData = async (userId: string) => {
    setIsLoadingUserData(true)
    setError(null)
    try {
      const response = await transactionApi.getUserVerificationData(userId)
      if (response.success) {
        setUserDetails(response.data.user)
        setPendingRequests(response.data.pendingRequests.data || [])
        
        // Find current transaction index in pending requests
        const currentIndex = response.data.pendingRequests.data?.findIndex(
          (req: PendingRequest) => req.id === transaction?.id
        ) || 0
        setCurrentRequestIndex(currentIndex)
      } else {
        setError('Failed to fetch user verification data')
      }
    } catch (error) {
      console.error('Error fetching user verification data:', error)
      setError('Failed to load user data. Please try again.')
      
      // Fallback: try to fetch user details separately
      try {
        const userResponse = await transactionApi.getUserDetails(userId)
        if (userResponse.data?.user) {
          setUserDetails(userResponse.data.user)
          setError(null) // Clear error if fallback succeeds
        }
      } catch (userError) {
        console.error('Error fetching user details:', userError)
        setError('Unable to load user information. Please refresh and try again.')
      }
    } finally {
      setIsLoadingUserData(false)
    }
  }

  if (!isOpen || !transaction) {
    return null
  }

  const handleVerificationChange = useCallback((field: keyof VerificationFormData, value: any) => {
    // Sanitize string inputs to prevent XSS
    let sanitizedValue = value
    if (typeof value === 'string') {
      sanitizedValue = value.replace(/[<>]/g, '') // Remove < and > characters
    }
    
    setVerificationData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }))
  }, [])

  const handleRequestNavigation = useCallback((direction: 'prev' | 'next') => {
    if (pendingRequests.length <= 1) return
    
    let newIndex = currentRequestIndex
    if (direction === 'prev' && currentRequestIndex > 0) {
      newIndex = currentRequestIndex - 1
    } else if (direction === 'next' && currentRequestIndex < pendingRequests.length - 1) {
      newIndex = currentRequestIndex + 1
    }
    
    if (newIndex !== currentRequestIndex) {
      setCurrentRequestIndex(newIndex)
      
      // Reset form state when switching requests to prevent data corruption
      const newRequest = pendingRequests[newIndex]
      if (newRequest) {
        setVerificationData({
          observedAmount: newRequest.billAmount || 0,
          receiptDate: newRequest.billDate ? new Date(newRequest.billDate).toISOString().split('T')[0] : '',
          verificationConfirmed: false,
          rejectionNote: '',
          adminNotes: ''
        })
        setCurrentImageIndex(0)
        setImageScale(1)
        setImageRotation(0)
        setError(null)
      }
    }
  }, [pendingRequests, currentRequestIndex])

  const handleImageNavigation = useCallback((direction: 'prev' | 'next') => {
    // Currently only one image is supported, so navigation is limited
    // This function is kept for future extensibility when multiple images are supported
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1)
    } else if (direction === 'next' && currentImageIndex < 0) { // Only one image (index 0)
      setCurrentImageIndex(prev => prev + 1)
    }
  }, [currentImageIndex])

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (direction === 'in') {
      setImageScale(prev => Math.min(prev * 1.2, 3))
    } else {
      setImageScale(prev => Math.max(prev / 1.2, 0.5))
    }
  }, [])

  const handleRotate = useCallback(() => {
    setImageRotation(prev => (prev + 90) % 360)
  }, [])

  const handleReset = useCallback(() => {
    setImageScale(1)
    setImageRotation(0)
  }, [])

  const handleApprove = useCallback(async () => {
    if (!verificationData.verificationConfirmed) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Validate form data using Zod schema
      const validatedData = verificationFormSchema.parse({
        observedAmount: verificationData.observedAmount,
        receiptDate: verificationData.receiptDate,
        verificationConfirmed: verificationData.verificationConfirmed,
        rejectionNote: verificationData.rejectionNote,
        adminNotes: verificationData.adminNotes,
      })
      
      await onApprove(transaction.id, validatedData)
      onCloseRef.current()
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a Zod validation error
        if (error.message.includes('Validation') || error.message.includes('Invalid')) {
          setError(`Validation error: ${error.message}`)
        } else {
          console.error('Error approving transaction:', error)
          setError('Failed to approve transaction. Please try again.')
        }
      } else {
        console.error('Unknown error approving transaction:', error)
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [verificationData, onApprove, transaction.id])

  const handleReject = useCallback(async () => {
    if (!verificationData.rejectionNote?.trim()) return
    
    setIsSubmitting(true)
    setError(null)
    try {
      await onReject(transaction.id, verificationData.rejectionNote.trim())
      onCloseRef.current()
    } catch (error) {
      console.error('Error rejecting transaction:', error)
      setError('Failed to reject transaction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [verificationData.rejectionNote, onReject, transaction.id])

  const handleApproveAndPay = useCallback(async () => {
    if (!onApproveAndPay || !verificationData.verificationConfirmed) return
    
    setIsSubmitting(true)
    setError(null)
    try {
      await onApproveAndPay(transaction.id, verificationData)
      onCloseRef.current()
    } catch (error) {
      console.error('Error approving and paying transaction:', error)
      setError('Failed to process payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [onApproveAndPay, verificationData.verificationConfirmed, transaction.id])

  const canApprove = useMemo(() => 
    verificationData.verificationConfirmed && 
    verificationData.observedAmount > 0 &&
    verificationData.receiptDate
  , [verificationData.verificationConfirmed, verificationData.observedAmount, verificationData.receiptDate])

  const canReject = useMemo(() => 
    (verificationData.rejectionNote || '').trim().length > 0
  , [verificationData.rejectionNote])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }, [])

  const formatDate = useCallback((date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }, [])

  // Convert external receipt URLs to use API proxy to avoid CORS issues
  const getProxiedReceiptUrl = useCallback((receiptUrl: string) => {
    if (!receiptUrl) return receiptUrl;
    
    // If it's already a local API URL, return as is
    if (receiptUrl.startsWith('/api/') || receiptUrl.includes('localhost:3001')) {
      return receiptUrl;
    }
    
    // For external URLs, return as is but handle CORS errors gracefully
    return receiptUrl;
  }, [])

  const currentRequest = useMemo(() => 
    pendingRequests[currentRequestIndex] || transaction
  , [pendingRequests, currentRequestIndex, transaction])
  
  const hasMultipleRequests = useMemo(() => 
    pendingRequests.length > 1
  , [pendingRequests.length])
  
  const canNavigatePrev = useMemo(() => 
    hasMultipleRequests && currentRequestIndex > 0
  , [hasMultipleRequests, currentRequestIndex])
  
  const canNavigateNext = useMemo(() => 
    hasMultipleRequests && currentRequestIndex < pendingRequests.length - 1
  , [hasMultipleRequests, currentRequestIndex, pendingRequests.length])

  // Show keyboard shortcut feedback
  const showKeyboardFeedback = useCallback((message: string) => {
    setKeyboardFeedback(message)
    setTimeout(() => setKeyboardFeedback(null), 1500)
  }, [])

  // Enhanced keyboard shortcuts with focus management
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          showKeyboardFeedback('Closing modal...')
          setTimeout(() => onCloseRef.current(), 300) // Small delay to show feedback
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (event.altKey) {
            if (hasMultipleRequests) {
              handleRequestNavigation('prev')
              showKeyboardFeedback('Previous request')
            }
          } else {
            // Only allow image navigation if multiple images are supported
            // Currently disabled since only one image is supported
            // handleImageNavigation('prev')
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (event.altKey) {
            if (hasMultipleRequests) {
              handleRequestNavigation('next')
              showKeyboardFeedback('Next request')
            }
          } else {
            // Only allow image navigation if multiple images are supported
            // Currently disabled since only one image is supported
            // handleImageNavigation('next')
          }
          break
        case '+':
        case '=':
          event.preventDefault()
          handleZoom('in')
          showKeyboardFeedback('Zoomed in')
          break
        case '-':
          event.preventDefault()
          handleZoom('out')
          showKeyboardFeedback('Zoomed out')
          break
        case 'r':
        case 'R':
          event.preventDefault()
          handleRotate()
          showKeyboardFeedback('Image rotated')
          break
        case '0':
          event.preventDefault()
          handleReset()
          showKeyboardFeedback('Image reset')
          break
        case 'Tab':
          // Ensure focus stays within modal
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
          
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
          break
        case 'Enter':
          // Handle form submission with Enter key
          if (event.target === document.activeElement) {
            const target = event.target as HTMLElement
            if (target.tagName === 'BUTTON' && !target.hasAttribute('disabled')) {
              event.preventDefault()
              target.click()
            }
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    // Focus management: focus first focusable element when modal opens
    if (isOpen) {
      const firstFocusable = document.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100)
      }
    }
    
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasMultipleRequests, showKeyboardFeedback]) // Added hasMultipleRequests dependency

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-modal-title"
      aria-describedby="verification-modal-description"
      onClick={(e) => {
        // Only close if clicking on the backdrop, not on the modal content
        if (e.target === e.currentTarget) {
          onCloseRef.current()
        }
      }}
    >
      <div className="relative top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border shadow-lg duration-200 sm:max-w-[1000px] p-0 overflow-hidden bg-white">
        <div className="grid max-h-[85vh] grid-rows-[auto_minmax(0,1fr)_auto] bg-white">
          {/* Header */}
          <div className="px-6 pt-6">
            {/* Keyboard Shortcut Feedback */}
            {keyboardFeedback && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3 text-center" role="alert" aria-live="polite">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium text-blue-700">{keyboardFeedback}</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2 text-center sm:text-left space-y-1">
              <h2 id="verification-modal-title" className="text-lg leading-none font-semibold">Verify receipt</h2>
              <p id="verification-modal-description" className="text-muted-foreground text-sm">Compare the attached bill with the claim before deciding.</p>
              
              {/* User Request Navigation Slider */}
              {hasMultipleRequests && (
                <div className="flex items-center gap-2 mt-2" role="navigation" aria-label="Request navigation">
                  <button
                    onClick={() => handleRequestNavigation('prev')}
                    disabled={!canNavigatePrev}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    aria-label="Previous request"
                    title="Previous request (Alt + ←)"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
                    <span>Request {currentRequestIndex + 1} of {pendingRequests.length}</span>
                    {currentRequest.type && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        currentRequest.type === 'EARN' ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'
                      }`}>
                        {currentRequest.type}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleRequestNavigation('next')}
                    disabled={!canNavigateNext}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    aria-label="Next request"
                    title="Next request (Alt + →)"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-6">
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4" role="alert" aria-live="polite">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  aria-label="Dismiss error message"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="px-6 pb-6 overflow-y-auto">
            {isLoadingUserData ? (
              <VerificationModalSkeleton />
            ) : (
              <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1.25fr_1fr]">
              {/* Left Column - Receipt Image Viewer */}
              <div className="rounded-lg border p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground" aria-live="polite">
                    Image {currentImageIndex + 1} of 1
                    {/* TODO: Update this when multiple images are supported in Phase 3 */}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Image navigation buttons - currently disabled since only one image */}
                    <button
                      onClick={() => handleImageNavigation('prev')}
                      disabled={currentImageIndex === 0}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9"
                      type="button"
                      aria-label="Previous image"
                      title="Previous image (←)"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleImageNavigation('next')}
                      disabled={currentImageIndex >= 0} // Only one image currently
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9"
                      type="button"
                      aria-label="Next image"
                      title="Next image (→)"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleZoom('in')}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9"
                      type="button"
                      aria-label="Zoom in (+)"
                      title="Zoom in (+)"
                    >
                      <MagnifyingGlassPlusIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleZoom('out')}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9"
                      type="button"
                      aria-label="Zoom out (-)"
                      title="Zoom out (-)"
                    >
                      <MagnifyingGlassMinusIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRotate}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input-50 size-9"
                      type="button"
                      aria-label="Rotate (R)"
                      title="Rotate (R)"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="relative bg-zinc-50 rounded-md border overflow-hidden grid place-items-center h-[280px] sm:h-[360px] lg:h-[420px]">
                  {/* CORS Notice */}
                  {currentRequest.receiptUrl && currentRequest.receiptUrl.startsWith('http') && !currentRequest.receiptUrl.includes('localhost') && (
                    <div className="absolute top-2 left-2 z-20">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md px-2 py-1 text-xs text-yellow-800">
                        <span className="font-medium">Note:</span> External image - may have CORS restrictions
                        <button 
                          className="ml-2 text-yellow-700 hover:text-yellow-900 underline"
                          onClick={() => {
                            if (currentRequest.receiptUrl) {
                              navigator.clipboard.writeText(currentRequest.receiptUrl);
                              // You could add a toast notification here
                            }
                          }}
                          title="Copy image URL"
                        >
                          Copy URL
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {currentRequest.receiptUrl ? (
                    <>
                      {isImageLoading && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                          <div className="text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">Loading image...</p>
                          </div>
                        </div>
                      )}
                      
                      {imageLoadError ? (
                        <div className="text-center text-gray-500">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                          <p className="text-sm mb-2">Image failed to load</p>
                          <p className="text-xs text-gray-400 mb-3">This may be due to CORS restrictions</p>
                          <div className="space-y-2">
                                                                                      <button 
                               className="block w-full text-xs text-blue-600 hover:text-blue-800 underline"
                               onClick={() => {
                                 if (currentRequest.receiptUrl) {
                                   window.open(currentRequest.receiptUrl, '_blank')
                                 }
                               }}
                               disabled={!currentRequest.receiptUrl}
                             >
                               Open in new tab
                             </button>
                             <button 
                               className="block w-full text-xs text-gray-600 hover:text-gray-800 underline"
                               onClick={() => {
                                 setImageLoadError(false)
                                 setIsImageLoading(true)
                                 // Force image reload by adding timestamp
                                 if (currentRequest.receiptUrl) {
                                   const img = document.querySelector(`img[alt*="${currentRequest.id}"]`) as HTMLImageElement
                                   if (img) {
                                     img.src = `${getProxiedReceiptUrl(currentRequest.receiptUrl)}?t=${Date.now()}`
                                   }
                                 }
                               }}
                               disabled={!currentRequest.receiptUrl}
                             >
                               Retry
                             </button>
                          </div>
                        </div>
                      ) : (
                        <img 
                          alt={`Receipt image ${currentImageIndex + 1} for request ${currentRequest.id}`}
                          className={`max-h-full max-w-full object-contain transition-transform ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                          src={getProxiedReceiptUrl(currentRequest.receiptUrl)}
                          loading="lazy"
                          style={{ 
                            transform: `scale(${imageScale}) rotate(${imageRotation}deg)` 
                          }}
                          onLoad={() => {
                            setIsImageLoading(false)
                            setImageLoadError(false)
                          }}
                          onError={() => {
                            setIsImageLoading(false)
                            setImageLoadError(true)
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                        <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm">No receipt image available</p>
                    </div>
                  )}
                </div>
                
                <p className="mt-3 text-xs text-muted-foreground">
                  Tips: Use Alt + ← → to switch requests, + / - to zoom, R to rotate, 0 to reset.
                </p>
              </div>

              {/* Right Column - Verification Form */}
              <div className="rounded-lg border bg-white p-4 space-y-4">
                {/* Request Information */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent bg-secondary text-secondary-foreground">
                      #{currentRequest.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(currentRequest.createdAt)}
                    </span>
                  </div>
                  
                  {/* User Information */}
                  <div className="text-sm">
                    {isLoadingUserData ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    ) : userDetails ? (
                      <>
                        <div className="font-medium flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          {userDetails.profile?.firstName && userDetails.profile?.lastName 
                            ? `${userDetails.profile.firstName} ${userDetails.profile.lastName}`
                            : userDetails.name || `User ${userDetails.id.slice(0, 8)}...`
                          }
                        </div>
                        <div className="text-muted-foreground space-y-1">
                          {userDetails.email && (
                            <div className="flex items-center gap-1">
                              <EnvelopeIcon className="w-3 h-3" />
                              {userDetails.email}
                            </div>
                          )}
                          {(userDetails.mobileNumber || userDetails.paymentDetails?.mobileNumber) && (
                            <div className="flex items-center gap-1">
                              <PhoneIcon className="w-3 h-3" />
                              {userDetails.mobileNumber || userDetails.paymentDetails?.mobileNumber}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">
                        <div className="font-medium">
                          {`User ${currentRequest.id.slice(0, 8)}...`}
                        </div>
                        <div>User details not available</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-border shrink-0 h-px w-full"></div>

                {/* Claim Details */}
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm leading-none font-medium select-none">
                    Claim
                  </label>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2" aria-live="polite">
                    <div className="text-sm text-muted-foreground">Claimed amount</div>
                    <div className="font-medium">{formatCurrency(currentRequest.billAmount || 0)}</div>
                  </div>
                </div>

                {/* Observed Amount Input */}
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm leading-none font-medium select-none" htmlFor="observed">
                    Observed on receipt
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                      <input
                        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive pl-7 w-[200px]"
                        id="observed"
                        min="0"
                        step="1"
                        placeholder="e.g. 2450"
                        aria-describedby="observed-help"
                        aria-label="Enter the amount observed on the receipt"
                        inputMode="numeric"
                        required
                        type="number"
                        value={verificationData.observedAmount}
                        onChange={(e) => handleVerificationChange('observedAmount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div id="observed-help" className="text-xs text-muted-foreground">
                      Enter the final payable amount seen on the receipt
                    </div>
                  </div>
                </div>

                {/* Receipt Date Input */}
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm leading-none font-medium select-none" htmlFor="receiptDate">
                    Receipt date
                  </label>
                  <input
                    className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    id="receiptDate"
                    type="date"
                    aria-label="Select the date from the receipt"
                    value={verificationData.receiptDate}
                    onChange={(e) => handleVerificationChange('receiptDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="bg-border shrink-0 h-px w-full"></div>

                {/* Verification Checkbox */}
                <div className="grid gap-2">
                  <label className="text-sm leading-none font-medium select-none flex items-center gap-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={verificationData.verificationConfirmed}
                      aria-label="Confirm receipt verification"
                      onClick={() => handleVerificationChange('verificationConfirmed', !verificationData.verificationConfirmed)}
                      className={`peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${
                        verificationData.verificationConfirmed ? 'bg-primary text-primary-foreground border-primary' : ''
                      }`}
                    >
                      {verificationData.verificationConfirmed && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <span className="text-sm">I have verified the receipt details</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    By confirming, you acknowledge that the bill is legible and the observed amount matches the receipt.
                  </p>
                </div>

                {/* Admin Notes */}
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm leading-none font-medium select-none" htmlFor="adminNotes">
                    Admin notes (optional)
                  </label>
                  <textarea
                    className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    id="adminNotes"
                    placeholder="Additional notes for approval/rejection..."
                    aria-label="Add optional admin notes"
                    value={verificationData.adminNotes}
                    onChange={(e) => handleVerificationChange('adminNotes', e.target.value)}
                  />
                </div>

                {/* Rejection Note */}
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm leading-none font-medium select-none" htmlFor="rejectNote">
                    Rejection note (optional)
                  </label>
                  <textarea
                    className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    id="rejectNote"
                    placeholder="Reason if rejecting (mismatched amount, unclear bill, etc.)"
                    aria-label="Add reason for rejection if applicable"
                    value={verificationData.rejectionNote}
                    onChange={(e) => handleVerificationChange('rejectionNote', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-white flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-end">
            <button
              onClick={handleReject}
              disabled={!canReject || isSubmitting}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent dark:hover:bg-accent/50 h-9 px-4 py-2 has-[>svg]:px-3 gap-2 text-red-600 hover:text-red-700 sm:mr-auto disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Reject"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <XCircleIcon className="w-4 h-4" />
              )}
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </button>
            
            <button
              onClick={handleApprove}
              disabled={!canApprove || isSubmitting}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3 gap-2 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Approve"
              title="Enter observed amount and confirm verification"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircleIcon className="w-4 h-4" />
              )}
              {isSubmitting ? 'Approving...' : 'Approve'}
            </button>
            
            {currentRequest.type === 'REDEEM' && (
              <button
                onClick={handleApproveAndPay}
                disabled={!canApprove || isSubmitting}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Approve and proceed to payment"
                title="Enter observed amount matching the claim and confirm verification"
              >
                {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheckIcon className="w-4 h-4" />
              )}
              {isSubmitting ? 'Processing...' : 'Approve & Pay'}
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onCloseRef.current()}
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:not([class*='size-'])]:size-4"
        >
          <XMarkIcon className="w-6 h-6" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )
})
