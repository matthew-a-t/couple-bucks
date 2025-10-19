import { useEffect } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { BottomNav } from '@/components/shared/BottomNav'

export const ReviewPage = () => {
  const session = useAuthStore((state) => state.session)
  const {
    expenses,
    loadExpenses,
    subscribeToExpenses,
    unsubscribeFromExpenses
  } = useCoupleStore()

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

  return (
    <div className="min-h-screen pb-32">
      <main className="px-4 pt-6 space-y-6 max-w-[90rem] mx-auto">
        {/* Spending Chart */}
        <SpendingChart
          expenses={expenses as any}
        />
      </main>

      <BottomNav />
    </div>
  )
}
