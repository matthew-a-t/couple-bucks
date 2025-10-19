import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { budgetFormSchema, type BudgetFormData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { budgetsService } from '@/services'
import { DEFAULT_CATEGORIES } from '@/types'
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus } from 'lucide-react'

interface AddBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBudgetAdded?: () => void
  existingCategories?: string[]
}

export const AddBudgetDialog = ({
  open,
  onOpenChange,
  onBudgetAdded,
  existingCategories = []
}: AddBudgetDialogProps) => {
  const session = useAuthStore((state) => state.session)
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  const allCategories = session?.couple?.custom_categories || DEFAULT_CATEGORIES.map((c) => c.name)

  // Filter out categories that already have budgets
  const availableCategories = allCategories.filter(
    (cat) => !existingCategories.includes(cat)
  )

  const [categoryInput, setCategoryInput] = useState('')

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

  // Filter suggestions based on input
  const filteredSuggestions = categoryInput
    ? availableCategories.filter((cat) =>
        cat.toLowerCase().includes(categoryInput.toLowerCase())
      )
    : availableCategories

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

      toast({
        title: 'Category created!',
        description: `$${limitAmount.toFixed(2)} limit set for ${data.category}`
      })

      reset()
      setCategoryInput('')
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
            <Label htmlFor="category" className="text-base font-semibold">Category Name *</Label>
            <Input
              id="category"
              placeholder="Select or type a category name..."
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

            {/* Available Categories */}
            {filteredSuggestions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  {categoryInput ? 'Matching categories:' : 'Available categories:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {filteredSuggestions.map((cat) => {
                    const categoryData = DEFAULT_CATEGORIES.find((c) => c.name === cat)
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoryInput(cat)
                          setValue('category', cat)
                        }}
                        className="flex items-center gap-2 px-5 py-3 text-base font-medium bg-primary/10 hover:bg-primary/20 rounded-full transition-all hover:scale-105 min-h-[44px]"
                      >
                        <span className="text-lg">{categoryData?.emoji || '📦'}</span>
                        <span>{cat}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {categoryInput && !filteredSuggestions.some((cat) => cat.toLowerCase() === categoryInput.toLowerCase()) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span>Create new category: "{categoryInput}"</span>
              </div>
            )}
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
