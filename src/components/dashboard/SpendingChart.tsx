import { useMemo, useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import type { Expense } from '@/types'

type DateRange = 'all' | 'today' | 'week' | 'month' | 'last_month' | 'last_3_months'

interface SpendingChartProps {
  expenses: Expense[]
  onFilteredExpensesChange?: (filtered: Expense[]) => void
}

const COLORS = [
  '#667eea', // primary
  '#764ba2', // secondary
  '#a78bfa', // accent
  '#48bb78', // success
  '#4299e1', // info
  '#ecc94b', // warning
  '#f56565', // error
  '#9f7aea', // purple
  '#ed8936', // orange
  '#38b2ac'  // teal
]

export const SpendingChart = ({ expenses, onFilteredExpensesChange }: SpendingChartProps) => {
  const [dateRange, setDateRange] = useState<DateRange>('month')

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
      default:
        return expenses
    }

    return expenses.filter((exp) => new Date(exp.created_at) >= startDate)
  }, [expenses, dateRange])

  // Notify parent of filtered expenses
  useEffect(() => {
    if (onFilteredExpensesChange) {
      onFilteredExpensesChange(filteredExpenses)
    }
  }, [filteredExpenses, onFilteredExpensesChange])

  const chartData = useMemo(() => {
    const categoryMap = new Map<string, number>()

    filteredExpenses.forEach((expense) => {
      const amount = Number(expense.amount)
      const existing = categoryMap.get(expense.category)
      if (existing) {
        categoryMap.set(expense.category, existing + amount)
      } else {
        categoryMap.set(expense.category, amount)
      }
    })

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 categories
  }, [filteredExpenses])

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl">
        <p className="text-muted-foreground">No spending data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 [&_*]:outline-none [&_*:focus]:outline-none">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Spending by Category</h2>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-bold text-primary">${total.toFixed(2)}</span>
          </p>
        </div>
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
          <SelectTrigger className="w-[140px] focus:ring-0 focus:ring-offset-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="last_3_months">Last 3 Months</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={300} style={{ outline: 'none' }}>
        <PieChart style={{ outline: 'none' }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            style={{ outline: 'none' }}
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ outline: 'none' }} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${value.toFixed(2)}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
