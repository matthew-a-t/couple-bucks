import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { Toaster } from '@/components/ui/toaster'
import { InstallPrompt, OfflineIndicator } from '@/components/shared'

// Auth pages
import { LoginPage, SignupPage, ResetPasswordPage } from '@/pages/auth'

// Onboarding pages
import {
  OnboardingLandingPage,
  OnboardingSurveyPage,
  PermissionTierPage,
  QuickAddButtonsPage,
  CoupleSetupPage,
  WaitingForPartnerPage,
  SurveyReviewPage,
  QuickAddReviewPage
} from '@/pages/onboarding'

// Dashboard
import { DashboardPage } from '@/pages/dashboard/DashboardPage'

// Expenses
import { ExpensesPage } from '@/pages/expenses/ExpensesPage'

// Budgets
import { BudgetsPage } from '@/pages/budgets/BudgetsPage'

// Bills
import { BillsPage } from '@/pages/bills/BillsPage'

// Reports
import { ReportsPage } from '@/pages/reports'

// Settings
import { SettingsPage } from '@/pages/settings'

// Protected Route
import { ProtectedRoute } from '@/components/auth'

function App() {
  const { initialize, isInitialized } = useAuthStore()

  // Initialize auth state on app load
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  return (
    <>
      <OfflineIndicator />
      <InstallPrompt />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Onboarding Routes (protected) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingLandingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/survey"
          element={
            <ProtectedRoute>
              <OnboardingSurveyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/permission"
          element={
            <ProtectedRoute>
              <PermissionTierPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/quick-add"
          element={
            <ProtectedRoute>
              <QuickAddButtonsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/couple-setup"
          element={
            <ProtectedRoute>
              <CoupleSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/waiting"
          element={
            <ProtectedRoute>
              <WaitingForPartnerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/survey-review"
          element={
            <ProtectedRoute>
              <SurveyReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/quick-add-review"
          element={
            <ProtectedRoute>
              <QuickAddReviewPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard (protected, requires couple pairing) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requirePaired={false}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Expenses Routes */}
        <Route
          path="/expenses"
          element={
            <ProtectedRoute requirePaired={true}>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />

        {/* Budgets Routes (Manager only) */}
        <Route
          path="/budgets"
          element={
            <ProtectedRoute requirePaired={true} requireTier="manager">
              <BudgetsPage />
            </ProtectedRoute>
          }
        />

        {/* Bills Routes */}
        <Route
          path="/bills"
          element={
            <ProtectedRoute requirePaired={true}>
              <BillsPage />
            </ProtectedRoute>
          }
        />

        {/* Reports Routes */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute requirePaired={true} requireTier="manager">
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings Routes */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute requirePaired={true}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-muted-foreground mb-4">Page not found</p>
                <a href="/login" className="text-primary hover:underline">
                  Go to login
                </a>
              </div>
            </div>
          }
        />
      </Routes>

      {/* Toast notifications */}
      <Toaster />
    </>
  )
}

export default App
