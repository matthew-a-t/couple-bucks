import { supabase } from '@/lib/supabase'
import type { Budget, BudgetInsert, BudgetUpdate, BudgetHistory, BudgetHistoryInsert } from '@/types/database'
import type { BudgetWithProgress } from '@/types'
import { calculateBudgetStatus, DEFAULT_CATEGORIES, MAX_CATEGORIES } from '@/types'

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
        // Check if we're at the max category limit
        if (customCategories.length >= MAX_CATEGORIES) {
          throw new Error(`Maximum of ${MAX_CATEGORIES} categories allowed. Please delete a category before adding a new one.`)
        }

        const { error: updateError } = await supabase
          .from('couples')
          .update({ custom_categories: [...customCategories, category] })
          .eq('id', coupleId)

        if (updateError) throw updateError
      }
    }

    // Get start of current month
    const now = new Date()
    const periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodStartISO = periodStartDate.toISOString()

    // Calculate current spending for this category (current month only)
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('couple_id', coupleId)
      .eq('category', category)
      .gte('created_at', periodStartISO)

    if (expensesError) throw expensesError

    const currentSpent = expenses
      ? expenses.reduce((total, expense) => total + Number(expense.amount), 0)
      : 0

    return this.createBudget({
      couple_id: coupleId,
      category,
      limit_amount: limitAmount,
      current_spent: currentSpent,
      period_type: 'monthly',
      period_start_date: periodStartDate.toISOString().split('T')[0], // YYYY-MM-DD format
      auto_reset_enabled: true,
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
   * Uses period_start_date from each budget to calculate spending for the current period
   */
  async getCoupleBudgetsWithProgress(coupleId: string): Promise<BudgetWithProgress[]> {
    const budgets = await this.getCoupleBudgets(coupleId)

    if (budgets.length === 0) return []

    // Get the earliest period start date to fetch all relevant expenses
    const earliestPeriodStart = budgets.reduce((earliest, budget) => {
      const budgetStart = new Date(budget.period_start_date || budget.last_reset_at)
      return budgetStart < earliest ? budgetStart : earliest
    }, new Date())

    // Get expenses for this couple from the earliest period start
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('category, amount, created_at')
      .eq('couple_id', coupleId)
      .gte('created_at', earliestPeriodStart.toISOString())

    if (expensesError) throw expensesError

    return budgets.map((budget) => {
      // Use period_start_date if available, fallback to last_reset_at
      const periodStart = new Date(budget.period_start_date || budget.last_reset_at)

      // Calculate spending for this budget's category within its period
      const actualSpent = expenses
        ? expenses
            .filter(
              (expense) =>
                expense.category === budget.category &&
                new Date(expense.created_at) >= periodStart
            )
            .reduce((total, expense) => total + Number(expense.amount), 0)
        : 0

      const remaining = Number(budget.limit_amount) - actualSpent
      const percentage = (actualSpent / Number(budget.limit_amount)) * 100
      const status = calculateBudgetStatus(actualSpent, Number(budget.limit_amount))

      return {
        ...budget,
        limit_amount: Number(budget.limit_amount),
        current_spent: actualSpent, // Period spending
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
   * Updates period_start_date to current month and resets spending
   */
  async resetBudget(budgetId: string): Promise<Budget> {
    const now = new Date()
    const periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1)

    return this.updateBudget(budgetId, {
      current_spent: 0,
      period_start_date: periodStartDate.toISOString().split('T')[0], // YYYY-MM-DD format
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
   * Archive a budget period to history
   * Called before resetting a budget to preserve historical data
   */
  async archiveBudgetPeriod(budgetId: string): Promise<BudgetHistory> {
    const budget = await this.getBudget(budgetId)
    if (!budget) throw new Error('Budget not found')

    // Get period start and end dates
    const periodStart = budget.period_start_date || budget.last_reset_at.split('T')[0]
    const periodEnd = new Date()
    periodEnd.setDate(periodEnd.getDate() - 1) // Yesterday (last day of previous period)
    const periodEndStr = periodEnd.toISOString().split('T')[0]

    // Get expenses count for this period
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id')
      .eq('couple_id', budget.couple_id)
      .eq('category', budget.category)
      .gte('created_at', new Date(periodStart).toISOString())
      .lte('created_at', periodEnd.toISOString())

    if (expensesError) throw expensesError

    const expensesCount = expenses?.length || 0
    const totalSpent = Number(budget.current_spent)
    const limitAmount = Number(budget.limit_amount)
    const status = calculateBudgetStatus(totalSpent, limitAmount)

    const historyData: BudgetHistoryInsert = {
      budget_id: budget.id,
      couple_id: budget.couple_id,
      period_start: periodStart,
      period_end: periodEndStr,
      category: budget.category,
      limit_amount: limitAmount,
      total_spent: totalSpent,
      expenses_count: expensesCount,
      status
    }

    const { data, error } = await supabase
      .from('budget_history')
      .insert(historyData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Reset all monthly budgets for a couple (auto-reset logic)
   * Archives current period and starts new period
   */
  async resetMonthlyBudgets(coupleId: string): Promise<void> {
    const budgets = await this.getCoupleBudgets(coupleId)
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    for (const budget of budgets) {
      // Check if budget period is in the past (needs reset)
      const budgetPeriodStart = new Date(budget.period_start_date || budget.last_reset_at)
      const budgetMonth = budgetPeriodStart.getMonth()
      const budgetYear = budgetPeriodStart.getFullYear()
      const currentMonth = currentMonthStart.getMonth()
      const currentYear = currentMonthStart.getFullYear()

      // If budget is from a previous month, reset it
      if (budgetYear < currentYear || (budgetYear === currentYear && budgetMonth < currentMonth)) {
        // Archive the previous period
        try {
          await this.archiveBudgetPeriod(budget.id)
        } catch (error) {
          // Ignore duplicate archive errors (budget already archived)
          if (error instanceof Error && !error.message.includes('duplicate')) {
            throw error
          }
        }

        // Reset the budget for new period
        await this.resetBudget(budget.id)
      }
    }
  },

  /**
   * Get budget history for a specific budget
   */
  async getBudgetHistory(budgetId: string, limit: number = 12): Promise<BudgetHistory[]> {
    const { data, error } = await supabase
      .from('budget_history')
      .select('*')
      .eq('budget_id', budgetId)
      .order('period_start', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Get budget history for all budgets in a couple
   */
  async getCoupleBudgetHistory(coupleId: string, limit: number = 12): Promise<BudgetHistory[]> {
    const { data, error } = await supabase
      .from('budget_history')
      .select('*')
      .eq('couple_id', coupleId)
      .order('period_start', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Check if budgets need monthly reset and trigger it
   * Call this when user accesses budgets page
   */
  async checkAndResetMonthlyBudgets(coupleId: string): Promise<boolean> {
    const budgets = await this.getCoupleBudgets(coupleId)
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Check if any budget needs reset
    const needsReset = budgets.some((budget) => {
      const budgetPeriodStart = new Date(budget.period_start_date || budget.last_reset_at)
      return budgetPeriodStart < currentMonthStart
    })

    if (needsReset) {
      await this.resetMonthlyBudgets(coupleId)
      return true
    }

    return false
  },

  /**
   * Get budgets for a specific month/year period
   * Returns current budgets if month is current, otherwise fetches from history
   */
  async getBudgetsForMonth(
    coupleId: string,
    month: number, // 0-11 (JavaScript month)
    year: number
  ): Promise<BudgetWithProgress[]> {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // If requesting current month, return live budgets
    if (month === currentMonth && year === currentYear) {
      return this.getCoupleBudgetsWithProgress(coupleId)
    }

    // Otherwise, fetch from budget history
    const periodStart = new Date(year, month, 1)
    const periodEnd = new Date(year, month + 1, 0) // Last day of month
    const periodStartStr = periodStart.toISOString().split('T')[0]
    const periodEndStr = periodEnd.toISOString().split('T')[0]

    const { data: historyRecords, error } = await supabase
      .from('budget_history')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('period_start', periodStartStr)
      .lte('period_end', periodEndStr)

    if (error) throw error

    // Transform history records to BudgetWithProgress format
    // Group by budget_id to get the most recent history record for each budget
    const budgetMap = new Map<string, BudgetHistory>()
    historyRecords?.forEach((record) => {
      const existing = budgetMap.get(record.budget_id)
      if (!existing || new Date(record.period_start) > new Date(existing.period_start)) {
        budgetMap.set(record.budget_id, record)
      }
    })

    return Array.from(budgetMap.values()).map((history) => {
      const spent = Number(history.total_spent)
      const limit = Number(history.limit_amount)
      const remaining = limit - spent
      const percentage = (spent / limit) * 100

      return {
        id: history.budget_id,
        couple_id: history.couple_id,
        category: history.category,
        limit_amount: limit,
        current_spent: spent,
        remaining,
        percentage,
        status: history.status,
        period_type: 'monthly' as const,
        period_start_date: history.period_start,
        auto_reset_enabled: true,
        last_reset_at: history.period_start,
        created_at: history.created_at,
        updated_at: history.created_at
      }
    })
  },

  /**
   * Get expenses for a specific month/year period
   */
  async getExpensesForMonth(
    coupleId: string,
    month: number, // 0-11 (JavaScript month)
    year: number
  ) {
    const periodStart = new Date(year, month, 1)
    const periodEnd = new Date(year, month + 1, 0, 23, 59, 59) // Last second of month
    const periodStartISO = periodStart.toISOString()
    const periodEndISO = periodEnd.toISOString()

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('created_at', periodStartISO)
      .lte('created_at', periodEndISO)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
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
