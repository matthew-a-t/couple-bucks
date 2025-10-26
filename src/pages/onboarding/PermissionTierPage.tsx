import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { permissionTierSchema, type PermissionTierData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, UserCheck, Users } from 'lucide-react'

export const PermissionTierPage = () => {
  const navigate = useNavigate()
  const { session, updateProfile } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const {
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PermissionTierData>({
    resolver: zodResolver(permissionTierSchema)
  })

  const onSubmit = async (data: PermissionTierData) => {
    try {
      setError(null)

      console.log('[PermissionTier] Submitting:', data)

      // Update user's permission tier
      await updateProfile({ permission_tier: data.permissionTier })

      console.log('[PermissionTier] Success, navigating to categories')

      // Determine if user is User 2 (joined via invite code)
      const isUser2 = session?.couple?.user2_id === session?.user?.id

      // Navigate to appropriate page
      // User 2 goes to review page, User 1 goes to regular categories page
      if (isUser2) {
        navigate('/onboarding/categories-review')
      } else {
        navigate('/onboarding/categories')
      }
    } catch (err: any) {
      console.error('[PermissionTier] Error:', err)
      setError(err.message || 'Failed to save permission tier. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">2</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Choose your involvement level</CardTitle>
          <CardDescription>
            This determines what features you'll see. You can change this later.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <RadioGroup
              onValueChange={(value) => setValue('permissionTier', value as any)}
              className="space-y-4"
            >
              {/* Logger Option */}
              <div className="relative">
                <RadioGroupItem
                  value="logger"
                  id="logger"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="logger"
                  className="flex flex-col p-6 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <UserCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-2">Logger</div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Perfect if you just want to log expenses and stay informed
                      </p>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>Log expenses</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>View spending summaries</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>See bills and due dates</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>Receive budget notifications</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              {/* Manager Option */}
              <div className="relative">
                <RadioGroupItem
                  value="manager"
                  id="manager"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="manager"
                  className="flex flex-col p-6 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-secondary/10 rounded-lg">
                      <Users className="h-6 w-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-2">Manager</div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Full access to manage budgets, bills, and detailed reports
                      </p>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>Everything in Logger, plus...</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>Create and edit budgets</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>Manage bills and reminders</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>View detailed reports</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>Edit any expense</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">✓</span>
                          <span>Export data to CSV</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {errors.permissionTier && (
              <p className="text-sm text-destructive text-center">
                {errors.permissionTier.message}
              </p>
            )}

            <div className="bg-accent/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Both partners can choose different levels. You can change
                your tier anytime in settings.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
