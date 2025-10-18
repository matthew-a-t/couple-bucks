import { useEffect, useState } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
import { AddBudgetDialog } from '@/components/budgets/AddBudgetDialog'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BottomNav } from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, PiggyBank, TrendingUp, AlertCircle } from 'lucide-react'

export const BudgetsPage = () => {
  const session = useAuthStore((state) => state.session)
  const {
    budgets,
    budgetsLoading,
    loadBudgets,
    subscribeToBudgets,
    unsubscribeFromBudgets
  } = useCoupleStore()

  const [addDialogOpen, setAddDialogOpen] = useState(false)

  useEffect(() => {
    if (session?.couple?.id) {
      loadBudgets(session.couple.id)
      subscribeToBudgets(session.couple.id)

      return () => {
        unsubscribeFromBudgets()
      }
    }
  }, [session?.couple?.id])

  const handleBudgetAdded = () => {
    if (session?.couple?.id) {
      loadBudgets(session.couple.id)
    }
    setAddDialogOpen(false)
  }

  const handleBudgetUpdated = () => {
    if (session?.couple?.id) {
      loadBudgets(session.couple.id)
    }
  }

  // Calculate totals
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit_amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.current_spent, 0)
  const overBudgetCount = budgets.filter((b) => b.status === 'error').length
  const warningCount = budgets.filter((b) => b.status === 'warning').length

  const existingCategories = budgets.map((b) => b.category)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Budgets</h1>
              <p className="text-sm text-muted-foreground">
                Track spending limits across categories
              </p>
            </div>

            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBudgeted.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Across {budgets.length} categor{budgets.length !== 1 ? 'ies' : 'y'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {totalBudgeted > 0
                  ? `${((totalSpent / totalBudgeted) * 100).toFixed(0)}% of total`
                  : 'No budgets set'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warningCount}</div>
              <p className="text-xs text-muted-foreground">
                75-100% of limit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
              <AlertCircle className="h-4 w-4 text-error" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-error">{overBudgetCount}</div>
              <p className="text-xs text-muted-foreground">
                Exceeded limit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budgets List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Budgets</h2>

          {budgetsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
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
          ) : budgets.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                <PiggyBank className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first budget to start tracking spending limits
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Budget
              </Button>
            </Card>
          ) : (
            <>
              {/* Alert if over budget */}
              {overBudgetCount > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {overBudgetCount} budget{overBudgetCount !== 1 ? 's are' : ' is'} over the
                    limit. Consider adjusting your spending or increasing the limit.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onBudgetUpdated={handleBudgetUpdated}
                    onBudgetDeleted={handleBudgetUpdated}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info Card */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">About Budgets</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Ongoing limits:</strong> Budgets don't reset automatically. Use the reset
              option when starting a new period.
            </p>
            <p>
              <strong>Color indicators:</strong> Green (&lt;75%), Yellow (75-100%), Red (&gt;100%)
            </p>
            <p>
              <strong>Real-time updates:</strong> Budget spending updates automatically as you
              log expenses.
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Add Budget Dialog */}
      <AddBudgetDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onBudgetAdded={handleBudgetAdded}
        existingCategories={existingCategories}
      />

      <BottomNav />
    </div>
  )
}
