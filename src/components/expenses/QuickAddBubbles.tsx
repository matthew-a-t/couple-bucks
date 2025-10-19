import { useState, useEffect, useMemo } from 'react'
import { useAuthStore, useCoupleStore } from '@/store'
import { DEFAULT_CATEGORIES } from '@/types'
import { AddExpenseDialog } from './AddExpenseDialog'

interface QuickAddBubblesProps {
  onExpenseAdded?: () => void
}

export const QuickAddBubbles = ({ onExpenseAdded }: QuickAddBubblesProps) => {
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

  // Calculate top 3 most used budget categories from last 30 days
  const quickAddCategories = useMemo(() => {
    if (budgets.length === 0) {
      return null // No budgets, show skeletons
    }

    // Get budget categories
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
  }, [budgets, expenses])

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

  // Don't render anything if no budgets exist
  if (quickAddCategories === null) {
    return null
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-3">
        {quickAddCategories.map((categoryName) => {
          const category = getCategoryDetails(categoryName)

          return (
            <button
              key={categoryName}
              onClick={() => handleQuickAdd(categoryName)}
              className="group flex items-center gap-3 px-8 py-4 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-border/50 hover:border-primary"
            >
              <span className="text-4xl">{category.emoji}</span>
              <span className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                {category.name}
              </span>
            </button>
          )
        })}
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
