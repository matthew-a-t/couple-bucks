import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseFormSchema, type ExpenseFormData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { expensesService, budgetsService } from '@/services'
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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, X } from 'lucide-react'

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCategory?: string
  onExpenseAdded?: () => void
}

export const AddExpenseDialog = ({
  open,
  onOpenChange,
  defaultCategory,
  onExpenseAdded
}: AddExpenseDialogProps) => {
  const session = useAuthStore((state) => state.session)
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const categories = session?.couple?.custom_categories || DEFAULT_CATEGORIES.map((c) => c.name)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: defaultCategory || '',
      split_type: (session?.couple?.default_split_type as ExpenseFormData['split_type']) || 'fifty_fifty',
      split_percentage_user1: 50,
      split_percentage_user2: 50
    }
  })

  const splitType = watch('split_type')
  const splitUser1 = watch('split_percentage_user1')
  const splitUser2 = watch('split_percentage_user2')

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Please upload an image file',
          variant: 'destructive'
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Receipt image must be less than 5MB',
          variant: 'destructive'
        })
        return
      }

      setReceiptFile(file)
    }
  }

  const onSubmit: SubmitHandler<ExpenseFormData> = async (data) => {
    try {
      setError(null)

      if (!session?.couple?.id || !session.user.id) {
        throw new Error('No active session')
      }

      const amount = parseFloat(data.amount)

      // Create expense
      await expensesService.createExpenseWithSplit(
        session.couple.id,
        session.user.id,
        amount,
        data.category,
        data.split_type,
        data.description,
        undefined, // receipt_url will be added in Phase 9
        data.split_percentage_user1,
        data.split_percentage_user2
      )

      // Update budget spending if category has budget
      await budgetsService.incrementBudgetSpending(session.couple.id, data.category, amount)

      toast({
        title: 'Expense logged!',
        description: `$${amount.toFixed(2)} added to ${data.category}`
      })

      // Reset form
      reset()
      setReceiptFile(null)

      // Notify parent
      onExpenseAdded?.()
    } catch (err: any) {
      console.error('Add expense error:', err)
      setError(err.message || 'Failed to add expense. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Log a new expense for your couple</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                {...register('amount')}
                disabled={isSubmitting}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

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
                {categories.map((cat) => (
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What was this for?"
              rows={2}
              {...register('description')}
              disabled={isSubmitting}
            />
          </div>

          {/* Split Type */}
          <div className="space-y-3">
            <Label>How to split this expense?</Label>
            <RadioGroup
              value={splitType}
              onValueChange={(value) => setValue('split_type', value as any)}
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="fifty_fifty" id="fifty_fifty" />
                <Label htmlFor="fifty_fifty" className="flex-1 cursor-pointer">
                  50/50 Split
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  Custom Split
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="single_payer" id="single_payer" />
                <Label htmlFor="single_payer" className="flex-1 cursor-pointer">
                  I paid 100%
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Split Percentages */}
          {splitType === 'custom' && (
            <div className="space-y-3 p-4 bg-accent/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="split1">You pay (%)</Label>
                  <Input
                    id="split1"
                    type="number"
                    min="0"
                    max="100"
                    value={splitUser1 || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      setValue('split_percentage_user1', val)
                      setValue('split_percentage_user2', 100 - val)
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="split2">Partner pays (%)</Label>
                  <Input
                    id="split2"
                    type="number"
                    min="0"
                    max="100"
                    value={splitUser2 || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      setValue('split_percentage_user2', val)
                      setValue('split_percentage_user1', 100 - val)
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              {(splitUser1 || 0) + (splitUser2 || 0) !== 100 && (
                <p className="text-sm text-destructive">Percentages must add up to 100%</p>
              )}
            </div>
          )}

          {/* Receipt Upload - Placeholder for Phase 9 */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleReceiptChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <Label
                htmlFor="receipt"
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent"
              >
                <Upload className="h-4 w-4" />
                {receiptFile ? receiptFile.name : 'Upload receipt'}
              </Label>
              {receiptFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setReceiptFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Receipt upload coming in Phase 9
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
                  Adding...
                </>
              ) : (
                'Add Expense'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
