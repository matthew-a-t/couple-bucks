import { useState } from 'react'
import { format } from 'date-fns'
import type { ExpenseWithUser } from '@/types'
import { useAuthStore } from '@/store'
import { expensesService, budgetsService } from '@/services'
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
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Receipt, User, DollarSign, Calendar, Split } from 'lucide-react'
import { EditExpenseDialog } from './EditExpenseDialog'

interface ExpenseDetailDialogProps {
  expense: ExpenseWithUser
  open: boolean
  onOpenChange: (open: boolean) => void
  onExpenseUpdated?: () => void
  onExpenseDeleted?: () => void
}

export const ExpenseDetailDialog = ({
  expense,
  open,
  onOpenChange,
  onExpenseDeleted
}: ExpenseDetailDialogProps) => {
  const session = useAuthStore((state) => state.session)
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canEdit =
    session?.profile.permission_tier === 'manager' ||
    expense.created_by === session?.user.id

  const canDelete =
    session?.profile.permission_tier === 'manager' ||
    expense.created_by === session?.user.id

  const getSplitText = () => {
    if (expense.split_type === 'fifty_fifty') {
      return '50/50 Split'
    } else if (expense.split_type === 'single_payer') {
      return '100% by one partner'
    } else if (expense.split_type === 'custom') {
      return `${expense.split_percentage_user1}% / ${expense.split_percentage_user2}%`
    } else if (expense.split_type === 'proportional') {
      return 'Proportional to income'
    }
    return 'Split'
  }

  const handleExpenseUpdated = () => {
    setEditDialogOpen(false)
    onOpenChange(false)
    onExpenseDeleted?.() // Reuse the same callback to refresh the list
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      if (!session?.couple?.id) {
        throw new Error('No active session')
      }

      // Decrement budget spending
      await budgetsService.decrementBudgetSpending(
        session.couple.id,
        expense.category,
        Number(expense.amount)
      )

      // Delete expense
      await expensesService.deleteExpense(expense.id)

      toast({
        title: 'Expense deleted',
        description: 'The expense has been removed'
      })

      setDeleteDialogOpen(false)
      onExpenseDeleted?.()
    } catch (err: any) {
      console.error('Delete expense error:', err)
      toast({
        title: 'Failed to delete',
        description: err.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="space-y-6">
            {/* Amount */}
            <div className="flex items-center justify-between p-5 bg-primary/10 rounded-xl">
              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="h-5 w-5" />
                <span className="font-medium">Amount</span>
              </div>
              <span className="text-3xl font-bold text-primary">
                ${Number(expense.amount).toFixed(2)}
              </span>
            </div>

            {/* Description */}
            {expense.description && (
              <div className="p-4 bg-accent/5 rounded-xl space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Description</h4>
                <p className="text-sm">{expense.description}</p>
              </div>
            )}

            {/* Split Info */}
            <div className="p-4 bg-accent/5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Split className="h-4 w-4" />
                <span>Split</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">{getSplitText()}</Badge>
              </div>
            </div>

            {/* Created By */}
            <div className="p-4 bg-accent/5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Logged by</span>
              </div>
              <p className="text-sm">{expense.created_by_name || 'Unknown'}</p>
            </div>

            {/* Date */}
            <div className="p-4 bg-accent/5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Date</span>
              </div>
              <p className="text-sm">
                {format(new Date(expense.created_at), 'MMMM d, yyyy • h:mm a')}
              </p>
            </div>

            {/* Receipt */}
            {expense.receipt_url && (
              <div className="p-4 bg-accent/5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  <span>Receipt</span>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                    View Receipt
                  </a>
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {canEdit && (
                <Button
                  variant="outline"
                  className="flex-1 h-14 text-base font-semibold rounded-2xl"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="mr-2 h-5 w-5" />
                  Edit
                </Button>
              )}

              {canDelete && (
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

            {!canEdit && !canDelete && (
              <p className="text-sm text-center text-muted-foreground">
                Only the person who logged this expense or a Manager can edit or delete it.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this ${Number(expense.amount).toFixed(2)} expense
              from {expense.category}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="h-14 text-base font-semibold rounded-2xl">Cancel</AlertDialogCancel>
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

      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        expense={expense}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onExpenseUpdated={handleExpenseUpdated}
      />
    </>
  )
}
