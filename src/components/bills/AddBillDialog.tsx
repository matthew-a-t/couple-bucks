import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { billFormSchema, type BillFormData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { billsService } from '@/services'
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
import { Loader2, Calendar } from 'lucide-react'

interface AddBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBillAdded?: () => void
}

export const AddBillDialog = ({ open, onOpenChange, onBillAdded }: AddBillDialogProps) => {
  const session = useAuthStore((state) => state.session)
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  const categories = session?.couple?.custom_categories || DEFAULT_CATEGORIES.map((c) => c.name)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema) as any,
    defaultValues: {
      split_type: (session?.couple?.default_split_type as BillFormData['split_type']) || 'fifty_fifty',
      split_percentage_user1: 50,
      split_percentage_user2: 50,
      reminder_days: 3,
      frequency: 'monthly'
    }
  })

  const frequency = watch('frequency')

  const onSubmit: SubmitHandler<BillFormData> = async (data) => {
    try {
      setError(null)

      if (!session?.couple?.id) {
        throw new Error('No active couple')
      }

      const amount = parseFloat(data.amount)

      await billsService.createBill({
        couple_id: session.couple.id,
        name: data.name,
        amount,
        category: data.category,
        due_date: data.due_date,
        frequency: data.frequency,
        custom_frequency_days: data.custom_frequency_days || null,
        split_type: data.split_type,
        split_percentage_user1: data.split_percentage_user1 || 50,
        split_percentage_user2: data.split_percentage_user2 || 50,
        reminder_days: data.reminder_days,
        is_active: true,
        last_paid_date: null
      })

      toast({
        title: 'Bill created!',
        description: `${data.name} added successfully`
      })

      reset()
      onBillAdded?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Add bill error:', err)
      setError(err.message || 'Failed to create bill. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Add Bill
          </DialogTitle>
          <DialogDescription>Create a recurring bill</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Bill Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Electricity"
                {...register('name')}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
                disabled={isSubmitting}
              />
              {errors.due_date && <p className="text-sm text-destructive">{errors.due_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={frequency}
                onValueChange={(value) => setValue('frequency', value as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : 'Add Bill'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
