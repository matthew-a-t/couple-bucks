import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { budgetFormSchema, type BudgetFormData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { budgetsService, couplesService } from '@/services'
import { MAX_CATEGORIES } from '@/types'
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface AddBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBudgetAdded?: () => void
}

export const AddBudgetDialog = ({
  open,
  onOpenChange,
  onBudgetAdded
}: AddBudgetDialogProps) => {
  const session = useAuthStore((state) => state.session)
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  const [categoryInput, setCategoryInput] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('📦')

  const currentCategoryCount = session?.couple?.custom_categories?.length || 0

  const commonEmojis = ['💰', '🍔', '🚗', '⚡', '🎮', '🛒', '🏥', '🏠', '🐾', '📦', '✈️', '👕', '📚', '🎬', '☕']

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: '',
      limit_amount: ''
    }
  })

  const onSubmit = async (data: BudgetFormData) => {
    try {
      setError(null)

      if (!session?.couple?.id) {
        throw new Error('No active couple')
      }

      const limitAmount = parseFloat(data.limit_amount)

      await budgetsService.createBudgetForCategory(
        session.couple.id,
        data.category,
        limitAmount
      )

      // Always save emoji selection
      await couplesService.updateCategoryEmoji(session.couple.id, data.category, selectedEmoji)

      // Refresh session to get updated emoji mapping
      await useAuthStore.getState().refreshSession()

      toast({
        title: 'Category created!',
        description: `$${limitAmount.toFixed(2)} limit set for ${data.category}`
      })

      reset()
      setCategoryInput('')
      setSelectedEmoji('📦')
      onBudgetAdded?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Add budget error:', err)
      setError(err.message || 'Failed to create category. Please try again.')
    }
  }

  const handleClose = () => {
    reset()
    setCategoryInput('')
    setSelectedEmoji('📦')
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Category */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="category" className="text-base font-semibold">Category Name *</Label>
              <span className="text-sm text-muted-foreground">
                {currentCategoryCount}/{MAX_CATEGORIES} categories
              </span>
            </div>
            <Input
              id="category"
              placeholder="Type a category name..."
              {...register('category')}
              value={categoryInput}
              onChange={(e) => {
                const value = e.target.value
                setCategoryInput(value)
                setValue('category', value)
              }}
              disabled={isSubmitting}
              className="h-14 text-lg rounded-xl"
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Emoji Selection - Always visible */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Choose Icon</Label>
            <div className="flex flex-wrap gap-2">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-12 h-12 rounded-lg transition-all hover:scale-110 flex items-center justify-center text-2xl ${
                    selectedEmoji === emoji
                      ? 'bg-primary/20 ring-2 ring-primary'
                      : 'bg-accent hover:bg-accent/80'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-emoji" className="text-sm text-muted-foreground">
                Or enter custom emoji:
              </Label>
              <Input
                id="custom-emoji"
                type="text"
                placeholder="🎯"
                value={selectedEmoji}
                onChange={(e) => setSelectedEmoji(e.target.value)}
                className="w-20 h-10 text-center text-xl"
                maxLength={2}
              />
            </div>
          </div>

          {/* Limit Amount */}
          <div className="space-y-3">
            <Label htmlFor="limit_amount" className="text-base font-semibold">Spending Limit *</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                $
              </span>
              <Input
                id="limit_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8 h-14 text-lg rounded-xl"
                {...register('limit_amount')}
                disabled={isSubmitting}
              />
            </div>
            {errors.limit_amount && (
              <p className="text-sm text-destructive">{errors.limit_amount.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This is an ongoing limit. It won't reset automatically.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-14 text-base font-semibold rounded-2xl"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-14 text-base font-semibold rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Category'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
