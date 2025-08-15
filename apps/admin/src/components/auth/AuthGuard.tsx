'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/common'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login' && pathname !== '/') {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If not authenticated and not on login page or landing page, don't render anything (will redirect)
  if (!isAuthenticated && pathname !== '/login' && pathname !== '/') {
    return null
  }

  // If on login page and authenticated, redirect to dashboard
  if (isAuthenticated && pathname === '/login') {
    router.push('/')
    return null
  }

  return <>{children}</>
}
