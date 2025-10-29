import { useState, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseFormSchema, type ExpenseFormData } from '@/types/schemas'
import { useAuthStore, useCoupleStore } from '@/store'
import { expensesService, budgetsService } from '@/services'
import { incomeService } from '@/services/income'
import { DEFAULT_CATEGORIES } from '@/types'
import {
  Dialog,
  DialogContent
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
  const { budgets } = useCoupleStore()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [proportionalSplit, setProportionalSplit] = useState<{ user1: number; user2: number } | null>(null)

  // Use budget categories by default, fallback to custom categories, then DEFAULT_CATEGORIES
  const budgetCategories = budgets.map((b) => b.category)
  const categories = budgetCategories.length > 0
    ? budgetCategories
    : (session?.couple?.custom_categories || DEFAULT_CATEGORIES.map((c) => c.name))

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

  // Update category when dialog opens with defaultCategory
  useEffect(() => {
    if (open && defaultCategory) {
      setValue('category', defaultCategory)
    }
  }, [open, defaultCategory, setValue])

  // Fetch proportional split when dialog opens if income tracking is enabled
  useEffect(() => {
    const fetchProportionalSplit = async () => {
      if (open && session?.couple?.track_income && session?.profile?.couple_id) {
        try {
          const split = await incomeService.calculateProportionalSplit(session.profile.couple_id)

          // Determine which percentage belongs to current user
          const coupleData = await incomeService.getCoupleIncomes(session.profile.couple_id)
          const isUser1 = coupleData.couple.user1_id === session.user?.id

          setProportionalSplit({
            user1: isUser1 ? split.user1Percentage : split.user2Percentage,
            user2: isUser1 ? split.user2Percentage : split.user1Percentage
          })
        } catch (error) {
          console.error('Failed to fetch proportional split:', error)
          // Default to 50/50 if fetch fails
          setProportionalSplit({ user1: 50, user2: 50 })
        }
      }
    }

    fetchProportionalSplit()
  }, [open, session?.couple?.track_income, session?.profile?.couple_id, session?.user?.id])

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

      // Close dialog
      onOpenChange(false)

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Amount */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-base font-semibold">Amount *</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8 h-14 text-lg rounded-xl"
                {...register('amount')}
                disabled={isSubmitting}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label htmlFor="category" className="text-base font-semibold">Category *</Label>
            <Select
              value={watch('category')}
              onValueChange={(value) => setValue('category', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="category" className="h-14 text-lg rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-base py-3">
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
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-semibold">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add description..."
              rows={3}
              className="text-base rounded-xl resize-none"
              {...register('description')}
              disabled={isSubmitting}
            />
          </div>

          {/* Split Type */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">How to split this expense?</Label>
            <RadioGroup
              value={splitType}
              onValueChange={(value) => setValue('split_type', value as any)}
              disabled={isSubmitting}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-5 border-2 rounded-2xl hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer min-h-[56px]">
                <RadioGroupItem value="fifty_fifty" id="fifty_fifty" className="w-5 h-5" />
                <Label htmlFor="fifty_fifty" className="flex-1 cursor-pointer text-base font-medium">
                  50/50 Split
                </Label>
              </div>

              {/* Proportional Split - Show if income tracking is enabled */}
              {session?.couple?.track_income && proportionalSplit && (
                <div className="flex items-center space-x-3 p-5 border-2 rounded-2xl hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer min-h-[56px]">
                  <RadioGroupItem value="proportional" id="proportional" className="w-5 h-5" />
                  <Label htmlFor="proportional" className="flex-1 cursor-pointer">
                    <div className="text-base font-medium">Proportional to Income</div>
                    <div className="text-sm text-muted-foreground">
                      You: {proportionalSplit.user1}% • Partner: {proportionalSplit.user2}%
                    </div>
                  </Label>
                </div>
              )}

              <div className="flex items-center space-x-3 p-5 border-2 rounded-2xl hover:bg-accent/50 hover:border-primary/50 transition-all min-h-[56px]">
                <RadioGroupItem value="custom" id="custom" className="w-5 h-5" />
                <Label htmlFor="custom" className="cursor-pointer text-base font-medium">
                  Custom Split
                </Label>
                {splitType === 'custom' && (
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center gap-1">
                      <Input
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
                        className="w-16 h-10 text-center text-sm rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm font-medium">%</span>
                    </div>
                    <span className="text-muted-foreground">/</span>
                    <div className="flex items-center gap-1">
                      <Input
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
                        className="w-16 h-10 text-center text-sm rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm font-medium">%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 p-5 border-2 rounded-2xl hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer min-h-[56px]">
                <RadioGroupItem value="single_payer" id="single_payer" className="w-5 h-5" />
                <Label htmlFor="single_payer" className="flex-1 cursor-pointer text-base font-medium">
                  I paid 100%
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Receipt Upload - Placeholder for Phase 9 */}
          <div className="space-y-3">
            <Label htmlFor="receipt" className="text-base font-semibold">Receipt (optional)</Label>
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
                className="flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-2xl cursor-pointer hover:bg-accent hover:border-primary/50 transition-all text-base font-medium min-h-[56px] flex-1"
              >
                <Upload className="h-5 w-5" />
                {receiptFile ? receiptFile.name : 'Upload receipt'}
              </Label>
              {receiptFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setReceiptFile(null)}
                  className="h-14 w-14 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-14 text-base font-semibold rounded-2xl"
              onClick={() => onOpenChange(false)}
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
                'Add Expense'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
