import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_CATEGORIES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store'
import { couplesService } from '@/services'

interface CategoryEdit {
  originalName: string
  customName: string
  emoji: string
}

export const CategoryEditingPage = () => {
  const navigate = useNavigate()
  const { session, refreshSession } = useAuthStore()

  // Initialize with default categories
  const [categories, setCategories] = useState<CategoryEdit[]>(
    DEFAULT_CATEGORIES.map((cat) => ({
      originalName: cat.name,
      customName: cat.name,
      emoji: cat.emoji
    }))
  )

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateCategoryName = (index: number, newName: string) => {
    const updated = [...categories]
    updated[index].customName = newName
    setCategories(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setError(null)
      setIsSubmitting(true)

      // Validate all categories have names
      const emptyCategories = categories.filter((cat) => !cat.customName.trim())
      if (emptyCategories.length > 0) {
        setError('All category names must be filled in')
        setIsSubmitting(false)
        return
      }

      // Check for duplicate names
      const names = categories.map((cat) => cat.customName.trim().toLowerCase())
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
      if (duplicates.length > 0) {
        setError('Category names must be unique')
        setIsSubmitting(false)
        return
      }

      if (!session?.couple?.id) {
        throw new Error('No couple found. Please complete the survey first.')
      }

      // Save custom categories (just the names)
      const categoryNames = categories.map((cat) => cat.customName.trim())
      await couplesService.updateCategories(session.couple.id, categoryNames)

      // Refresh session to get updated couple data
      await refreshSession()

      // Navigate to couple setup
      navigate('/onboarding/couple-setup')
    } catch (err: any) {
      console.error('Category editing error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = () => {
    return categories.some((cat) => cat.customName.trim() !== cat.originalName)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">3</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Customize spending categories</CardTitle>
          <CardDescription>
            Personalize your category names to match how you track expenses
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label className="text-base font-semibold">Category Names</Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category, index) => (
                  <div key={category.originalName} className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                      <span className="text-3xl flex-shrink-0">{category.emoji}</span>
                      <div className="flex-1">
                        <Input
                          value={category.customName}
                          onChange={(e) => updateCategoryName(index, e.target.value)}
                          placeholder={category.originalName}
                          className="h-9"
                          maxLength={20}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Use names that make sense for your household. For example,
                change "Dining Out" to "Restaurants" or "Entertainment" to "Fun Money". You can
                always change these later in settings.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {hasChanges() ? 'Save & Continue' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
