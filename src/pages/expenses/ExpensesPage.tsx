import { useEffect, useState } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
import { QuickAddButtons } from '@/components/expenses/QuickAddButtons'
import { ExpensesList } from '@/components/expenses/ExpensesList'
import { BottomNav } from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, TrendingUp, Calendar } from 'lucide-react'
import { DEFAULT_CATEGORIES } from '@/types'

export const ExpensesPage = () => {
  const session = useAuthStore((state) => state.session)
  const {
    expenses,
    expensesLoading,
    loadExpenses,
    subscribeToExpenses,
    unsubscribeFromExpenses
  } = useCoupleStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')

  useEffect(() => {
    if (session?.couple?.id) {
      // Load expenses
      loadExpenses(session.couple.id)

      // Subscribe to real-time updates
      subscribeToExpenses(session.couple.id)

      // Cleanup on unmount
      return () => {
        unsubscribeFromExpenses()
      }
    }
  }, [session?.couple?.id])

  const handleExpenseAdded = () => {
    if (session?.couple?.id) {
      loadExpenses(session.couple.id)
    }
  }

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        expense.category.toLowerCase().includes(query) ||
        expense.description?.toLowerCase().includes(query) ||
        expense.created_by_name?.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // Category filter
    if (filterCategory !== 'all' && expense.category !== filterCategory) {
      return false
    }

    // Period filter
    if (filterPeriod !== 'all') {
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
    <div className="min-h-screen bg-background pb-32">
      <main className="px-4 pt-6 space-y-6 max-w-[90rem] mx-auto">
        {/* Quick Add Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Add
            </CardTitle>
            <CardDescription>Tap a category to log an expense</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickAddButtons onExpenseAdded={handleExpenseAdded} />
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Expenses
            </CardTitle>
            <CardDescription>
              {filteredExpenses.length === expenses.length
                ? 'All your expenses'
                : `Filtered results (${filteredExpenses.length} of ${expenses.length})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesList
              expenses={filteredExpenses}
              loading={expensesLoading}
              error={null}
              onExpenseUpdated={handleExpenseAdded}
              onExpenseDeleted={handleExpenseAdded}
            />
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
