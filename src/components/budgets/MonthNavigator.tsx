import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface MonthNavigatorProps {
  selectedMonth: number // 0-11 (JavaScript month)
  selectedYear: number
  onMonthChange: (month: number, year: number) => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const MonthNavigator = ({ selectedMonth, selectedYear, onMonthChange }: MonthNavigatorProps) => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear

  const handlePrevious = () => {
    if (selectedMonth === 0) {
      onMonthChange(11, selectedYear - 1)
    } else {
      onMonthChange(selectedMonth - 1, selectedYear)
    }
  }

  const handleNext = () => {
    // Don't allow navigating to future months
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return
    }

    if (selectedMonth === 11) {
      onMonthChange(0, selectedYear + 1)
    } else {
      onMonthChange(selectedMonth + 1, selectedYear)
    }
  }

  const handleCurrentMonth = () => {
    onMonthChange(currentMonth, currentYear)
  }

  const canGoNext = !(selectedYear === currentYear && selectedMonth === currentMonth)

  return (
    <Card className="border-0 bg-gradient-to-r from-primary to-secondary text-white">
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="text-white hover:bg-white/20 hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Month/Year Display */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </h2>
            </div>
            {!isCurrentMonth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCurrentMonth}
                className="mt-1 text-white/90 hover:bg-white/20 hover:text-white text-xs"
              >
                Jump to Current Month
              </Button>
            )}
          </div>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={!canGoNext}
            className="text-white hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Historical Data Indicator */}
        {!isCurrentMonth && (
          <div className="mt-3 text-center">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
              Viewing Historical Data
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
