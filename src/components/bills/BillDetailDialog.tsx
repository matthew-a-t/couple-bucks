import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { BillWithStatus, BillPaymentHistoryWithDetails } from '@/types'
import { useAuthStore } from '@/store'
import { billsService } from '@/services'
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Receipt, DollarSign, Calendar, Repeat, Check, User, FileText, Loader2 } from 'lucide-react'
import { EditBillDialog } from './EditBillDialog'

interface BillDetailDialogProps {
  bill: BillWithStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onBillUpdated?: () => void
  onBillDeleted?: () => void
}

export const BillDetailDialog = ({
  bill,
  open,
  onOpenChange,
  onBillUpdated,
  onBillDeleted
}: BillDetailDialogProps) => {
  const session = useAuthStore((state) => state.session)
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [markAsPaidDialogOpen, setMarkAsPaidDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<BillPaymentHistoryWithDetails[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  const isManager = session?.profile.permission_tier === 'manager'

  // Load payment history when dialog opens
  useEffect(() => {
    if (open && bill.id) {
      loadPaymentHistory()
    }
  }, [open, bill.id])

  const loadPaymentHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const history = await billsService.getBillPaymentHistory(bill.id)
      setPaymentHistory(history)
    } catch (err) {
      console.error('Failed to load payment history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Weekly'
      case 'monthly':
        return 'Monthly'
      case 'quarterly':
        return 'Quarterly'
      case 'annual':
        return 'Annual'
      case 'custom':
        return 'Custom'
      default:
        return frequency
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive" className="rounded-full">Overdue</Badge>
      case 'due_soon':
        return <Badge className="rounded-full bg-warning text-warning-foreground">Due Soon</Badge>
      case 'upcoming':
        return <Badge variant="outline" className="rounded-full">Upcoming</Badge>
      default:
        return null
    }
  }

  const handleBillUpdated = () => {
    setEditDialogOpen(false)
    onBillUpdated?.()
    loadPaymentHistory() // Reload history in case details changed
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      await billsService.deleteBill(bill.id)

      toast({
        title: 'Bill deleted',
        description: 'The bill has been removed'
      })

      setDeleteDialogOpen(false)
      onOpenChange(false)
      onBillDeleted?.()
    } catch (err: any) {
      console.error('Delete bill error:', err)
      toast({
        title: 'Failed to delete',
        description: err.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMarkAsPaid = async () => {
    try {
      setIsMarkingPaid(true)

      if (!session?.user.id) {
        throw new Error('No active session')
      }

      await billsService.markBillAsPaid(
        bill.id,
        session.user.id,
        undefined, // Use current date
        paymentMethod || undefined,
        paymentNotes || undefined
      )

      toast({
        title: 'Bill marked as paid!',
        description: `${bill.name} payment recorded`
      })

      setMarkAsPaidDialogOpen(false)
      setPaymentMethod('')
      setPaymentNotes('')
      onBillUpdated?.()
      loadPaymentHistory()
    } catch (err: any) {
      console.error('Mark as paid error:', err)
      toast({
        title: 'Failed to mark as paid',
        description: err.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsMarkingPaid(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Bill Name & Status */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{bill.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{bill.category}</p>
              </div>
              {getStatusBadge(bill.status)}
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between p-5 bg-primary/10 rounded-xl">
              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="h-5 w-5" />
                <span className="font-medium">Amount</span>
              </div>
              <span className="text-3xl font-bold text-primary">
                ${Number(bill.amount).toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="p-4 bg-accent/5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due Date</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(bill.due_date), 'MMM d, yyyy')}
                </p>
                {bill.days_until_due >= 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {bill.days_until_due === 0 ? 'Due today' : `${bill.days_until_due} days away`}
                  </p>
                ) : (
                  <p className="text-xs text-destructive">
                    {Math.abs(bill.days_until_due)} days overdue
                  </p>
                )}
              </div>

              {/* Frequency */}
              <div className="p-4 bg-accent/5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Repeat className="h-4 w-4" />
                  <span>Frequency</span>
                </div>
                <p className="text-sm font-medium">{getFrequencyText(bill.frequency)}</p>
              </div>
            </div>

            {/* Last Paid */}
            {bill.last_paid_date && (
              <div className="p-4 bg-success/10 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                  <Check className="h-4 w-4" />
                  <span>Last Paid</span>
                </div>
                <p className="text-sm">{format(new Date(bill.last_paid_date), 'MMMM d, yyyy')}</p>
              </div>
            )}

            {/* Receipt */}
            {bill.receipt_url && (
              <div className="p-4 bg-accent/5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  <span>Bill Document</span>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <a href={bill.receipt_url} target="_blank" rel="noopener noreferrer">
                    View Document
                  </a>
                </Button>
              </div>
            )}

            {/* Payment History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Payment History</h3>
                {isLoadingHistory && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {paymentHistory.length === 0 && !isLoadingHistory ? (
                <div className="p-8 text-center text-muted-foreground bg-accent/5 rounded-xl">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No payments recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="p-4 border rounded-xl hover:bg-accent/5 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">${Number(payment.amount_paid).toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {payment.payment_method && (
                        <p className="text-xs text-muted-foreground">via {payment.payment_method}</p>
                      )}
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                      )}
                      {payment.recorded_by_name && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Recorded by {payment.recorded_by_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              {/* Mark as Paid Button (All users) */}
              <Button
                className="h-14 text-base font-semibold rounded-2xl"
                onClick={() => setMarkAsPaidDialogOpen(true)}
              >
                <Check className="mr-2 h-5 w-5" />
                Mark as Paid
              </Button>

              <div className="flex gap-3">
                {/* Edit Button (Manager only) */}
                {isManager && (
                  <Button
                    variant="outline"
                    className="flex-1 h-14 text-base font-semibold rounded-2xl"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Pencil className="mr-2 h-5 w-5" />
                    Edit
                  </Button>
                )}

                {/* Delete Button (Manager only) */}
                {isManager && (
                  <Button
                    variant="destructive"
                    className="flex-1 h-14 text-base font-semibold rounded-2xl"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    Delete
                  </Button>
                )}
              </div>

              {!isManager && (
                <p className="text-sm text-center text-muted-foreground">
                  Only Managers can edit or delete bills.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <AlertDialog open={markAsPaidDialogOpen} onOpenChange={setMarkAsPaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark bill as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              Record a payment for {bill.name} (${Number(bill.amount).toFixed(2)})
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method (optional)</Label>
              <Input
                id="payment_method"
                placeholder="e.g., Credit Card, Bank Transfer"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_notes">Notes (optional)</Label>
              <Textarea
                id="payment_notes"
                placeholder="Add any notes about this payment..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarkingPaid} className="h-14 text-base font-semibold rounded-2xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsPaid}
              disabled={isMarkingPaid}
              className="h-14 text-base font-semibold rounded-2xl"
            >
              {isMarkingPaid ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Mark as Paid
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {bill.name} (${Number(bill.amount).toFixed(2)}).
              All payment history for this bill will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="h-14 text-base font-semibold rounded-2xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-14 text-base font-semibold rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Bill Dialog */}
      <EditBillDialog
        bill={bill}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onBillUpdated={handleBillUpdated}
      />
    </>
  )
}
