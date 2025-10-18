import { useEffect } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
import { Link } from 'react-router-dom'
import { QuickAddButtons } from '@/components/expenses/QuickAddButtons'
import { BottomNav } from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { LogOut, Receipt, PiggyBank, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

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

  const isManager = session?.profile.permission_tier === 'manager'

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

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleExpenseAdded = () => {
    if (session?.couple?.id) {
      loadExpenses(session.couple.id, 5)
      if (isManager) loadBudgets(session.couple.id)
    }
  }

  const monthlyTotal = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const upcomingBills = bills.filter((b) => b.status === 'due_soon' || b.status === 'overdue').slice(0, 3)
  const topBudgets = budgets.slice(0, 3)

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              <span className="text-primary">Couple</span>
              <span className="text-accent mx-1">|</span>
              <span className="text-secondary">Bucks</span>
            </h1>
            <p className="text-xs text-muted-foreground">Welcome back, {session?.profile.full_name?.split(' ')[0]}</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Add Expense
            </CardTitle>
            <CardDescription>Tap to log an expense</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickAddButtons onExpenseAdded={handleExpenseAdded} />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlyTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{expenses.length} expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgets.length}</div>
              <p className="text-xs text-muted-foreground">
                {budgets.filter((b) => b.status === 'error').length} over limit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBills.length}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {isManager && topBudgets.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-primary" />
                  Budget Overview
                </CardTitle>
                <Link to="/budgets">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {topBudgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{budget.category}</span>
                    <span className="text-muted-foreground">
                      ${budget.current_spent.toFixed(2)} / ${budget.limit_amount.toFixed(2)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(budget.percentage, 100)}
                    className="h-2"
                    indicatorClassName={
                      budget.status === 'success'
                        ? 'bg-success'
                        : budget.status === 'warning'
                        ? 'bg-warning'
                        : 'bg-error'
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {upcomingBills.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Bills
                </CardTitle>
                <Link to="/bills">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(bill.due_date), 'MMM d')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${Number(bill.amount).toFixed(2)}</p>
                    <Badge variant={bill.status === 'overdue' ? 'destructive' : 'default'} className="text-xs">
                      {bill.status === 'overdue' ? 'Overdue' : 'Due Soon'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Recent Expenses
              </CardTitle>
              <Link to="/expenses">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No expenses yet</p>
            ) : (
              <div className="space-y-2">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.description || 'No description'}
                      </p>
                    </div>
                    <span className="font-bold">${Number(expense.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
