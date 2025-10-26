import { useState, useEffect, useMemo } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
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
  const {
    budgets,
    expenses,
    loadBudgets,
    subscribeToBudgets,
    unsubscribeFromBudgets
  } = useCoupleStore()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (session?.couple?.id) {
      loadBudgets(session.couple.id)
      subscribeToBudgets(session.couple.id)

      return () => {
        unsubscribeFromBudgets()
      }
    }
  }, [session?.couple?.id, loadBudgets, subscribeToBudgets, unsubscribeFromBudgets])

  // Calculate top 3 most used categories from last 30 days, or use first 3 custom/default categories
  const quickAddCategories = useMemo(() => {
    // Get custom category names or default names
    const customCategories = session?.couple?.custom_categories || DEFAULT_CATEGORIES.map(c => c.name)

    // If no budgets, just use first 3 custom/default categories
    if (budgets.length === 0) {
      return customCategories.slice(0, 3)
    }

    // Get budget categories (these use custom names if set)
    const budgetCategories = budgets.map(b => b.category)

    // Filter expenses to last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentExpenses = expenses.filter(exp => {
      const expenseDate = new Date(exp.created_at)
      return expenseDate >= thirtyDaysAgo
    })

    // Count usage by category (only for categories with budgets)
    const categoryCount = new Map<string, number>()
    recentExpenses.forEach(exp => {
      if (budgetCategories.includes(exp.category)) {
        categoryCount.set(exp.category, (categoryCount.get(exp.category) || 0) + 1)
      }
    })

    // Sort by usage count and take top 3
    const topCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)

    // If we don't have 3 categories from usage data, fill with remaining budget categories
    if (topCategories.length < 3) {
      const remainingCategories = budgetCategories.filter(cat => !topCategories.includes(cat))
      return [...topCategories, ...remainingCategories].slice(0, 3)
    }

    return topCategories
  }, [budgets, expenses, session?.couple?.custom_categories])

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

  // Get category details with emoji (handles custom category names and custom emoji selections)
  const getCategoryDetails = (name: string) => {
    // Check if user has selected a custom emoji for this category
    const customEmojiMap = session?.couple?.custom_category_emojis || {}
    if (customEmojiMap[name]) {
      return {
        name,
        emoji: customEmojiMap[name]
      }
    }

    // Check custom categories by index
    const customCategories = session?.couple?.custom_categories || []
    if (customCategories.length > 0) {
      const customIndex = customCategories.indexOf(name)
      if (customIndex !== -1 && DEFAULT_CATEGORIES[customIndex]) {
        return {
          name,
          emoji: DEFAULT_CATEGORIES[customIndex].emoji
        }
      }
    }

    // Fall back to DEFAULT_CATEGORIES lookup
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
