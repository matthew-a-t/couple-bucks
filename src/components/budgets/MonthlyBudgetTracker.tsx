import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { budgetsService } from '@/services/budgets'
import type { BudgetWithProgress } from '@/types'
import type { BudgetHistory } from '@/types/database'

interface MonthlyBudgetTrackerProps {
  coupleId: string
  budgets: BudgetWithProgress[]
}

interface MonthData {
  month: Date
  totalBudgeted: number
  totalSpent: number
  percentage: number
  status: 'success' | 'warning' | 'error'
  isCurrentMonth: boolean
  budgetCount: number
}

export const MonthlyBudgetTracker = ({ coupleId, budgets }: MonthlyBudgetTrackerProps) => {
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [budgetHistory, setBudgetHistory] = useState<BudgetHistory[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])

  useEffect(() => {
    loadBudgetHistory()
  }, [coupleId])

  useEffect(() => {
    if (budgetHistory.length > 0 || budgets.length > 0) {
      calculateMonthlyData()
    }
  }, [budgetHistory, budgets])

  const loadBudgetHistory = async () => {
    try {
      setLoading(true)
      const history = await budgetsService.getCoupleBudgetHistory(coupleId, 12)
      setBudgetHistory(history)
    } catch (error) {
      console.error('Failed to load budget history:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyData = () => {
    const months: MonthData[] = []
    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Add current month from budgets
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit_amount, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.current_spent, 0)
    const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

    months.push({
      month: new Date(now.getFullYear(), now.getMonth(), 1),
      totalBudgeted,
      totalSpent,
      percentage,
      status: percentage >= 100 ? 'error' : percentage >= 75 ? 'warning' : 'success',
      isCurrentMonth: true,
      budgetCount: budgets.length
    })

    // Group historical data by month
    const historyByMonth = new Map<string, BudgetHistory[]>()
    budgetHistory.forEach((record) => {
      const date = new Date(record.period_start)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      // Don't add current month from history (we already have it from budgets)
      if (monthKey === currentMonthKey) return

      if (!historyByMonth.has(monthKey)) {
        historyByMonth.set(monthKey, [])
      }
      historyByMonth.get(monthKey)!.push(record)
    })

    // Convert grouped history to monthly data
    historyByMonth.forEach((records) => {
      const totalBudgeted = records.reduce((sum, r) => sum + r.limit_amount, 0)
      const totalSpent = records.reduce((sum, r) => sum + r.total_spent, 0)
      const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
      const date = new Date(records[0].period_start)

      months.push({
        month: new Date(date.getFullYear(), date.getMonth(), 1),
        totalBudgeted,
        totalSpent,
        percentage,
        status: percentage >= 100 ? 'error' : percentage >= 75 ? 'warning' : 'success',
        isCurrentMonth: false,
        budgetCount: records.length
      })
    })

    // Sort by month (most recent first)
    months.sort((a, b) => b.month.getTime() - a.month.getTime())

    setMonthlyData(months)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setSelectedMonth(newMonth)
  }

  const getSelectedMonthData = (): MonthData | null => {
    const monthKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`
    return monthlyData.find((m) => {
      const dataKey = `${m.month.getFullYear()}-${String(m.month.getMonth() + 1).padStart(2, '0')}`
      return dataKey === monthKey
    }) || null
  }

  const getCurrentDayOfMonth = () => {
    const now = new Date()
    return now.getDate()
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const calculateDailyPace = (monthData: MonthData): number => {
    if (!monthData.isCurrentMonth) return 0

    const currentDay = getCurrentDayOfMonth()
    const daysInMonth = getDaysInMonth(monthData.month)
    const expectedSpentPercentage = (currentDay / daysInMonth) * 100

    return monthData.percentage - expectedSpentPercentage
  }

  const getPacingStatus = (pace: number) => {
    if (Math.abs(pace) < 10) return { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted/20', label: 'On track' }
    if (pace > 0) return { icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10', label: 'Ahead of budget' }
    return { icon: TrendingDown, color: 'text-success', bg: 'bg-success/10', label: 'Under budget' }
  }

  if (loading) {
    return (
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Budget Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (monthlyData.length === 0) {
    return (
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Budget Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No budget data available yet. Create budgets to start tracking your monthly progress.
          </p>
        </CardContent>
      </Card>
    )
  }

  const selectedMonthData = getSelectedMonthData()
  const canGoBack = monthlyData.some((m) => m.month < selectedMonth)
  const canGoForward = selectedMonth < new Date()

  const pace = selectedMonthData ? calculateDailyPace(selectedMonthData) : 0
  const pacingStatus = getPacingStatus(pace)
  const PaceIcon = pacingStatus.icon

  return (
    <Card className="border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Budget Tracking
          </CardTitle>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={!canGoBack}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={!canGoForward}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {selectedMonthData ? (
          <>
            {/* Month Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Budgeted</p>
                <p className="text-lg font-bold">${selectedMonthData.totalBudgeted.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Spent</p>
                <p className="text-lg font-bold">${selectedMonthData.totalSpent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p className={`text-lg font-bold ${selectedMonthData.totalBudgeted - selectedMonthData.totalSpent >= 0 ? 'text-success' : 'text-error'}`}>
                  ${Math.abs(selectedMonthData.totalBudgeted - selectedMonthData.totalSpent).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className={`font-semibold ${
                  selectedMonthData.status === 'error' ? 'text-error' :
                  selectedMonthData.status === 'warning' ? 'text-warning' :
                  'text-success'
                }`}>
                  {selectedMonthData.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    selectedMonthData.status === 'error' ? 'bg-error' :
                    selectedMonthData.status === 'warning' ? 'bg-warning' :
                    'bg-success'
                  }`}
                  style={{ width: `${Math.min(100, selectedMonthData.percentage)}%` }}
                />
              </div>
            </div>

            {/* Budget Pacing (Current Month Only) */}
            {selectedMonthData.isCurrentMonth && (
              <div className={`flex items-center justify-between p-3 rounded-lg ${pacingStatus.bg}`}>
                <div className="flex items-center gap-2">
                  <PaceIcon className={`h-4 w-4 ${pacingStatus.color}`} />
                  <div>
                    <p className={`text-sm font-medium ${pacingStatus.color}`}>
                      {pacingStatus.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Day {getCurrentDayOfMonth()} of {getDaysInMonth(selectedMonth)}
                    </p>
                  </div>
                </div>
                {Math.abs(pace) >= 10 && (
                  <span className={`text-sm font-semibold ${pacingStatus.color}`}>
                    {pace > 0 ? '+' : ''}{pace.toFixed(0)}%
                  </span>
                )}
              </div>
            )}

            {/* Historical Note */}
            {!selectedMonthData.isCurrentMonth && (
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">
                  Historical data from {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No budget data for {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        )}

        {/* Month History Timeline */}
        {monthlyData.length > 1 && (
          <div className="pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-3">Recent Months</p>
            <div className="space-y-2">
              {monthlyData.slice(0, 6).map((month, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMonth(new Date(month.month))}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    month.month.getMonth() === selectedMonth.getMonth() &&
                    month.month.getFullYear() === selectedMonth.getFullYear()
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      month.status === 'error' ? 'bg-error' :
                      month.status === 'warning' ? 'bg-warning' :
                      'bg-success'
                    }`} />
                    <span className="text-sm font-medium">
                      {month.month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      {month.isCurrentMonth && <span className="ml-2 text-xs text-primary">(Current)</span>}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    month.status === 'error' ? 'text-error' :
                    month.status === 'warning' ? 'text-warning' :
                    'text-success'
                  }`}>
                    {month.percentage.toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
