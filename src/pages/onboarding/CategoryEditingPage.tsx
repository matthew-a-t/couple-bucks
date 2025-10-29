import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_CATEGORIES, MAX_CATEGORIES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ArrowRight, Plus, Trash2, Smile } from 'lucide-react'
import { useAuthStore } from '@/store'
import { couplesService } from '@/services'
import { OnboardingProgress } from '@/components/shared/OnboardingProgress'

// Common category emojis for selection
const EMOJI_OPTIONS = [
  '🛒', '🍽️', '🚗', '💡', '🎬', '🛍️', '🏥', '🏠', '🐾', '📦',
  '☕', '🍕', '🍔', '🎮', '💰', '✈️', '🏋️', '📱', '👕', '🎵',
  '📚', '🌳', '🔧', '💻', '🎨', '⚡', '🎯', '🍷', '🚌', '⛽',
  '🏪', '🎁', '💊', '🌟', '🔑', '📺', '☎️', '💳', '🎓', '⚽'
]

interface CategoryEdit {
  id: string
  originalName: string
  customName: string
  emoji: string
}

export const CategoryEditingPage = () => {
  const navigate = useNavigate()
  const { session, refreshSession } = useAuthStore()

  // Initialize with default categories
  const [categories, setCategories] = useState<CategoryEdit[]>(
    DEFAULT_CATEGORIES.map((cat, index) => ({
      id: `cat-${index}`,
      originalName: cat.name,
      customName: cat.name,
      emoji: cat.emoji
    }))
  )

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateCategoryName = (id: string, newName: string) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, customName: newName } : cat
    ))
  }

  const updateCategoryEmoji = (id: string, newEmoji: string) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, emoji: newEmoji } : cat
    ))
  }

  const addCategory = () => {
    if (categories.length >= MAX_CATEGORIES) {
      setError(`Maximum of ${MAX_CATEGORIES} categories allowed`)
      return
    }
    const newCategory: CategoryEdit = {
      id: `cat-${Date.now()}`,
      originalName: '',
      customName: '',
      emoji: '📦'
    }
    setCategories([...categories, newCategory])
    setError(null)
  }

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) {
      setError('You must have at least one category')
      return
    }
    setCategories(categories.filter(cat => cat.id !== id))
    setError(null)
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

      // Save custom categories (names and emojis)
      const categoryNames = categories.map((cat) => cat.customName.trim())
      await couplesService.updateCategories(session.couple.id, categoryNames)

      // Save custom category emojis
      const emojiMap: Record<string, string> = {}
      categories.forEach((cat) => {
        emojiMap[cat.customName.trim()] = cat.emoji
      })
      await couplesService.updateCouple(session.couple.id, {
        custom_category_emojis: emojiMap
      })

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
          <OnboardingProgress currentStep={3} totalSteps={4} />
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
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Category Names</Label>
                <span className="text-sm text-muted-foreground">
                  {categories.length}/{MAX_CATEGORIES} categories
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-white">
                      {/* Emoji Picker */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="text-3xl flex-shrink-0 hover:bg-accent/50 rounded-lg p-1 transition-colors relative group"
                            title="Change emoji"
                          >
                            {category.emoji}
                            <Smile className="absolute -bottom-1 -right-1 h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4">
                          <div className="space-y-3">
                            <Label className="text-base font-semibold">Choose Icon</Label>
                            <div className="flex flex-wrap gap-2">
                              {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => updateCategoryEmoji(category.id, emoji)}
                                  className={`w-12 h-12 rounded-lg transition-all hover:scale-110 flex items-center justify-center text-2xl ${
                                    category.emoji === emoji
                                      ? 'bg-primary/20 ring-2 ring-primary'
                                      : 'bg-accent hover:bg-accent/80'
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm text-muted-foreground">
                                Or enter custom:
                              </Label>
                              <Input
                                type="text"
                                placeholder="🎯"
                                value={category.emoji}
                                onChange={(e) => updateCategoryEmoji(category.id, e.target.value)}
                                className="w-20 h-10 text-center text-xl"
                                maxLength={2}
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Category Name Input */}
                      <div className="flex-1">
                        <Input
                          value={category.customName}
                          onChange={(e) => updateCategoryName(category.id, e.target.value)}
                          placeholder="Category name"
                          className="h-9 bg-white"
                          maxLength={20}
                        />
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => deleteCategory(category.id)}
                        className="text-error hover:bg-error/10 rounded-lg p-2 transition-colors flex-shrink-0"
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add New Category Card */}
                {categories.length < MAX_CATEGORIES && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={addCategory}
                      className="w-full flex items-center gap-2 p-3 border-2 border-dashed rounded-lg bg-white transition-all hover:shadow-lg hover:border-primary/70 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors flex-shrink-0">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-muted-foreground">Add Category</div>
                      </div>
                    </button>
                  </div>
                )}
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
