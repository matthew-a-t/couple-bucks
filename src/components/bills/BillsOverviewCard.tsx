import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, Receipt, Calendar, TrendingUp } from 'lucide-react'
import { billsService } from '@/services'

interface BillsOverviewCardProps {
  coupleId: string
  onDataLoaded?: (stats: any) => void
}

export const BillsOverviewCard = ({ coupleId, onDataLoaded }: BillsOverviewCardProps) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMonthly: 0,
    totalAnnual: 0,
    activeBillsCount: 0,
    byFrequency: {} as Record<string, { count: number; total: number }>,
    byCategory: {} as Record<string, { count: number; total: number }>
  })

  useEffect(() => {
    const loadBillStats = async () => {
      try {
        setLoading(true)
        const billStats = await billsService.getBillStatistics(coupleId)
        setStats(billStats)
        onDataLoaded?.(billStats)
      } catch (error) {
        console.error('Failed to load bill statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBillStats()
  }, [coupleId])

  if (loading) {
    return (
      <Card className="border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bills Overview</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  // If no bills, show helpful message
  if (stats.activeBillsCount === 0) {
    return (
      <Card className="border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bills Overview</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              No active bills yet
            </p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Add your first bill to start tracking recurring payments
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'weekly':
        return 'Weekly'
      case 'monthly':
        return 'Monthly'
      case 'quarterly':
        return 'Quarterly'
      case 'annual':
        return 'Annual'
      default:
        return freq
    }
  }

  // Get top 2 frequency types
  const topFrequencies = Object.entries(stats.byFrequency)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 2)

  return (
    <Card className="border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Bills Overview</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Monthly and Annual Totals */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Monthly</p>
            <div className="text-xl font-bold">${stats.totalMonthly.toFixed(2)}</div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Annual</p>
            <div className="text-xl font-bold">${stats.totalAnnual.toFixed(2)}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Active Bills Count */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
            <Receipt className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              {stats.activeBillsCount} Active Bill{stats.activeBillsCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Top Frequencies */}
          {topFrequencies.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {topFrequencies.map(([freq, data]) => (
                <div key={freq} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {getFrequencyLabel(freq)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{data.count}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs font-semibold">${data.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Annual Cost Indicator */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Yearly obligation
              </span>
            </div>
            <span className="text-xs font-semibold text-primary">
              ${(stats.totalMonthly * 12).toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
