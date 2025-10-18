import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteCodeSchema, type InviteCodeData } from '@/types/schemas'
import type { OnboardingSurveyData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { couplesService } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, UserPlus, Link as LinkIcon } from 'lucide-react'

export const CoupleSetupPage = () => {
  const navigate = useNavigate()
  const { session, refreshSession } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<InviteCodeData>({
    resolver: zodResolver(inviteCodeSchema)
  })

  // Create new couple (User 1)
  const handleCreateCouple = async () => {
    try {
      setError(null)
      setIsCreating(true)

      if (!session) {
        throw new Error('No active session')
      }

      // Get onboarding data from sessionStorage
      const surveyData = sessionStorage.getItem('onboarding_survey')
      const quickAddData = sessionStorage.getItem('onboarding_quick_add')

      if (!surveyData) {
        throw new Error('Missing survey data. Please start over.')
      }

      const survey: OnboardingSurveyData = JSON.parse(surveyData)
      const quickAddButtons = quickAddData ? JSON.parse(quickAddData) : undefined

      // Create couple
      await couplesService.createCouple(
        session.user.id,
        survey.accountType,
        survey.splitMethod,
        survey.trackIncome,
        undefined, // Use default categories
        quickAddButtons
      )

      // Refresh session to get couple data
      await refreshSession()

      // Clear onboarding data
      sessionStorage.removeItem('onboarding_survey')
      sessionStorage.removeItem('onboarding_tier')
      sessionStorage.removeItem('onboarding_quick_add')

      // Navigate to waiting page
      navigate('/onboarding/waiting')
    } catch (err: any) {
      console.error('Create couple error:', err)
      setError(err.message || 'Failed to create couple. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Join existing couple (User 2)
  const handleJoinCouple = async (data: InviteCodeData) => {
    try {
      setError(null)

      if (!session) {
        throw new Error('No active session')
      }

      // Join couple with invite code
      await couplesService.joinCouple(session.user.id, data.inviteCode.toUpperCase())

      // Refresh session to get couple data
      await refreshSession()

      // Clear onboarding data
      sessionStorage.removeItem('onboarding_survey')
      sessionStorage.removeItem('onboarding_tier')
      sessionStorage.removeItem('onboarding_quick_add')

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Join couple error:', err)
      setError(err.message || 'Invalid invite code. Please check and try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">4</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Connect with your partner</CardTitle>
          <CardDescription>
            Create a new couple account or join your partner's
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create new</TabsTrigger>
              <TabsTrigger value="join">Join existing</TabsTrigger>
            </TabsList>

            {/* Create New Couple */}
            <TabsContent value="create" className="space-y-4 mt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <UserPlus className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Start a new couple account</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll get an invite code to share with your partner
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating couple account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create couple account
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Join Existing Couple */}
            <TabsContent value="join" className="space-y-4 mt-6">
              <div className="p-4 bg-accent/50 rounded-lg text-center">
                <LinkIcon className="h-12 w-12 text-secondary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Join your partner's account</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the invite code your partner shared with you
                </p>
              </div>

              <form onSubmit={handleSubmit(handleJoinCouple)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="ABCD1234"
                    {...register('inviteCode')}
                    disabled={isSubmitting}
                    className="text-center text-lg font-mono uppercase tracking-widest"
                    maxLength={20}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase()
                    }}
                  />
                  {errors.inviteCode && (
                    <p className="text-sm text-destructive">{errors.inviteCode.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The invite code is case-insensitive
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Join couple
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
