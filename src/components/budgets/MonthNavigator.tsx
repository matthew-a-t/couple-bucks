import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

  // Month picker dialog state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [tempMonth, setTempMonth] = useState(selectedMonth)
  const [tempYear, setTempYear] = useState(selectedYear)

  // Generate years list (from 2020 to current year)
  const startYear = 2020
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse()

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

  const handleOpenPicker = () => {
    setTempMonth(selectedMonth)
    setTempYear(selectedYear)
    setPickerOpen(true)
  }

  const handleApplyPicker = () => {
    // Don't allow selecting future months
    if (tempYear > currentYear || (tempYear === currentYear && tempMonth > currentMonth)) {
      return
    }
    onMonthChange(tempMonth, tempYear)
    setPickerOpen(false)
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
            <button
              onClick={handleOpenPicker}
              className="flex items-center justify-center gap-2 mx-auto hover:bg-white/10 rounded-lg px-3 py-1 transition-colors"
            >
              <Calendar className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </h2>
            </button>
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

      {/* Month/Year Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Select Month & Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Month Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select
                value={tempMonth.toString()}
                onValueChange={(value) => setTempMonth(parseInt(value))}
              >
                <SelectTrigger className="h-12 text-base rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((month, index) => (
                    <SelectItem key={index} value={index.toString()} className="text-base py-3">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select
                value={tempYear.toString()}
                onValueChange={(value) => setTempYear(parseInt(value))}
              >
                <SelectTrigger className="h-12 text-base rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-base py-3">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 text-base font-semibold rounded-xl"
                onClick={() => setPickerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 h-12 text-base font-semibold rounded-xl"
                onClick={handleApplyPicker}
                disabled={tempYear > currentYear || (tempYear === currentYear && tempMonth > currentMonth)}
              >
                Apply
              </Button>
            </div>

            {/* Future month warning */}
            {(tempYear > currentYear || (tempYear === currentYear && tempMonth > currentMonth)) && (
              <p className="text-sm text-destructive text-center">
                Cannot select future months
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
