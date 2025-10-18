import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, TrendingUp, AlertCircle, Trophy } from 'lucide-react'
import { ExpenseWithUser, BudgetWithProgress, DEFAULT_CATEGORIES } from '@/types'
import { cn } from '@/lib/utils'

interface SpendingInsightsProps {
  expenses: ExpenseWithUser[]
  budgets: BudgetWithProgress[]
}

export const SpendingInsights = ({ expenses, budgets }: SpendingInsightsProps) => {
  const insights = useMemo(() => {
    const result: Array<{
      type: 'info' | 'warning' | 'success'
      icon: typeof Lightbulb
      title: string
      description: string
    }> = []

    // Calculate top spending category
    const categoryTotals: { [key: string]: number } = {}
    expenses.forEach((expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + Number(expense.amount)
    })

    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]
    if (topCategory) {
      const categoryInfo = DEFAULT_CATEGORIES.find((c) => c.name === topCategory[0])
      result.push({
        type: 'info',
        icon: TrendingUp,
        title: `${categoryInfo?.emoji || '📦'} Top spending: ${topCategory[0]}`,
        description: `You've spent $${topCategory[1].toFixed(2)} this month`
      })
    }

    // Find biggest expense this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const recentExpenses = expenses.filter(
      (e) => new Date(e.created_at) >= oneWeekAgo
    )

    if (recentExpenses.length > 0) {
      const biggestExpense = recentExpenses.reduce((max, e) =>
        Number(e.amount) > Number(max.amount) ? e : max
      )
      result.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Biggest expense this week',
        description: `$${Number(biggestExpense.amount).toFixed(2)} on ${biggestExpense.category}`
      })
    }

    // Budget warnings
    const budgetsOverLimit = budgets.filter((b) => b.status === 'error')
    if (budgetsOverLimit.length > 0) {
      result.push({
        type: 'warning',
        icon: AlertCircle,
        title: `${budgetsOverLimit.length} budget${budgetsOverLimit.length > 1 ? 's' : ''} over limit`,
        description: `${budgetsOverLimit.map((b) => b.category).join(', ')}`
      })
    }

    const budgetsNearLimit = budgets.filter((b) => b.status === 'warning')
    if (budgetsNearLimit.length > 0 && budgetsOverLimit.length === 0) {
      result.push({
        type: 'warning',
        icon: AlertCircle,
        title: `${budgetsNearLimit.length} budget${budgetsNearLimit.length > 1 ? 's' : ''} approaching limit`,
        description: 'Keep an eye on your spending!'
      })
    }

    // Positive achievement: All budgets on track
    const allBudgetsGood = budgets.length > 0 && budgets.every((b) => b.status === 'success')
    if (allBudgetsGood) {
      result.push({
        type: 'success',
        icon: Trophy,
        title: 'Great work! All budgets on track',
        description: "You're managing money like pros!"
      })
    }

    // No expenses this week (encourage logging)
    if (recentExpenses.length === 0 && expenses.length > 0) {
      result.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Quiet week!',
        description: 'No expenses logged in the last 7 days'
      })
    }

    return result.slice(0, 3) // Show max 3 insights
  }, [expenses, budgets])

  if (insights.length === 0) {
    return null
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg bg-white/80 border',
                insight.type === 'warning' && 'border-warning/30 bg-warning/5',
                insight.type === 'success' && 'border-success/30 bg-success/5',
                insight.type === 'info' && 'border-primary/20'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                  insight.type === 'warning' && 'bg-warning/20',
                  insight.type === 'success' && 'bg-success/20',
                  insight.type === 'info' && 'bg-primary/20'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    insight.type === 'warning' && 'text-warning',
                    insight.type === 'success' && 'text-success',
                    insight.type === 'info' && 'text-primary'
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
