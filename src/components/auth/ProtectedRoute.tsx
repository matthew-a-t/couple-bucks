import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requirePaired?: boolean // Require user to have completed couple pairing
  requireTier?: 'logger' | 'manager' // Require specific permission tier
}

export const ProtectedRoute = ({
  children,
  requirePaired = false,
  requireTier
}: ProtectedRouteProps) => {
  const location = useLocation()
  const { session, isLoading, isInitialized, initialize } = useAuthStore()

  // Initialize auth state on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  // Show loading spinner while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if couple pairing is required
  if (requirePaired && !session.couple?.is_paired) {
    return <Navigate to="/onboarding" replace />
  }

  // Check permission tier
  if (requireTier && session.profile.permission_tier !== requireTier) {
    // If user doesn't have required tier, redirect to dashboard with error
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
