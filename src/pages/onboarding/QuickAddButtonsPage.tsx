import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { quickAddButtonsSchema, type QuickAddButtonsData } from '@/types/schemas'
import { DEFAULT_CATEGORIES } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const QuickAddButtonsPage = () => {
  const navigate = useNavigate()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const {
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<QuickAddButtonsData>({
    resolver: zodResolver(quickAddButtonsSchema)
  })

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

  const onSubmit = async () => {
    try {
      setError(null)

      // Validate we have at least 4 and at most 6
      if (selectedCategories.length < 4) {
        setError('Please select at least 4 categories')
        return
      }

      if (selectedCategories.length > 6) {
        setError('Please select at most 6 categories')
        return
      }

      // Store selected buttons in sessionStorage
      sessionStorage.setItem('onboarding_quick_add', JSON.stringify(selectedCategories))

      // Navigate to couple setup
      navigate('/onboarding/couple-setup')
    } catch (err: any) {
      console.error('Quick-add buttons error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">3</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Customize quick-add buttons</CardTitle>
          <CardDescription>
            Select 4-6 categories for one-tap expense logging
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
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

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || selectedCategories.length < 4}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
