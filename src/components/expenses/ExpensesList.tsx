import { useState } from 'react'
import { format } from 'date-fns'
import type { ExpenseWithUser } from '@/types'
import { DEFAULT_CATEGORIES } from '@/types'
import { useAuthStore } from '@/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MoreVertical, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExpenseDetailDialog } from './ExpenseDetailDialog'

interface ExpensesListProps {
  expenses: ExpenseWithUser[]
  loading?: boolean
  error?: string | null
  onExpenseUpdated?: () => void
  onExpenseDeleted?: () => void
}

export const ExpensesList = ({
  expenses,
  loading,
  error,
  onExpenseUpdated,
  onExpenseDeleted
}: ExpensesListProps) => {
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithUser | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const getCategoryEmoji = (categoryName: string) => {
    const session = useAuthStore.getState().session

    // Check if user has selected a custom emoji for this category
    const customEmojiMap = session?.couple?.custom_category_emojis || {}
    if (customEmojiMap[categoryName]) {
      return customEmojiMap[categoryName]
    }

    // Check custom categories by index
    const customCategories = session?.couple?.custom_categories || []
    if (customCategories.length > 0) {
      const customIndex = customCategories.indexOf(categoryName)
      if (customIndex !== -1 && DEFAULT_CATEGORIES[customIndex]) {
        return DEFAULT_CATEGORIES[customIndex].emoji
      }
    }

    // Fall back to DEFAULT_CATEGORIES lookup
    const category = DEFAULT_CATEGORIES.find((cat) => cat.name === categoryName)
    return category?.emoji || '📦'
  }

  const getSplitText = (expense: ExpenseWithUser) => {
    if (expense.split_type === 'fifty_fifty') {
      return '50/50'
    } else if (expense.split_type === 'single_payer') {
      return '100%'
    } else if (expense.split_type === 'custom') {
      return `${expense.split_percentage_user1}/${expense.split_percentage_user2}`
    }
    return 'Split'
  }

  const handleExpenseClick = (expense: ExpenseWithUser) => {
    setSelectedExpense(expense)
    setDetailDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDetailDialogOpen(false)
    setSelectedExpense(null)
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (expenses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
          <Receipt className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
        <p className="text-sm text-muted-foreground">
          Ready to log your first expense? Use the quick-add buttons above.
        </p>
      </Card>
    )
  }

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = format(new Date(expense.created_at), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
    return groups
  }, {} as Record<string, ExpenseWithUser[]>)

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedExpenses).map(([date, dayExpenses]) => {
          const dateObj = new Date(date)
          const today = new Date()
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)

          let dateLabel = format(dateObj, 'MMMM d, yyyy')
          if (format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            dateLabel = 'Today'
          } else if (format(dateObj, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
            dateLabel = 'Yesterday'
          }

          const dayTotal = dayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

          return (
            <div key={date} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">{dateLabel}</h3>
                <span className="text-sm font-medium">${dayTotal.toFixed(2)}</span>
              </div>

              {/* Expenses for this day */}
              <div className="space-y-2">
                {dayExpenses.map((expense) => (
                  <Card
                    key={expense.id}
                    className={cn(
                      'p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/50'
                    )}
                    onClick={() => handleExpenseClick(expense)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Category Icon */}
                      <div className="flex-shrink-0 w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-2xl">
                        {getCategoryEmoji(expense.category)}
                      </div>

                      {/* Expense Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{expense.category}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getSplitText(expense)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="truncate">
                            {expense.description || 'No description'}
                          </span>
                          {expense.created_by_name && (
                            <>
                              <span>•</span>
                              <span className="truncate">{expense.created_by_name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          ${Number(expense.amount).toFixed(2)}
                        </span>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Receipt indicator */}
                    {expense.receipt_url && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Receipt className="h-3 w-3" />
                          <span>Receipt attached</span>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Expense Detail Dialog */}
      {selectedExpense && (
        <ExpenseDetailDialog
          expense={selectedExpense}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onExpenseUpdated={() => {
            onExpenseUpdated?.()
            handleDialogClose()
          }}
          onExpenseDeleted={() => {
            onExpenseDeleted?.()
            handleDialogClose()
          }}
        />
      )}
    </>
  )
}
