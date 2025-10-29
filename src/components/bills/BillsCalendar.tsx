import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BillWithStatus } from '@/types'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns'

interface BillsCalendarProps {
  bills: BillWithStatus[]
  selectedMonth: number // 0-11
  selectedYear: number
  onDayClick?: (date: Date, bills: BillWithStatus[]) => void
}

export const BillsCalendar = ({ bills, selectedMonth, selectedYear, onDayClick }: BillsCalendarProps) => {
  const monthStart = new Date(selectedYear, selectedMonth, 1)

  // Generate calendar days (including padding days from prev/next month)
  const calendarDays = useMemo(() => {
    const monthStartDate = startOfMonth(monthStart)
    const monthEndDate = endOfMonth(monthStart)
    const calendarStartDate = startOfWeek(monthStartDate, { weekStartsOn: 0 })
    const calendarEndDate = endOfWeek(monthEndDate, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: calendarStartDate, end: calendarEndDate })
  }, [monthStart])

  // Group bills by date
  const billsByDate = useMemo(() => {
    const grouped = new Map<string, BillWithStatus[]>()

    bills.forEach((bill) => {
      const dateKey = format(new Date(bill.due_date), 'yyyy-MM-dd')
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(bill)
    })

    return grouped
  }, [bills])

  // Get bills for a specific date
  const getBillsForDate = (date: Date): BillWithStatus[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return billsByDate.get(dateKey) || []
  }

  // Get status color for a day
  const getDayStatus = (dayBills: BillWithStatus[]) => {
    if (dayBills.length === 0) return null

    const hasOverdue = dayBills.some(b => b.status === 'overdue')
    const hasDueSoon = dayBills.some(b => b.status === 'due_soon')

    if (hasOverdue) return 'overdue'
    if (hasDueSoon) return 'due_soon'
    return 'upcoming'
  }

  const handleDayClick = (date: Date) => {
    const dayBills = getBillsForDate(date)
    if (dayBills.length > 0 && onDayClick) {
      onDayClick(date, dayBills)
    }
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card className="p-4">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayBills = getBillsForDate(day)
          const dayStatus = getDayStatus(dayBills)
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isCurrentDay = isToday(day)
          const hasBills = dayBills.length > 0

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              disabled={!hasBills}
              className={cn(
                'relative aspect-square p-1 rounded-lg transition-all',
                'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary',
                !isCurrentMonth && 'opacity-40',
                isCurrentDay && 'ring-2 ring-primary',
                hasBills && 'cursor-pointer',
                !hasBills && 'cursor-default'
              )}
            >
              {/* Day Number */}
              <div
                className={cn(
                  'text-sm font-medium',
                  isCurrentDay && 'text-primary font-bold',
                  !isCurrentMonth && 'text-muted-foreground'
                )}
              >
                {format(day, 'd')}
              </div>

              {/* Bill Indicator */}
              {hasBills && (
                <div className="mt-0.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] px-1 py-0 h-4 leading-none',
                      dayStatus === 'overdue' && 'bg-destructive text-destructive-foreground',
                      dayStatus === 'due_soon' && 'bg-warning text-warning-foreground',
                      dayStatus === 'upcoming' && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {dayBills.length}
                  </Badge>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">Due Soon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Upcoming</span>
        </div>
      </div>
    </Card>
  )
}
