import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, TrendingUp, AlertTriangle, PiggyBank } from 'lucide-react'
import { incomeService } from '@/services/income'
import type { Income } from '@/types/database'

interface IncomeOverviewCardProps {
  coupleId: string
  totalBudgeted: number
  budgetCount: number
}

export const IncomeOverviewCard = ({ coupleId, totalBudgeted, budgetCount }: IncomeOverviewCardProps) => {
  const [loading, setLoading] = useState(true)
  const [totalIncome, setTotalIncome] = useState(0)
  const [incomes, setIncomes] = useState<Income[]>([])

  useEffect(() => {
    const loadIncomeData = async () => {
      try {
        setLoading(true)

        // Load all couple incomes
        const coupleIncomes = await incomeService.getCoupleIncomes(coupleId)
        setIncomes(coupleIncomes)

        // Calculate total monthly income
        const total = coupleIncomes.reduce((sum, income) => {
          const monthlyAmount = incomeService.calculateMonthlyIncome(income.amount, income.frequency)
          return sum + monthlyAmount
        }, 0)
        setTotalIncome(total)
      } catch (error) {
        console.error('Failed to load income data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadIncomeData()
  }, [coupleId])

  if (loading) {
    return (
      <Card className="border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget & Income</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    )
  }

  // If no income data, show budget only with helpful message
  if (incomes.length === 0) {
    return (
      <Card className="border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget & Income</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-2xl font-bold">${totalBudgeted.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total budgeted across {budgetCount} categor{budgetCount !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Add income in settings to see budget health
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate remaining after budgets
  const remainingAfterBudgets = totalIncome - totalBudgeted
  const budgetToIncomeRatio = totalIncome > 0 ? (totalBudgeted / totalIncome) * 100 : 0

  // Determine health status
  const getHealthStatus = () => {
    if (budgetToIncomeRatio >= 100) return {
      color: 'text-error',
      bgColor: 'bg-error/10',
      icon: AlertTriangle,
      message: 'Over-budgeted'
    }
    if (budgetToIncomeRatio >= 90) return {
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      icon: AlertTriangle,
      message: 'Nearly maxed'
    }
    if (budgetToIncomeRatio >= 70) return {
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      icon: TrendingUp,
      message: 'Most allocated'
    }
    return {
      color: 'text-success',
      bgColor: 'bg-success/10',
      icon: TrendingUp,
      message: 'Healthy budget'
    }
  }

  const healthStatus = getHealthStatus()
  const HealthIcon = healthStatus.icon

  return (
    <Card className="border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Budget & Income</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Income and Budget Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Monthly Income</p>
            <div className="text-xl font-bold">${totalIncome.toFixed(2)}</div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Budgeted</p>
            <div className="text-xl font-bold">${totalBudgeted.toFixed(2)}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Status and Remaining */}
        <div className="space-y-2">
          {/* Health Status Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${healthStatus.bgColor}`}>
            <HealthIcon className={`h-3.5 w-3.5 ${healthStatus.color}`} />
            <span className={`text-xs font-medium ${healthStatus.color}`}>
              {healthStatus.message}
            </span>
          </div>

          {/* Remaining Amount */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Remaining</span>
            <span className={`text-sm font-semibold ${remainingAfterBudgets >= 0 ? 'text-success' : 'text-error'}`}>
              {remainingAfterBudgets >= 0 ? '+' : '-'}${Math.abs(remainingAfterBudgets).toFixed(2)}
            </span>
          </div>

          {/* Percentage Allocated */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Allocated</span>
            <span className={`text-sm font-semibold ${healthStatus.color}`}>
              {budgetToIncomeRatio.toFixed(0)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
