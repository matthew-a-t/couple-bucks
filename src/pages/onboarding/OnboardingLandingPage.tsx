import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteCodeSchema, type InviteCodeData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { couplesService } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, UserPlus, Link as LinkIcon } from 'lucide-react'

export const OnboardingLandingPage = () => {
  const navigate = useNavigate()
  const { session, refreshSession } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<InviteCodeData>({
    resolver: zodResolver(inviteCodeSchema)
  })

  // Start creating new couple (User 1)
  const handleCreateNew = () => {
    navigate('/onboarding/survey')
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

      // Navigate to survey review page (User 2 reviews User 1's answers)
      navigate('/onboarding/survey-review')
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
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">CB</span>
            </div>
          </div>
          <CardTitle className="text-3xl">Welcome to Couple Bucks!</CardTitle>
          <CardDescription className="text-lg">
            Let's get started managing your finances together
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
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="join">Join Partner</TabsTrigger>
            </TabsList>

            {/* Create New Couple */}
            <TabsContent value="create" className="space-y-4 mt-6">
              <div className="text-center space-y-4">
                <div className="p-6 bg-accent/50 rounded-lg">
                  <UserPlus className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-xl mb-2">Start Your Couple Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Answer a few questions to customize Couple Bucks for you and your partner.
                    You'll get an invite code to share when you're done.
                  </p>
                  <ul className="text-sm text-muted-foreground text-left space-y-2 max-w-md mx-auto">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>Set up your financial preferences</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>Choose your permission level</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>Get invite code for your partner</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={handleCreateNew}
                  className="w-full"
                  size="lg"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Start Setup
                </Button>
              </div>
            </TabsContent>

            {/* Join Existing Couple */}
            <TabsContent value="join" className="space-y-4 mt-6">
              <div className="p-6 bg-accent/50 rounded-lg text-center">
                <LinkIcon className="h-16 w-16 text-secondary mx-auto mb-4" />
                <h3 className="font-semibold text-xl mb-2">Join Your Partner's Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the invite code your partner shared with you to get started right away.
                </p>
                <ul className="text-sm text-muted-foreground text-left space-y-2 max-w-md mx-auto">
                  <li className="flex items-start">
                    <span className="text-secondary mr-2">✓</span>
                    <span>Review your partner's setup</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-secondary mr-2">✓</span>
                    <span>Modify any preferences if needed</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-secondary mr-2">✓</span>
                    <span>Choose your own permission level</span>
                  </li>
                </ul>
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
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-5 w-5" />
                      Join Partner
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
