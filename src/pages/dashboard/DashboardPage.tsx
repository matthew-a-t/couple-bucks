import { useEffect, useState } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
import { BottomNav } from '@/components/shared/BottomNav'
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog'
import { Plus } from 'lucide-react'

export const DashboardPage = () => {
  const { session } = useAuthStore()
  const {
    expenses,
    loadExpenses,
    subscribeToExpenses,
    unsubscribeFromExpenses
  } = useCoupleStore()

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)

  useEffect(() => {
    if (session?.couple?.id) {
      loadExpenses(session.couple.id, 5)
      subscribeToExpenses(session.couple.id)

      return () => {
        unsubscribeFromExpenses()
      }
    }
  }, [session?.couple?.id])

  const handleExpenseAdded = () => {
    if (session?.couple?.id) {
      loadExpenses(session.couple.id, 5)
      setIsAddExpenseOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <main className="px-4 pt-6 space-y-8 max-w-[90rem] mx-auto">
        {/* Recent Transactions List */}
        <section>
          {expenses.length === 0 ? (
            <div className="flex items-center justify-center p-12 bg-white border border-border rounded-xl">
              <p className="text-muted-foreground text-center">No recent transactions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 3).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-white border border-border rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{expense.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.description || 'No description'}
                    </p>
                  </div>
                  <span className="font-bold text-foreground">${Number(expense.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add Expense Button - Large and centered */}
        <div className="flex justify-center py-12">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="group relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center"
            aria-label="Add expense"
          >
            <Plus className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </main>

      <BottomNav />

      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        onExpenseAdded={handleExpenseAdded}
      />
    </div>
  )
}
