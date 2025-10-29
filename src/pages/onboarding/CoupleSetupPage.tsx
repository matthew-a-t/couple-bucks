import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { couplesService } from '@/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus } from 'lucide-react'
import { OnboardingProgress } from '@/components/shared/OnboardingProgress'

export const CoupleSetupPage = () => {
  const navigate = useNavigate()
  const { session, refreshSession } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Finalize couple setup (User 1)
  const handleCreateCouple = async () => {
    try {
      setError(null)
      setIsCreating(true)

      if (!session) {
        throw new Error('No active session')
      }

      if (!session.couple) {
        throw new Error('No couple found. Please complete the survey first.')
      }

      // Mark survey as completed by User 1 (set to pending_review)
      await couplesService.completeSurveyByUser1(session.couple.id)

      // Update profile to mark onboarding as completed
      await useAuthStore.getState().updateProfile({ onboarding_completed: true })

      // Refresh session to get updated couple data
      await refreshSession()

      // Navigate to waiting page
      navigate('/onboarding/waiting')
    } catch (err: any) {
      console.error('Finalize couple error:', err)
      setError(err.message || 'Failed to finalize couple setup. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <OnboardingProgress currentStep={4} totalSteps={4} />
          <CardTitle className="text-2xl">Almost done!</CardTitle>
          <CardDescription>
            Let's create your couple account and get your invite code
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-4">
            <div className="p-6 bg-accent/50 rounded-lg">
              <UserPlus className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-xl mb-2">Ready to finalize!</h3>
              <p className="text-sm text-muted-foreground">
                Click below to get your invite code and share it with your partner
              </p>
            </div>

            <Button
              onClick={handleCreateCouple}
              disabled={isCreating}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Finalizing setup...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Get Invite Code
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground pt-4">
              Your partner will be able to review and modify your answers when they join
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
