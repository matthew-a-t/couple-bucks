import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useCoupleStore } from '@/store'
import { BottomNav } from '@/components/shared/BottomNav'
import { InvitePartnerBanner } from '@/components/shared/InvitePartnerBanner'
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog'
import { ExpenseDetailDialog } from '@/components/expenses/ExpenseDetailDialog'
import { QuickAddBubbles } from '@/components/expenses/QuickAddBubbles'
import { Plus } from 'lucide-react'
import type { ExpenseWithUser } from '@/types'

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const {
    expenses,
    loadExpenses,
    subscribeToExpenses,
    unsubscribeFromExpenses
  } = useCoupleStore()

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithUser | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [transactionCount, setTransactionCount] = useState(3)

  // Redirect to onboarding if user doesn't have a couple
  useEffect(() => {
    if (session && !session.profile.couple_id) {
      navigate('/onboarding', { replace: true })
    }
  }, [session, navigate])

  useEffect(() => {
    if (session?.couple?.id) {
      loadExpenses(session.couple.id) // Load all expenses for chart
      subscribeToExpenses(session.couple.id)

      return () => {
        unsubscribeFromExpenses()
      }
    }
  }, [session?.couple?.id])

  // Responsive transaction count based on screen size
  useEffect(() => {
    const updateTransactionCount = () => {
      const width = window.innerWidth
      if (width < 1024) {
        setTransactionCount(2) // Mobile/Tablet: 2 transactions
      } else {
        setTransactionCount(3) // Desktop: 3 transactions
      }
    }

    updateTransactionCount()
    window.addEventListener('resize', updateTransactionCount)
    return () => window.removeEventListener('resize', updateTransactionCount)
  }, [])

  const handleExpenseAdded = async () => {
    if (session?.couple?.id) {
      // Refresh session to get updated custom_categories
      await useAuthStore.getState().refreshSession()
      loadExpenses(session.couple.id)
      setIsAddExpenseOpen(false)
    }
  }

  const handleTransactionClick = (expense: ExpenseWithUser) => {
    setSelectedExpense(expense)
    setIsDetailDialogOpen(true)
  }

  const handleExpenseDeleted = () => {
    setIsDetailDialogOpen(false)
    setSelectedExpense(null)
    if (session?.couple?.id) {
      loadExpenses(session.couple.id)
    }
  }

  const isPaired = session?.couple?.is_paired ?? false

  return (
    <div className="min-h-screen pb-32">
      <main className="px-4 pt-6 space-y-6 max-w-[90rem] mx-auto">
        {/* Invite Partner Banner - Show when not paired */}
        {!isPaired && (
          <section className="flex justify-center">
            <div className="max-w-2xl w-full">
              <InvitePartnerBanner />
            </div>
          </section>
        )}

        {/* Recent Transactions List - Responsive Grid */}
        {expenses.length > 0 && (
          <section className="flex justify-center">
            <div className="flex flex-col gap-3 max-w-2xl w-full">
              {expenses.slice(0, transactionCount).reverse().map((expense) => (
                <div
                  key={expense.id}
                  className="grid grid-cols-[1fr_0.75fr] items-center gap-4 p-4 bg-white rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-primary/50 border border-transparent"
                  onClick={() => handleTransactionClick(expense)}
                >
                  <div>
                    <p className="font-semibold text-lg text-foreground">{expense.category}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(expense.created_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xl text-foreground">${Number(expense.amount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Centered Add Expense Group */}
      <div className="fixed bottom-48 sm:bottom-52 md:bottom-56 lg:bottom-60 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-8">
        {/* Add Expense Button */}
        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="group w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center"
          aria-label="Add expense"
        >
          <Plus className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-white" strokeWidth={2.5} />
        </button>

        {/* Quick Add Bubbles */}
        <QuickAddBubbles onExpenseAdded={handleExpenseAdded} />
      </div>

      <BottomNav />

      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        onExpenseAdded={handleExpenseAdded}
      />

      {selectedExpense && (
        <ExpenseDetailDialog
          expense={selectedExpense as any}
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          onExpenseDeleted={handleExpenseDeleted}
        />
      )}
    </div>
  )
}
