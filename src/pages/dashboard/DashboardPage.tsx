import { useEffect, useState } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
import { Link } from 'react-router-dom'
import { QuickAddButtons } from '@/components/expenses/QuickAddButtons'
import { BottomNav } from '@/components/shared/BottomNav'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { SpendingInsights } from '@/components/dashboard/SpendingInsights'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Receipt,
  PiggyBank,
  Calendar,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Target,
  Users,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { DEFAULT_CATEGORIES } from '@/types'

// Helper function to get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export const DashboardPage = () => {
  const { session, logout } = useAuthStore()
  const {
    expenses,
    budgets,
    bills,
    loadExpenses,
    loadBudgets,
    loadBills,
    subscribeToExpenses,
    subscribeToBudgets,
    subscribeToBills,
    unsubscribeFromExpenses,
    unsubscribeFromBudgets,
    unsubscribeFromBills
  } = useCoupleStore()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'mine' | 'partner'>('all')

  const isManager = session?.profile.permission_tier === 'manager'
  const firstName = session?.profile.full_name?.split(' ')[0] || 'there'
  const partnerName = session?.partner?.full_name?.split(' ')[0] || 'your partner'

  useEffect(() => {
    if (session?.couple?.id) {
      loadExpenses(session.couple.id, 5) // Load last 5 expenses
      loadBills(session.couple.id)
      subscribeToExpenses(session.couple.id)
      subscribeToBills(session.couple.id)

      if (isManager) {
        loadBudgets(session.couple.id)
        subscribeToBudgets(session.couple.id)
      }

      return () => {
        unsubscribeFromExpenses()
        unsubscribeFromBudgets()
        unsubscribeFromBills()
      }
    }
  }, [session?.couple?.id, isManager])

  const handleRefresh = async () => {
    if (!session?.couple?.id) return

    setIsRefreshing(true)
    try {
      await Promise.all([
        loadExpenses(session.couple.id, 5),
        loadBills(session.couple.id),
        isManager ? loadBudgets(session.couple.id) : Promise.resolve()
      ])
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExpenseAdded = () => {
    if (session?.couple?.id) {
      loadExpenses(session.couple.id, 5)
      if (isManager) loadBudgets(session.couple.id)
    }
  }

  // Calculate stats
  const monthlyTotal = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const upcomingBills = bills.filter((b) => b.status === 'due_soon' || b.status === 'overdue').slice(0, 3)
  const topBudgets = budgets.slice(0, 3)

  // Calculate budget health (percentage of budgets on track)
  const budgetHealth =
    budgets.length > 0
      ? Math.round((budgets.filter((b) => b.status === 'success').length / budgets.length) * 100)
      : 0

  // Filter expenses based on selected filter
  const filteredExpenses =
    expenseFilter === 'all'
      ? expenses
      : expenseFilter === 'mine'
      ? expenses.filter((e) => e.created_by === session?.user.id)
      : expenses.filter((e) => e.created_by !== session?.user.id)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Enhanced Header with Gradient */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">
                  <span>Couple</span>
                  <span className="mx-1.5 opacity-70">|</span>
                  <span>Bucks</span>
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-white hover:bg-white/20"
              aria-label="Refresh data"
            >
              <RefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">
                {getGreeting()}, {firstName}!
              </p>
              {session?.partner && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Users className="h-3.5 w-3.5 text-white/70" />
                  <p className="text-white/70 text-xs">
                    Managing money with {partnerName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Add Section - More Prominent */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Ready to log an expense?
              </h2>
              <p className="text-sm text-muted-foreground">
                Tap a category to get started
              </p>
            </div>
          </div>
          <QuickAddButtons onExpenseAdded={handleExpenseAdded} />
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="This Month"
            value={`$${monthlyTotal.toFixed(2)}`}
            subtitle={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
            icon={DollarSign}
          />

          {isManager && budgets.length > 0 && (
            <StatsCard
              title="Budget Health"
              value={`${budgetHealth}%`}
              subtitle={`${budgets.filter((b) => b.status === 'success').length} of ${budgets.length} on track`}
              icon={Target}
              className={
                budgetHealth >= 75
                  ? 'border-success/30 bg-success/5'
                  : budgetHealth >= 50
                  ? 'border-warning/30 bg-warning/5'
                  : 'border-error/30 bg-error/5'
              }
            />
          )}

          <StatsCard
            title="Upcoming Bills"
            value={upcomingBills.length}
            subtitle={
              upcomingBills.length > 0
                ? `$${upcomingBills.reduce((sum, b) => sum + Number(b.amount), 0).toFixed(2)} total`
                : 'All clear!'
            }
            icon={Calendar}
            className={
              upcomingBills.some((b) => b.status === 'overdue')
                ? 'border-error/30 bg-error/5'
                : ''
            }
          />
        </div>

        {/* Smart Insights Widget */}
        {expenses.length > 0 && (
          <SpendingInsights expenses={expenses} budgets={budgets} />
        )}

        {/* Enhanced Budget Overview */}
        {isManager && topBudgets.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <PiggyBank className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Budget Overview</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {budgets.filter((b) => b.status === 'success').length} of {budgets.length} on track
                    </p>
                  </div>
                </div>
                <Link to="/budgets">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <Badge variant="secondary" className="ml-1">
                      {budgets.length}
                    </Badge>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {topBudgets.map((budget) => {
                const categoryInfo = DEFAULT_CATEGORIES.find((c) => c.name === budget.category)
                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryInfo?.emoji || '📦'}</span>
                        <span className="font-semibold text-sm">{budget.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          ${budget.current_spent.toFixed(2)}
                          <span className="text-muted-foreground font-normal">
                            {' '}/ ${budget.limit_amount.toFixed(2)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${budget.remaining.toFixed(2)} left
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress
                        value={Math.min(budget.percentage, 100)}
                        className="h-2.5"
                        indicatorClassName={cn(
                          'transition-all',
                          budget.status === 'success' && 'bg-success',
                          budget.status === 'warning' && 'bg-warning',
                          budget.status === 'error' && 'bg-error'
                        )}
                      />
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            budget.status === 'success'
                              ? 'default'
                              : budget.status === 'warning'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="text-xs"
                        >
                          {budget.percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Bills Section */}
        {upcomingBills.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Upcoming Bills</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      ${upcomingBills.reduce((sum, b) => sum + Number(b.amount), 0).toFixed(2)} total due
                    </p>
                  </div>
                </div>
                <Link to="/bills">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <Badge variant="secondary" className="ml-1">
                      {bills.length}
                    </Badge>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingBills.map((bill) => {
                const categoryInfo = DEFAULT_CATEGORIES.find((c) => c.name === bill.category)
                const isOverdue = bill.status === 'overdue'
                return (
                  <div
                    key={bill.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border-2 transition-colors',
                      isOverdue
                        ? 'border-error/40 bg-error/5'
                        : 'border-border hover:border-primary/30 hover:bg-primary/5'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                          isOverdue ? 'bg-error/20' : 'bg-primary/10'
                        )}
                      >
                        <span className="text-xl">{categoryInfo?.emoji || '📋'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{bill.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            Due {format(new Date(bill.due_date), 'MMM d, yyyy')}
                          </p>
                          <Badge
                            variant={isOverdue ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {isOverdue ? 'Overdue' : `${bill.days_until_due}d`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-sm">${Number(bill.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{bill.frequency}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Recent Expenses with Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Recent Expenses</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Last {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Link to="/expenses">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Filter Buttons */}
            {expenses.length > 0 && session?.partner && (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant={expenseFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExpenseFilter('all')}
                  className="h-8"
                >
                  All
                </Button>
                <Button
                  variant={expenseFilter === 'mine' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExpenseFilter('mine')}
                  className="h-8"
                >
                  Mine
                </Button>
                <Button
                  variant={expenseFilter === 'partner' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExpenseFilter('partner')}
                  className="h-8"
                >
                  {partnerName}'s
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {expenses.length === 0 ? 'No expenses yet' : 'No expenses in this filter'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {expenses.length === 0 ? 'Ready to log your first one?' : 'Try a different filter'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.slice(0, 5).map((expense) => {
                  const categoryInfo = DEFAULT_CATEGORIES.find((c) => c.name === expense.category)
                  const isMyExpense = expense.created_by === session?.user.id
                  const hasReceipt = expense.receipt_url

                  return (
                    <Link
                      key={expense.id}
                      to={`/expenses`}
                      className="flex items-center gap-3 p-3 border-2 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{categoryInfo?.emoji || '📦'}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{expense.category}</p>
                          {hasReceipt && (
                            <Badge variant="outline" className="text-xs">
                              Receipt
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {expense.description || 'No description'}
                          </p>
                          {session?.partner && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {isMyExpense ? 'You' : expense.created_by_name?.split(' ')[0] || 'Partner'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right ml-3">
                        <p className="font-bold text-sm">${Number(expense.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(expense.created_at), 'MMM d')}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
