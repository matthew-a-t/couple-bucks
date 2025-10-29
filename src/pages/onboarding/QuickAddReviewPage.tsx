import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_CATEGORIES } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store'
import { couplesService } from '@/services'
import { OnboardingProgress } from '@/components/shared/OnboardingProgress'

export const QuickAddReviewPage = () => {
  const navigate = useNavigate()
  const { session, refreshSession } = useAuthStore()
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    session?.couple?.quick_add_buttons || []
  )
  const [initialCategories, setInitialCategories] = useState<string[]>(
    session?.couple?.quick_add_buttons || []
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load User 1's choices on mount
  useEffect(() => {
    if (session?.couple?.quick_add_buttons) {
      const buttons = session.couple.quick_add_buttons
      console.log('[QuickAddReview] Loading buttons:', buttons, 'Count:', buttons.length)
      setSelectedCategories([...buttons]) // Create new array to ensure state update
      setInitialCategories([...buttons])
    } else {
      console.log('[QuickAddReview] No quick_add_buttons found in session')
    }
  }, [session?.couple?.quick_add_buttons])

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryName)) {
        return prev.filter((c) => c !== categoryName)
      } else {
        // Limit to 6 categories
        if (prev.length >= 6) {
          return prev
        }
        return [...prev, categoryName]
      }
    })
  }

  const hasChanges = () => {
    return JSON.stringify(selectedCategories.sort()) !== JSON.stringify(initialCategories.sort())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setError(null)
      setIsSubmitting(true)

      // Validate we have at least 4 and at most 6
      if (selectedCategories.length < 4) {
        setError('Please select at least 4 categories')
        return
      }

      if (selectedCategories.length > 6) {
        setError('Please select at most 6 categories')
        return
      }

      if (!session?.couple?.id) {
        throw new Error('No couple found. Please ask your partner for a new invite code.')
      }

      // Save changes if user modified the selection
      if (hasChanges()) {
        await couplesService.updateSurveyAnswers(
          session.couple.id,
          undefined,
          undefined,
          undefined,
          selectedCategories
        )
      }

      // Approve survey (User 2 has completed review)
      await couplesService.approveSurvey(session.couple.id)

      // Mark onboarding as completed
      await useAuthStore.getState().updateProfile({ onboarding_completed: true })

      await refreshSession()

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Quick-add review error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <OnboardingProgress currentStep={3} totalSteps={4} />
          <CardTitle className="text-2xl">Review quick-add buttons</CardTitle>
          <CardDescription>
            Your partner selected these categories. Modify if needed.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {hasChanges() && (
              <Alert>
                <AlertDescription>
                  You've made changes. Click Continue to save them.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Choose your categories</Label>
                <span className="text-sm text-muted-foreground">
                  {selectedCategories.length} / 6 selected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category.name)
                  const isDisabled = !isSelected && selectedCategories.length >= 6

                  return (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => toggleCategory(category.name)}
                      disabled={isDisabled}
                      className={cn(
                        'relative flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all',
                        'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                        isSelected && 'border-primary bg-primary/5',
                        !isSelected && !isDisabled && 'border-border',
                        isDisabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <span className="text-3xl mb-2">{category.emoji}</span>
                      <span className="text-sm font-medium text-center">
                        {category.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-accent/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Choose your most frequent expenses for faster logging. You
                can always change these later in settings.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || selectedCategories.length < 4}
              >
                {hasChanges() ? 'Save & Continue' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
