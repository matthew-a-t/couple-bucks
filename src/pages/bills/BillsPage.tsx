import { useEffect, useState } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
import { AddBillDialog } from '@/components/bills/AddBillDialog'
import { BillCard } from '@/components/bills/BillCard'
import { BottomNav } from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Calendar, AlertCircle, Clock } from 'lucide-react'

export const BillsPage = () => {
  const session = useAuthStore((state) => state.session)
  const { bills, billsLoading, loadBills, subscribeToBills, unsubscribeFromBills } = useCoupleStore()
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  useEffect(() => {
    if (session?.couple?.id) {
      loadBills(session.couple.id)
      subscribeToBills(session.couple.id)
      return () => unsubscribeFromBills()
    }
  }, [session?.couple?.id])

  const handleBillAdded = () => {
    if (session?.couple?.id) {
      loadBills(session.couple.id)
    }
    setAddDialogOpen(false)
  }

  const handleBillUpdated = () => {
    if (session?.couple?.id) {
      loadBills(session.couple.id)
    }
  }

  const overdue = bills.filter((b) => b.status === 'overdue')
  const dueSoon = bills.filter((b) => b.status === 'due_soon')
  const upcoming = bills.filter((b) => b.status === 'upcoming')

  return (
    <div className="min-h-screen pb-32">
      <main className="px-4 pt-6 space-y-6 max-w-[90rem] mx-auto">
        {billsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bills yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first recurring bill</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bill
            </Button>
          </Card>
        ) : (
          <>
            {overdue.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Overdue ({overdue.length})
                </h2>
                <div className="space-y-3">
                  {overdue.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onBillUpdated={handleBillUpdated}
                      onBillDeleted={handleBillUpdated}
                    />
                  ))}
                </div>
              </div>
            )}

            {dueSoon.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Due Soon ({dueSoon.length})
                </h2>
                <div className="space-y-3">
                  {dueSoon.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onBillUpdated={handleBillUpdated}
                      onBillDeleted={handleBillUpdated}
                    />
                  ))}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onBillUpdated={handleBillUpdated}
                      onBillDeleted={handleBillUpdated}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <AddBillDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onBillAdded={handleBillAdded} />

      <BottomNav />
    </div>
  )
}
