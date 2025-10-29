import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store'
import { billsService } from '@/services'
import { AddBillDialog, BillCard, BillsOverviewCard, BillsCalendar } from '@/components/bills'
import { BottomNav } from '@/components/shared/BottomNav'
import { InvitePartnerBanner } from '@/components/shared/InvitePartnerBanner'
import { MonthNavigator } from '@/components/budgets/MonthNavigator'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Calendar, AlertCircle, Clock, X } from 'lucide-react'
import type { BillWithStatus, BillFrequency } from '@/types'

export const BillsPage = () => {
  const session = useAuthStore((state) => state.session)
  const isManager = session?.profile?.permission_tier === 'manager'
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [bills, setBills] = useState<BillWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const billsListRef = useRef<HTMLDivElement>(null)

  // Month navigation
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear()

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [frequencyFilter, setFrequencyFilter] = useState<BillFrequency[]>([])
  const [statusFilter, setStatusFilter] = useState<('overdue' | 'due_soon' | 'upcoming')[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const categories = session?.couple?.custom_categories || []

  useEffect(() => {
    loadBills()

    // Subscribe to real-time updates
    if (session?.couple?.id) {
      const subscription = billsService.subscribeToBills(session.couple.id, () => {
        loadBills()
      })
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [session?.couple?.id, selectedMonth, selectedYear, searchTerm, categoryFilter, frequencyFilter, statusFilter])

  const loadBills = async () => {
    if (!session?.couple?.id) return

    try {
      setIsLoading(true)

      let filteredBills: BillWithStatus[]

      // Load bills based on selected month
      if (isCurrentMonth) {
        // For current month, get all bills with status
        filteredBills = await billsService.getCoupleBillsWithStatus(session.couple.id)
      } else {
        // For other months, get bills for that specific month
        filteredBills = await billsService.getBillsForMonth(
          session.couple.id,
          selectedYear,
          selectedMonth + 1 // JavaScript months are 0-11, but getBillsForMonth expects 1-12
        )
      }

      // Apply search
      if (searchTerm) {
        filteredBills = await billsService.searchBills(session.couple.id, searchTerm)
      }

      // Apply filters
      if (categoryFilter.length > 0 || frequencyFilter.length > 0 || statusFilter.length > 0) {
        filteredBills = await billsService.filterBills(session.couple.id, {
          categories: categoryFilter.length > 0 ? categoryFilter : undefined,
          frequencies: frequencyFilter.length > 0 ? frequencyFilter : undefined,
          statuses: statusFilter.length > 0 ? statusFilter : undefined
        })
      }

      setBills(filteredBills)
    } catch (error) {
      console.error('Failed to load bills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBillAdded = () => {
    loadBills()
    setAddDialogOpen(false)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter([])
    setFrequencyFilter([])
    setStatusFilter([])
    setSelectedDate(null)
  }

  const handleDayClick = (date: Date, dayBills: BillWithStatus[]) => {
    setSelectedDate(date)
    // Scroll to bills list
    setTimeout(() => {
      billsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const hasActiveFilters = searchTerm || categoryFilter.length > 0 || frequencyFilter.length > 0 || statusFilter.length > 0 || selectedDate !== null

  // Filter bills by selected date if one is chosen
  const filteredBills = selectedDate
    ? bills.filter((bill) => {
        const billDate = new Date(bill.due_date)
        return (
          billDate.getFullYear() === selectedDate.getFullYear() &&
          billDate.getMonth() === selectedDate.getMonth() &&
          billDate.getDate() === selectedDate.getDate()
        )
      })
    : bills

  // Group bills by status
  const overdue = filteredBills.filter((b) => b.status === 'overdue')
  const dueSoon = filteredBills.filter((b) => b.status === 'due_soon')
  const upcoming = filteredBills.filter((b) => b.status === 'upcoming')

  return (
    <div className="min-h-screen pb-32">
      <main className="px-4 pt-6 space-y-6 max-w-[90rem] mx-auto">
        {/* Invite Partner Banner */}
        {session?.couple && !session.couple.is_paired && (
          <InvitePartnerBanner inviteCode={session.couple.invite_code || undefined} />
        )}

        {/* Month Navigator */}
        <MonthNavigator
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={(month, year) => {
            setSelectedMonth(month)
            setSelectedYear(year)
          }}
        />

        {/* Overview Card */}
        {session?.couple?.id && isCurrentMonth && (
          <BillsOverviewCard coupleId={session.couple.id} />
        )}

        {/* Bills Calendar */}
        <BillsCalendar
          bills={bills}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onDayClick={handleDayClick}
        />

        {/* Search and Filter Bar */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-12 rounded-xl"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              className="h-12 w-12 rounded-xl"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select
                    value={categoryFilter[0] || ''}
                    onValueChange={(value) => setCategoryFilter(value ? [value] : [])}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Frequency Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Frequency</label>
                  <Select
                    value={frequencyFilter[0] || ''}
                    onValueChange={(value) => setFrequencyFilter(value ? [value as BillFrequency] : [])}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="All frequencies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All frequencies</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={statusFilter[0] || ''}
                    onValueChange={(value) => setStatusFilter(value ? [value as any] : [])}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="due_soon">Due Soon</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="rounded-full">
                      Search: {searchTerm}
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedDate && (
                    <Badge variant="secondary" className="rounded-full">
                      Date: {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {categoryFilter.map((cat) => (
                    <Badge key={cat} variant="secondary" className="rounded-full">
                      {cat}
                      <button
                        onClick={() => setCategoryFilter([])}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {frequencyFilter.map((freq) => (
                    <Badge key={freq} variant="secondary" className="rounded-full">
                      {freq}
                      <button
                        onClick={() => setFrequencyFilter([])}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Bills List */}
        <div ref={billsListRef}>
          {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : bills.length === 0 ? (
          // Empty State
          <Card className="p-12 text-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-0">
            <div className="max-w-md mx-auto space-y-4">
              <Calendar className="h-16 w-16 text-primary/50 mx-auto" />
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {hasActiveFilters ? 'No bills match your filters' :
                   !isCurrentMonth ? `No bills in ${new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` :
                   'No bills yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters ? 'Try adjusting your search or filters' :
                   !isCurrentMonth ? 'No bills were due in this period' :
                   isManager ? 'Add your first recurring bill to start tracking payments' :
                   'Your partner hasn\'t added any bills yet'}
                </p>
              </div>
              {isManager && isCurrentMonth && (
                <Button size="lg" onClick={() => setAddDialogOpen(true)} className="rounded-2xl">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Bill
                </Button>
              )}
            </div>
          </Card>
        ) : (
          // Bills grouped by status
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
                      onBillUpdated={loadBills}
                      onBillDeleted={loadBills}
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
                      onBillUpdated={loadBills}
                      onBillDeleted={loadBills}
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
                      onBillUpdated={loadBills}
                      onBillDeleted={loadBills}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      {isManager && isCurrentMonth && (
        <Button
          size="lg"
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-10"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <AddBillDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onBillAdded={handleBillAdded} />

      <BottomNav />
    </div>
  )
}
