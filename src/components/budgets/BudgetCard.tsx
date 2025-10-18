import { useState } from 'react'
import type { BudgetWithProgress } from '@/types'
import { DEFAULT_CATEGORIES } from '@/types'
import { budgetsService } from '@/services'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { MoreVertical, Trash2, RotateCcw, TrendingUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BudgetCardProps {
  budget: BudgetWithProgress
  onBudgetUpdated?: () => void
  onBudgetDeleted?: () => void
}

export const BudgetCard = ({ budget, onBudgetUpdated, onBudgetDeleted }: BudgetCardProps) => {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const getCategoryEmoji = (categoryName: string) => {
    const category = DEFAULT_CATEGORIES.find((cat) => cat.name === categoryName)
    return category?.emoji || '📦'
  }

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'bg-success'
      case 'warning':
        return 'bg-warning'
      case 'error':
        return 'bg-error'
      default:
        return 'bg-primary'
    }
  }

  const getStatusTextColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'text-success'
      case 'warning':
        return 'text-warning'
      case 'error':
        return 'text-error'
      default:
        return 'text-primary'
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await budgetsService.deleteBudget(budget.id)

      toast({
        title: 'Budget deleted',
        description: `${budget.category} budget has been removed`
      })

      setDeleteDialogOpen(false)
      onBudgetDeleted?.()
    } catch (err: any) {
      console.error('Delete budget error:', err)
      toast({
        title: 'Failed to delete',
        description: err.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReset = async () => {
    try {
      setIsResetting(true)
      await budgetsService.resetBudget(budget.id)

      toast({
        title: 'Budget reset',
        description: `${budget.category} spending reset to $0`
      })

      setResetDialogOpen(false)
      onBudgetUpdated?.()
    } catch (err: any) {
      console.error('Reset budget error:', err)
      toast({
        title: 'Failed to reset',
        description: err.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <Card className={cn('transition-all hover:shadow-md', budget.status === 'error' && 'border-error/50')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getCategoryEmoji(budget.category)}</span>
              <div>
                <h3 className="font-semibold">{budget.category}</h3>
                <p className="text-sm text-muted-foreground">
                  ${budget.current_spent.toFixed(2)} of ${budget.limit_amount.toFixed(2)}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setResetDialogOpen(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Spending
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Budget
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress
              value={Math.min(budget.percentage, 100)}
              className="h-3"
              indicatorClassName={getStatusColor(budget.status)}
            />

            <div className="flex items-center justify-between text-sm">
              <span className={cn('font-medium', getStatusTextColor(budget.status))}>
                {budget.percentage.toFixed(0)}% used
              </span>
              <span className="text-muted-foreground">
                ${budget.remaining.toFixed(2)} left
              </span>
            </div>
          </div>

          {/* Status Messages */}
          {budget.status === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-error mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-error">Over budget!</p>
                <p className="text-error/80">
                  You've exceeded this limit by ${Math.abs(budget.remaining).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {budget.status === 'warning' && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-warning">Approaching limit</p>
                <p className="text-warning/80">
                  Be mindful of spending in this category
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the budget for {budget.category}. Your expenses will
              not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset budget spending?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the current spending for {budget.category} to $0. The budget limit
              will remain at ${budget.limit_amount.toFixed(2)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={isResetting}>
              {isResetting ? 'Resetting...' : 'Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
