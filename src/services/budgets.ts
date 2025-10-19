import { supabase } from '@/lib/supabase'
import type { Budget, BudgetInsert, BudgetUpdate } from '@/types/database'
import type { BudgetWithProgress } from '@/types'
import { calculateBudgetStatus, DEFAULT_CATEGORIES } from '@/types'

/**
 * Budgets Service
 * Handles all budget operations including creation, updates, and progress tracking
 */

export const budgetsService = {
  /**
   * Create a new budget
   */
  async createBudget(budgetData: BudgetInsert): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .insert(budgetData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create budget with category and limit
   */
  async createBudgetForCategory(
    coupleId: string,
    category: string,
    limitAmount: number
  ): Promise<Budget> {
    // Check if this is a custom category (not in DEFAULT_CATEGORIES)
    const isDefaultCategory = DEFAULT_CATEGORIES.some((cat) => cat.name === category)

    if (!isDefaultCategory) {
      // Get current couple data
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('custom_categories')
        .eq('id', coupleId)
        .single()

      if (coupleError) throw coupleError

      // Add category to custom_categories if not already there
      const customCategories = couple?.custom_categories || []
      if (!customCategories.includes(category)) {
        const { error: updateError } = await supabase
          .from('couples')
          .update({ custom_categories: [...customCategories, category] })
          .eq('id', coupleId)

        if (updateError) throw updateError
      }
    }

    // Get start of current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Calculate current spending for this category (current month only)
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('couple_id', coupleId)
      .eq('category', category)
      .gte('created_at', startOfMonth)

    if (expensesError) throw expensesError

    const currentSpent = expenses
      ? expenses.reduce((total, expense) => total + Number(expense.amount), 0)
      : 0

    return this.createBudget({
      couple_id: coupleId,
      category,
      limit_amount: limitAmount,
      current_spent: currentSpent,
      last_reset_at: new Date().toISOString()
    })
  },

  /**
   * Get all budgets for a couple
   */
  async getCoupleBudgets(coupleId: string): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('couple_id', coupleId)
      .order('category')

    if (error) throw error
    return data
  },

  /**
   * Get budgets with progress calculation
   */
  async getCoupleBudgetsWithProgress(coupleId: string): Promise<BudgetWithProgress[]> {
    const budgets = await this.getCoupleBudgets(coupleId)

    // Get start of current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Get expenses for this couple from the current month only
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('category, amount, created_at')
      .eq('couple_id', coupleId)
      .gte('created_at', startOfMonth)

    if (expensesError) throw expensesError

    // Calculate spending by category (current month only)
    const spendingByCategory: Record<string, number> = {}
    if (expenses) {
      expenses.forEach((expense) => {
        const category = expense.category
        const amount = Number(expense.amount)
        spendingByCategory[category] = (spendingByCategory[category] || 0) + amount
      })
    }

    return budgets.map((budget) => {
      // Use actual spending from current month expenses
      const actualSpent = spendingByCategory[budget.category] || 0
      const remaining = Number(budget.limit_amount) - actualSpent
      const percentage = (actualSpent / Number(budget.limit_amount)) * 100
      const status = calculateBudgetStatus(actualSpent, Number(budget.limit_amount))

      return {
        ...budget,
        limit_amount: Number(budget.limit_amount),
        current_spent: actualSpent, // Current month spending only
        remaining,
        percentage,
        status
      }
    })
  },

  /**
   * Get a single budget by ID
   */
  async getBudget(budgetId: string): Promise<Budget | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  },

  /**
   * Get budget by category
   */
  async getBudgetByCategory(coupleId: string, category: string): Promise<Budget | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('category', category)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  },

  /**
   * Update a budget
   */
  async updateBudget(budgetId: string, updates: BudgetUpdate): Promise<Budget> {
    // If category is being updated, check if it's custom and add to couple's categories
    if (updates.category) {
      const isDefaultCategory = DEFAULT_CATEGORIES.some((cat) => cat.name === updates.category)

      if (!isDefaultCategory) {
        // Get the budget to find couple_id
        const { data: budget, error: budgetError } = await supabase
          .from('budgets')
          .select('couple_id')
          .eq('id', budgetId)
          .single()

        if (budgetError) throw budgetError

        // Get current couple data
        const { data: couple, error: coupleError } = await supabase
          .from('couples')
          .select('custom_categories')
          .eq('id', budget.couple_id)
          .single()

        if (coupleError) throw coupleError

        // Add category to custom_categories if not already there
        const customCategories = couple?.custom_categories || []
        if (!customCategories.includes(updates.category)) {
          const { error: updateError } = await supabase
            .from('couples')
            .update({ custom_categories: [...customCategories, updates.category] })
            .eq('id', budget.couple_id)

          if (updateError) throw updateError
        }
      }
    }

    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', budgetId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update budget limit
   */
  async updateBudgetLimit(budgetId: string, newLimit: number): Promise<Budget> {
    return this.updateBudget(budgetId, { limit_amount: newLimit })
  },

  /**
   * Delete a budget
   */
  async deleteBudget(budgetId: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', budgetId)

    if (error) throw error
  },

  /**
   * Recalculate budget spending from expenses
   */
  async recalculateBudgetSpending(budgetId: string): Promise<Budget> {
    // Get budget
    const budget = await this.getBudget(budgetId)
    if (!budget) throw new Error('Budget not found')

    // Get start of current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Get all expenses for this category from current month
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('couple_id', budget.couple_id)
      .eq('category', budget.category)
      .gte('created_at', startOfMonth)

    if (error) throw error

    const currentSpent = expenses
      ? expenses.reduce((total, expense) => total + Number(expense.amount), 0)
      : 0

    return this.updateBudget(budgetId, { current_spent: currentSpent })
  },

  /**
   * Reset budget spending (start new period)
   */
  async resetBudget(budgetId: string): Promise<Budget> {
    return this.updateBudget(budgetId, {
      current_spent: 0,
      last_reset_at: new Date().toISOString()
    })
  },

  /**
   * Increment budget spending (called when expense is created)
   */
  async incrementBudgetSpending(coupleId: string, category: string, amount: number): Promise<void> {
    const budget = await this.getBudgetByCategory(coupleId, category)

    if (budget) {
      const newSpent = Number(budget.current_spent) + amount
      await this.updateBudget(budget.id, { current_spent: newSpent })
    }
  },

  /**
   * Decrement budget spending (called when expense is deleted)
   */
  async decrementBudgetSpending(coupleId: string, category: string, amount: number): Promise<void> {
    const budget = await this.getBudgetByCategory(coupleId, category)

    if (budget) {
      const newSpent = Math.max(0, Number(budget.current_spent) - amount)
      await this.updateBudget(budget.id, { current_spent: newSpent })
    }
  },

  /**
   * Check if budget threshold is exceeded
   */
  async checkBudgetThreshold(coupleId: string, category: string, threshold: number): Promise<boolean> {
    const budget = await this.getBudgetByCategory(coupleId, category)

    if (!budget) return false

    const percentage = (Number(budget.current_spent) / Number(budget.limit_amount)) * 100
    return percentage >= threshold
  },

  /**
   * Subscribe to budget changes for real-time updates
   */
  subscribeToBudgets(coupleId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`budgets:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `couple_id=eq.${coupleId}`
        },
        callback
      )
      .subscribe()
  }
}
