import { useState } from 'react'
import { useAuthStore } from '@/store'
import { DEFAULT_CATEGORIES } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddExpenseDialog } from './AddExpenseDialog'

interface QuickAddButtonsProps {
  onExpenseAdded?: () => void
}

export const QuickAddButtons = ({ onExpenseAdded }: QuickAddButtonsProps) => {
  const session = useAuthStore((state) => state.session)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const quickAddCategories = session?.couple?.quick_add_buttons || [
    'Groceries',
    'Dining Out',
    'Gas',
    'Coffee'
  ]

  const handleQuickAdd = (categoryName: string) => {
    setSelectedCategory(categoryName)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedCategory(null)
  }

  const handleExpenseAdded = () => {
    onExpenseAdded?.()
    handleDialogClose()
  }

  // Get category details with emoji
  const getCategoryDetails = (name: string) => {
    return DEFAULT_CATEGORIES.find((cat) => cat.name === name) || { name, emoji: '📦' }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {quickAddCategories.map((categoryName) => {
          const category = getCategoryDetails(categoryName)

          return (
            <Button
              key={categoryName}
              variant="outline"
              className={cn(
                'h-24 flex flex-col items-center justify-center gap-2',
                'hover:bg-primary/5 hover:border-primary transition-all',
                'focus:ring-2 focus:ring-primary focus:ring-offset-2'
              )}
              onClick={() => handleQuickAdd(categoryName)}
            >
              <span className="text-3xl">{category.emoji}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </Button>
          )
        })}

        {/* Add Other Expense Button */}
        <Button
          variant="outline"
          className={cn(
            'h-24 flex flex-col items-center justify-center gap-2',
            'border-dashed border-2',
            'hover:bg-accent hover:border-primary transition-all'
          )}
          onClick={() => handleQuickAdd('Other')}
        >
          <Plus className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Other</span>
        </Button>
      </div>

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultCategory={selectedCategory || undefined}
        onExpenseAdded={handleExpenseAdded}
      />
    </>
  )
}
