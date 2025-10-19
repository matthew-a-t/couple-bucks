import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { budgetFormSchema, type BudgetFormData } from '@/types/schemas'
import { budgetsService } from '@/services'
import type { BudgetWithProgress } from '@/types'
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

interface EditBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget: BudgetWithProgress | null
  onBudgetUpdated?: () => void
}

export const EditBudgetDialog = ({
  open,
  onOpenChange,
  budget,
  onBudgetUpdated
}: EditBudgetDialogProps) => {
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

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

  // Update form when budget changes
  useEffect(() => {
    if (budget) {
      setValue('category', budget.category)
      setValue('limit_amount', budget.limit_amount.toString())
    }
  }, [budget, setValue])

  const onSubmit = async (data: BudgetFormData) => {
    try {
      setError(null)

      if (!budget) {
        throw new Error('No budget selected')
      }

      const limitAmount = parseFloat(data.limit_amount)

      await budgetsService.updateBudget(budget.id, {
        category: data.category,
        limit_amount: limitAmount
      })

      toast({
        title: 'Category updated!',
        description: `${data.category} has been updated`
      })

      reset()
      onBudgetUpdated?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Update budget error:', err)
      setError(err.message || 'Failed to update category. Please try again.')
    }
  }

  const handleClose = () => {
    reset()
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

          {/* Category Name */}
          <div className="space-y-3">
            <Label htmlFor="edit-category" className="text-base font-semibold">Category Name *</Label>
            <Input
              id="edit-category"
              placeholder="Category name..."
              {...register('category')}
              disabled={isSubmitting}
              className="h-14 text-lg rounded-xl"
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Limit Amount */}
          <div className="space-y-3">
            <Label htmlFor="edit-limit" className="text-base font-semibold">Spending Limit *</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                $
              </span>
              <Input
                id="edit-limit"
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
          </div>

          {budget && (
            <div className="p-5 bg-accent/10 rounded-2xl text-base">
              <p className="text-muted-foreground">
                Current spending: <span className="font-semibold text-foreground">${budget.current_spent.toFixed(2)}</span>
              </p>
            </div>
          )}

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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
