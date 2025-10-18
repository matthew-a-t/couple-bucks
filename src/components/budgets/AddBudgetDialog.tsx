import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { budgetFormSchema, type BudgetFormData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { budgetsService } from '@/services'
import { DEFAULT_CATEGORIES } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, PiggyBank } from 'lucide-react'

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

  const {
    register,
    handleSubmit,
    watch,
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

      toast({
        title: 'Budget created!',
        description: `$${limitAmount.toFixed(2)} limit set for ${data.category}`
      })

      reset()
      onBudgetAdded?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Add budget error:', err)
      setError(err.message || 'Failed to create budget. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Create Budget
          </DialogTitle>
          <DialogDescription>Set a spending limit for a category</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {availableCategories.length === 0 ? (
            <Alert>
              <AlertDescription>
                All categories already have budgets. Delete a budget to create a new one.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              {/* Limit Amount */}
              <div className="space-y-2">
                <Label htmlFor="limit_amount">Monthly Limit *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="limit_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
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
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Budget'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
