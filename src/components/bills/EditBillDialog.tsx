import { useState, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { billFormSchema, type BillFormData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { billsService } from '@/services'
import type { BillWithStatus } from '@/types'
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface EditBillDialogProps {
  bill: BillWithStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onBillUpdated?: () => void
}

export const EditBillDialog = ({
  bill,
  open,
  onOpenChange,
  onBillUpdated
}: EditBillDialogProps) => {
  const session = useAuthStore((state) => state.session)
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

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
      name: bill.name,
      amount: bill.amount.toString(),
      due_date: bill.due_date,
      frequency: bill.frequency as BillFormData['frequency'],
      custom_frequency_days: bill.custom_frequency_days || undefined,
      split_type: bill.split_type as BillFormData['split_type'],
      split_percentage_user1: bill.split_percentage_user1,
      split_percentage_user2: bill.split_percentage_user2,
      reminder_days: bill.reminder_days
    }
  })

  const frequency = watch('frequency')

  // Reset form when bill changes
  useEffect(() => {
    if (open) {
      reset({
        name: bill.name,
        amount: bill.amount.toString(),
        due_date: bill.due_date,
        frequency: bill.frequency as BillFormData['frequency'],
        custom_frequency_days: bill.custom_frequency_days || undefined,
        split_type: bill.split_type as BillFormData['split_type'],
        split_percentage_user1: bill.split_percentage_user1,
        split_percentage_user2: bill.split_percentage_user2,
        reminder_days: bill.reminder_days
      })
    }
  }, [bill, open, reset])

  const onSubmit: SubmitHandler<BillFormData> = async (data) => {
    try {
      setError(null)

      if (!session?.couple?.id) {
        throw new Error('No active couple')
      }

      const amount = parseFloat(data.amount)

      // Update the bill
      await billsService.updateBill(bill.id, {
        name: data.name,
        amount,
        due_date: data.due_date,
        frequency: data.frequency,
        custom_frequency_days: data.custom_frequency_days || null,
        split_type: data.split_type,
        split_percentage_user1: data.split_percentage_user1 || 50,
        split_percentage_user2: data.split_percentage_user2 || 50,
        reminder_days: data.reminder_days
      })

      toast({
        title: 'Bill updated!',
        description: `${data.name} updated successfully`
      })

      onOpenChange(false)
      onBillUpdated?.()
    } catch (err: any) {
      console.error('Edit bill error:', err)
      setError(err.message || 'Failed to update bill. Please try again.')
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

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-3">
              <Label htmlFor="name" className="text-base font-semibold">Bill Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Electricity"
                {...register('name')}
                disabled={isSubmitting}
                className="h-14 text-lg rounded-xl"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base font-semibold">Amount *</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
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
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="due_date" className="text-base font-semibold">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
                disabled={isSubmitting}
                className="h-14 text-base rounded-xl"
              />
              {errors.due_date && <p className="text-sm text-destructive">{errors.due_date.message}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="frequency" className="text-base font-semibold">Frequency *</Label>
              <Select
                value={frequency}
                onValueChange={(value) => setValue('frequency', value as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="frequency" className="h-14 text-base rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly" className="text-base py-3">Monthly</SelectItem>
                  <SelectItem value="weekly" className="text-base py-3">Weekly</SelectItem>
                  <SelectItem value="quarterly" className="text-base py-3">Quarterly</SelectItem>
                  <SelectItem value="annual" className="text-base py-3">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 h-14 text-base font-semibold rounded-2xl" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-14 text-base font-semibold rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Updating...</> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
