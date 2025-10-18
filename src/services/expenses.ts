import { supabase } from '@/lib/supabase'
import type { Expense, ExpenseInsert, ExpenseUpdate, SplitType } from '@/types/database'
import type { ExpenseWithUser } from '@/types'

/**
 * Expenses Service
 * Handles all expense CRUD operations and real-time subscriptions
 */

export const expensesService = {
  /**
   * Create a new expense
   */
  async createExpense(expenseData: ExpenseInsert): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create expense with automatic split percentages
   */
  async createExpenseWithSplit(
    coupleId: string,
    userId: string,
    amount: number,
    category: string,
    splitType: SplitType,
    description?: string,
    receiptUrl?: string,
    customSplitUser1?: number,
    customSplitUser2?: number
  ): Promise<Expense> {
    let splitPercentageUser1 = 50
    let splitPercentageUser2 = 50

    switch (splitType) {
      case 'fifty_fifty':
        splitPercentageUser1 = 50
        splitPercentageUser2 = 50
        break
      case 'single_payer':
        // Determine which user is paying
        const { data: couple } = await supabase
          .from('couples')
          .select('user1_id, user2_id')
          .eq('id', coupleId)
          .single()

        if (couple && userId === couple.user1_id) {
          splitPercentageUser1 = 100
          splitPercentageUser2 = 0
        } else {
          splitPercentageUser1 = 0
          splitPercentageUser2 = 100
        }
        break
      case 'custom':
        if (customSplitUser1 !== undefined && customSplitUser2 !== undefined) {
          splitPercentageUser1 = customSplitUser1
          splitPercentageUser2 = customSplitUser2
        }
        break
      case 'proportional':
        // For proportional, you would get income from profiles and calculate
        // For now, default to 50/50 - can be enhanced later
        splitPercentageUser1 = 50
        splitPercentageUser2 = 50
        break
    }

    return this.createExpense({
      couple_id: coupleId,
      created_by: userId,
      amount,
      category,
      description: description || null,
      split_type: splitType,
      split_percentage_user1: splitPercentageUser1,
      split_percentage_user2: splitPercentageUser2,
      receipt_url: receiptUrl || null,
      bill_id: null
    })
  },

  /**
   * Get all expenses for a couple
   */
  async getCoupleExpenses(coupleId: string, limit?: number): Promise<Expense[]> {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  /**
   * Get expenses with user information
   */
  async getCoupleExpensesWithUsers(coupleId: string, limit?: number): Promise<ExpenseWithUser[]> {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        profiles:created_by (
          full_name
        )
      `)
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform data to match ExpenseWithUser type
    return data.map((expense: any) => ({
      ...expense,
      created_by_name: expense.profiles?.full_name || null
    }))
  },

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(coupleId: string, category: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get expenses by date range
   */
  async getExpensesByDateRange(
    coupleId: string,
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get a single expense by ID
   */
  async getExpense(expenseId: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  },

  /**
   * Update an expense
   */
  async updateExpense(expenseId: string, updates: ExpenseUpdate): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (error) throw error
  },

  /**
   * Get total spending for a couple
   */
  async getTotalSpending(coupleId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('expenses')
      .select('amount')
      .eq('couple_id', coupleId)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return data.reduce((total, expense) => total + Number(expense.amount), 0)
  },

  /**
   * Get spending by category
   */
  async getSpendingByCategory(
    coupleId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, number>> {
    let query = supabase
      .from('expenses')
      .select('category, amount')
      .eq('couple_id', coupleId)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const categoryTotals: Record<string, number> = {}

    data.forEach((expense) => {
      const category = expense.category
      const amount = Number(expense.amount)

      if (categoryTotals[category]) {
        categoryTotals[category] += amount
      } else {
        categoryTotals[category] = amount
      }
    })

    return categoryTotals
  },

  /**
   * Subscribe to expense changes for real-time updates
   */
  subscribeToExpenses(
    coupleId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`expenses:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `couple_id=eq.${coupleId}`
        },
        callback
      )
      .subscribe()
  }
}
