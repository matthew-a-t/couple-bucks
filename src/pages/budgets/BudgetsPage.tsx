import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, useCoupleStore } from '@/store'
import { AddBudgetDialog } from '@/components/budgets/AddBudgetDialog'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { IncomeOverviewCard } from '@/components/budgets/IncomeOverviewCard'
import { MonthNavigator } from '@/components/budgets/MonthNavigator'
import { ExpensesList } from '@/components/expenses/ExpensesList'
import { ExpenseDetailDialog } from '@/components/expenses/ExpenseDetailDialog'
import { BottomNav } from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, PiggyBank, TrendingUp, Search, Calendar } from 'lucide-react'
import { DEFAULT_CATEGORIES, MAX_CATEGORIES } from '@/types'
import type { BudgetWithProgress } from '@/types'
import type { Expense } from '@/types/database'

export const BudgetsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const {
    budgets,
    budgetsLoading,
    loadBudgets,
    subscribeToBudgets,
    unsubscribeFromBudgets,
    expenses,
    expensesLoading,
    loadExpenses,
    subscribeToExpenses,
    unsubscribeFromExpenses
  } = useCoupleStore()

  // Month navigation state
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [monthBudgets, setMonthBudgets] = useState<BudgetWithProgress[]>([])
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([])
  const [monthDataLoading, setMonthDataLoading] = useState(false)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [expenseDetailOpen, setExpenseDetailOpen] = useState(false)

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear()

  // Load current budgets and expenses (for real-time updates)
  useEffect(() => {
    if (session?.couple?.id) {
      // Check and reset monthly budgets if needed (happens automatically client-side)
      const checkAndResetBudgets = async () => {
        try {
          const { budgetsService } = await import('@/services/budgets')
          const wasReset = await budgetsService.checkAndResetMonthlyBudgets(session.couple!.id)
          if (wasReset) {
            console.log('Monthly budgets were automatically reset')
          }
        } catch (error) {
          console.error('Failed to check/reset monthly budgets:', error)
        }
      }

      checkAndResetBudgets()
      loadBudgets(session.couple.id)
      subscribeToBudgets(session.couple.id)
      loadExpenses(session.couple.id)
      subscribeToExpenses(session.couple.id)

      return () => {
        unsubscribeFromBudgets()
        unsubscribeFromExpenses()
      }
    }
  }, [session?.couple?.id])

  // Load month-specific data when month changes
  useEffect(() => {
    if (session?.couple?.id) {
      const loadMonthData = async () => {
        setMonthDataLoading(true)
        try {
          const { budgetsService } = await import('@/services/budgets')

          // Fetch budgets for selected month
          const budgetsData = await budgetsService.getBudgetsForMonth(
            session.couple!.id,
            selectedMonth,
            selectedYear
          )
          setMonthBudgets(budgetsData)

          // Fetch expenses for selected month
          const expensesData = await budgetsService.getExpensesForMonth(
            session.couple!.id,
            selectedMonth,
            selectedYear
          )
          setMonthExpenses(expensesData)
        } catch (error) {
          console.error('Failed to load month data:', error)
        } finally {
          setMonthDataLoading(false)
        }
      }

      loadMonthData()
    }
  }, [session?.couple?.id, selectedMonth, selectedYear])

  // Update month data when current month budgets/expenses change (real-time updates)
  useEffect(() => {
    if (isCurrentMonth) {
      setMonthBudgets(budgets)
      setMonthExpenses(expenses)
    }
  }, [budgets, expenses, isCurrentMonth])

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  // Check for selected expense from navigation state
  useEffect(() => {
    const state = location.state as { selectedExpenseId?: string }
    if (state?.selectedExpenseId && monthExpenses.length > 0) {
      const expense = monthExpenses.find((e) => e.id === state.selectedExpenseId)
      if (expense) {
        setSelectedExpense(expense)
        setExpenseDetailOpen(true)
        // Clear the state so it doesn't reopen on navigation
        navigate(location.pathname, { replace: true })
      }
    }
  }, [location.state, monthExpenses, navigate, location.pathname])

  const handleBudgetAdded = async () => {
    if (session?.couple?.id) {
      // Refresh session to get updated custom_categories
      await useAuthStore.getState().refreshSession()
      loadBudgets(session.couple.id)
      loadExpenses(session.couple.id)
    }
    setAddDialogOpen(false)
  }

  const handleBudgetUpdated = async () => {
    if (session?.couple?.id) {
      // Refresh session to get updated custom_categories
      await useAuthStore.getState().refreshSession()
      loadBudgets(session.couple.id)
      loadExpenses(session.couple.id)
    }
  }

  const handleExpenseUpdated = () => {
    if (session?.couple?.id) {
      loadExpenses(session.couple.id)
      loadBudgets(session.couple.id)
    }
  }

  // Calculate totals for selected month
  const totalBudgeted = monthBudgets.reduce((sum, b) => sum + b.limit_amount, 0)
  const totalSpent = monthBudgets.reduce((sum, b) => sum + b.current_spent, 0)

  // Create placeholder budgets for default categories that don't have budgets yet (only for current month)
  const defaultCategoryBudgets = isCurrentMonth
    ? DEFAULT_CATEGORIES.map((cat) => {
        const existingBudget = monthBudgets.find((b) => b.category === cat.name)
        if (existingBudget) return null

        // Get start of selected month
        const startOfMonth = new Date(selectedYear, selectedMonth, 1)

        // Calculate spending for this category in selected month
        const categoryExpenses = monthExpenses.filter((e) => {
          return e.category === cat.name
        })
        const currentSpent = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

        return {
          id: `placeholder-${cat.name}`,
          couple_id: session?.couple?.id || '',
          category: cat.name,
          limit_amount: 0,
          current_spent: currentSpent,
          remaining: -currentSpent,
          percentage: 0,
          status: 'success' as const,
          period_type: 'monthly' as const,
          period_start_date: startOfMonth.toISOString().split('T')[0],
          auto_reset_enabled: true,
          last_reset_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isPlaceholder: true
        }
      }).filter((budget): budget is NonNullable<typeof budget> => budget !== null)
    : []

  // Combine real budgets with placeholder budgets
  const allBudgets = [...monthBudgets, ...defaultCategoryBudgets]

  // Filter expenses for selected month
  const filteredExpenses = monthExpenses.filter((expense) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        expense.category.toLowerCase().includes(query) ||
        expense.description?.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // Category filter
    if (filterCategory !== 'all' && expense.category !== filterCategory) {
      return false
    }

    // Period filter - only applies for current month view
    if (filterPeriod !== 'all' && isCurrentMonth) {
      const expenseDate = new Date(expense.created_at)
      const now = new Date()

      if (filterPeriod === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        if (expenseDate < today) return false
      } else if (filterPeriod === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        if (expenseDate < weekAgo) return false
      } else if (filterPeriod === 'month') {
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        if (expenseDate < monthAgo) return false
      }
    }

    return true
  })

  const categories = session?.couple?.custom_categories || DEFAULT_CATEGORIES.map((c) => c.name)

  return (
    <div className="min-h-screen pb-32">
      <main className="px-4 pt-6 space-y-6 max-w-[90rem] mx-auto">
        {/* Month Navigator */}
        <MonthNavigator
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
        />

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Show consolidated Budget & Income card if income tracking is enabled (only for current month) */}
          {session?.couple?.track_income && session?.couple?.id && isCurrentMonth ? (
            <IncomeOverviewCard
              coupleId={session.couple.id}
              totalBudgeted={totalBudgeted}
              budgetCount={monthBudgets.length}
            />
          ) : (
            <Card className="border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalBudgeted.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Across {monthBudgets.length} categor{monthBudgets.length !== 1 ? 'ies' : 'y'}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {totalBudgeted > 0
                  ? `${((totalSpent / totalBudgeted) * 100).toFixed(0)}% of total`
                  : 'No categories set'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Budget Categories</h2>
            <span className="text-sm text-muted-foreground">
              {categories.length}/{MAX_CATEGORIES} categories
            </span>
          </div>
          {monthDataLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-0">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {allBudgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onBudgetUpdated={handleBudgetUpdated}
                    onBudgetDeleted={handleBudgetUpdated}
                    readOnly={!isCurrentMonth}
                  />
                ))}

                {/* Add New Category Card (only show for current month) */}
                {isCurrentMonth && categories.length < MAX_CATEGORIES && (
                  <Card className="transition-all hover:shadow-lg border-dashed border-2 cursor-pointer hover:border-primary/70 hover:scale-105 active:scale-95"
                    onClick={() => setAddDialogOpen(true)}>
                    <CardHeader className="pb-2 py-3">
                      <div className="flex items-center justify-center min-h-[80px]">
                        <div className="w-12 h-12 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors">
                          <Plus className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>

        {/* Expenses for Selected Month */}
        <Card className="border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {isCurrentMonth ? 'Recent Expenses' : 'Expenses for Selected Month'}
            </CardTitle>
            <CardDescription>
              {filteredExpenses.length === monthExpenses.length
                ? `All expenses for this month`
                : `Filtered results (${filteredExpenses.length} of ${monthExpenses.length})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category and Period Filters */}
              <div className={`grid gap-4 ${isCurrentMonth ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Period filter only shows for current month */}
                {isCurrentMonth && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time Period</label>
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} found
                </span>
                {(searchQuery || filterCategory !== 'all' || filterPeriod !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterCategory('all')
                      setFilterPeriod('all')
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            {/* Expenses List */}
            <ExpensesList
              expenses={filteredExpenses}
              loading={monthDataLoading}
              error={null}
              onExpenseUpdated={handleExpenseUpdated}
              onExpenseDeleted={handleExpenseUpdated}
              readOnly={!isCurrentMonth}
            />
          </CardContent>
        </Card>
      </main>

      {/* Add Budget Dialog */}
      <AddBudgetDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onBudgetAdded={handleBudgetAdded}
      />

      {/* Expense Detail Dialog */}
      {selectedExpense && (
        <ExpenseDetailDialog
          expense={selectedExpense}
          open={expenseDetailOpen}
          onOpenChange={setExpenseDetailOpen}
          onExpenseUpdated={() => {
            handleExpenseUpdated()
            setExpenseDetailOpen(false)
            setSelectedExpense(null)
          }}
          onExpenseDeleted={() => {
            handleExpenseUpdated()
            setExpenseDetailOpen(false)
            setSelectedExpense(null)
          }}
        />
      )}

      <BottomNav />
    </div>
  )
}
