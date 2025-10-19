import { useEffect, useState, useMemo } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
import { BottomNav } from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, Download, Calendar, TrendingUp, Users } from 'lucide-react'
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

type DateRange = 'all' | 'today' | 'week' | 'month' | 'last_month' | 'last_3_months' | 'year'

interface CategorySummary {
  category: string
  total: number
  count: number
  percentage: number
}

interface PartnerSummary {
  partnerId: string
  partnerName: string
  total: number
  count: number
  percentage: number
}

export const ReportsPage = () => {
  const session = useAuthStore((state) => state.session)
  const { expenses, expensesLoading, loadExpenses, subscribeToExpenses, unsubscribeFromExpenses } = useCoupleStore()

  const [dateRange, setDateRange] = useState<DateRange>('month')

  useEffect(() => {
    if (session?.couple?.id) {
      loadExpenses(session.couple.id)
      subscribeToExpenses(session.couple.id)
      return () => unsubscribeFromExpenses()
    }
  }, [session?.couple?.id])

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    if (dateRange === 'all') return expenses

    const now = new Date()
    let startDate: Date

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = subDays(now, 7)
        break
      case 'month':
        startDate = startOfMonth(now)
        break
      case 'last_month':
        const lastMonth = subMonths(now, 1)
        return expenses.filter((exp) =>
          isWithinInterval(new Date(exp.created_at), {
            start: startOfMonth(lastMonth),
            end: endOfMonth(lastMonth)
          })
        )
      case 'last_3_months':
        startDate = subMonths(now, 3)
        break
      case 'year':
        startDate = subMonths(now, 12)
        break
      default:
        return expenses
    }

    return expenses.filter((exp) => new Date(exp.created_at) >= startDate)
  }, [expenses, dateRange])

  // Calculate spending by category
  const categoryData = useMemo((): CategorySummary[] => {
    const categoryMap = new Map<string, { total: number; count: number }>()
    let grandTotal = 0

    filteredExpenses.forEach((exp) => {
      const amount = Number(exp.amount)
      grandTotal += amount

      const existing = categoryMap.get(exp.category)
      if (existing) {
        existing.total += amount
        existing.count++
      } else {
        categoryMap.set(exp.category, { total: amount, count: 1 })
      }
    })

    const data = Array.from(categoryMap.entries())
      .map(([category, { total, count }]) => ({
        category,
        total,
        count,
        percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)

    return data
  }, [filteredExpenses])

  // Calculate spending by partner
  const partnerData = useMemo((): PartnerSummary[] => {
    const partnerMap = new Map<string, { name: string; total: number; count: number }>()
    let grandTotal = 0

    filteredExpenses.forEach((exp) => {
      const amount = Number(exp.amount)
      grandTotal += amount

      const existing = partnerMap.get(exp.created_by)
      if (existing) {
        existing.total += amount
        existing.count++
      } else {
        partnerMap.set(exp.created_by, {
          name: exp.created_by_name || 'Unknown',
          total: amount,
          count: 1
        })
      }
    })

    const data = Array.from(partnerMap.entries())
      .map(([partnerId, { name, total, count }]) => ({
        partnerId,
        partnerName: name,
        total,
        count,
        percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)

    return data
  }, [filteredExpenses])

  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return

    // Create CSV header
    const headers = ['Date', 'Category', 'Amount', 'Description', 'Split Type', 'Logged By']

    // Create CSV rows
    const rows = filteredExpenses.map((exp) => [
      format(new Date(exp.created_at), 'yyyy-MM-dd HH:mm:ss'),
      exp.category,
      Number(exp.amount).toFixed(2),
      exp.description || '',
      exp.split_type,
      exp.created_by_name || 'Unknown'
    ])

    // Combine into CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `couple-bucks-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getDateRangeLabel = (range: DateRange): string => {
    switch (range) {
      case 'all': return 'All Time'
      case 'today': return 'Today'
      case 'week': return 'Last 7 Days'
      case 'month': return 'This Month'
      case 'last_month': return 'Last Month'
      case 'last_3_months': return 'Last 3 Months'
      case 'year': return 'Last 12 Months'
      default: return 'All Time'
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <main className="px-4 pt-6 space-y-6 max-w-[90rem] mx-auto">
        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Time Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="year">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              Showing data for: <strong>{getDateRangeLabel(dateRange)}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{filteredExpenses.length} expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryData.length}</div>
              <p className="text-xs text-muted-foreground">With spending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average per Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${filteredExpenses.length > 0 ? (totalSpent / filteredExpenses.length).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {expensesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <Card className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data for this period</h3>
            <p className="text-sm text-muted-foreground">
              Try selecting a different date range or log some expenses
            </p>
          </Card>
        ) : (
          <>
            {/* Spending by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Spending by Category
                </CardTitle>
                <CardDescription>
                  Breakdown of expenses across {categoryData.length} categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryData.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-muted-foreground">({cat.count} expenses)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">${cat.total.toFixed(2)}</span>
                        <span className="text-muted-foreground ml-2">({cat.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <Progress
                      value={cat.percentage}
                      className="h-3"
                      indicatorClassName="bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Spending by Partner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Spending by Partner
                </CardTitle>
                <CardDescription>
                  Who logged what expenses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {partnerData.map((partner) => (
                  <div key={partner.partnerId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{partner.partnerName}</span>
                        <span className="text-muted-foreground">({partner.count} expenses)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">${partner.total.toFixed(2)}</span>
                        <span className="text-muted-foreground ml-2">({partner.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <Progress
                      value={partner.percentage}
                      className="h-3"
                      indicatorClassName="bg-gradient-to-r from-secondary to-accent"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Export Info */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Export Data</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Click the <strong>Export CSV</strong> button to download all expense data for the selected time period.
                </p>
                <p>
                  The CSV file includes: Date, Category, Amount, Description, Split Type, and who logged each expense.
                </p>
                <p className="text-xs">
                  You can open CSV files in Excel, Google Sheets, or any spreadsheet application.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
