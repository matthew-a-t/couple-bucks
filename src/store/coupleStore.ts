import { create } from 'zustand'
import type { Expense, Bill } from '@/types/database'
import type { ExpenseWithUser, BudgetWithProgress, BillWithStatus } from '@/types'
import { expensesService, budgetsService, billsService } from '@/services'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface CoupleDataState {
  // Expenses
  expenses: ExpenseWithUser[]
  expensesLoading: boolean
  expensesSubscription: RealtimeChannel | null

  // Budgets
  budgets: BudgetWithProgress[]
  budgetsLoading: boolean
  budgetsSubscription: RealtimeChannel | null

  // Bills
  bills: BillWithStatus[]
  billsLoading: boolean
  billsSubscription: RealtimeChannel | null

  // Actions - Expenses
  loadExpenses: (coupleId: string, limit?: number) => Promise<void>
  addExpense: (expense: ExpenseWithUser) => void
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void
  removeExpense: (expenseId: string) => void
  subscribeToExpenses: (coupleId: string) => void
  unsubscribeFromExpenses: () => void

  // Actions - Budgets
  loadBudgets: (coupleId: string) => Promise<void>
  addBudget: (budget: BudgetWithProgress) => void
  updateBudget: (budgetId: string, updates: Partial<BudgetWithProgress>) => void
  removeBudget: (budgetId: string) => void
  subscribeToBudgets: (coupleId: string) => void
  unsubscribeFromBudgets: () => void

  // Actions - Bills
  loadBills: (coupleId: string) => Promise<void>
  addBill: (bill: BillWithStatus) => void
  updateBill: (billId: string, updates: Partial<Bill>) => void
  removeBill: (billId: string) => void
  subscribeToBills: (coupleId: string) => void
  unsubscribeFromBills: () => void

  // Clear all data (on logout)
  clearAll: () => void
}

export const useCoupleStore = create<CoupleDataState>((set, get) => ({
  // Initial state
  expenses: [],
  expensesLoading: false,
  expensesSubscription: null,

  budgets: [],
  budgetsLoading: false,
  budgetsSubscription: null,

  bills: [],
  billsLoading: false,
  billsSubscription: null,

  // ==================== EXPENSES ====================

  loadExpenses: async (coupleId, limit) => {
    try {
      set({ expensesLoading: true })
      const expenses = await expensesService.getCoupleExpensesWithUsers(coupleId, limit)
      set({ expenses })
    } catch (error) {
      console.error('Failed to load expenses:', error)
    } finally {
      set({ expensesLoading: false })
    }
  },

  addExpense: (expense) => {
    set((state) => ({
      expenses: [expense, ...state.expenses]
    }))
  },

  updateExpense: (expenseId, updates) => {
    set((state) => ({
      expenses: state.expenses.map((exp) =>
        exp.id === expenseId ? { ...exp, ...updates } : exp
      )
    }))
  },

  removeExpense: (expenseId) => {
    set((state) => ({
      expenses: state.expenses.filter((exp) => exp.id !== expenseId)
    }))
  },

  subscribeToExpenses: (coupleId) => {
    // Unsubscribe from existing subscription
    get().unsubscribeFromExpenses()

    const subscription = expensesService.subscribeToExpenses(coupleId, (payload) => {
      if (payload.eventType === 'INSERT') {
        // Reload expenses to get user info
        get().loadExpenses(coupleId)
      } else if (payload.eventType === 'UPDATE') {
        get().updateExpense(payload.new.id, payload.new)
      } else if (payload.eventType === 'DELETE') {
        get().removeExpense(payload.old.id)
      }
    })

    set({ expensesSubscription: subscription })
  },

  unsubscribeFromExpenses: () => {
    const { expensesSubscription } = get()
    if (expensesSubscription) {
      expensesSubscription.unsubscribe()
      set({ expensesSubscription: null })
    }
  },

  // ==================== BUDGETS ====================

  loadBudgets: async (coupleId) => {
    try {
      set({ budgetsLoading: true })
      const budgets = await budgetsService.getCoupleBudgetsWithProgress(coupleId)
      set({ budgets })
    } catch (error) {
      console.error('Failed to load budgets:', error)
    } finally {
      set({ budgetsLoading: false })
    }
  },

  addBudget: (budget) => {
    set((state) => ({
      budgets: [...state.budgets, budget]
    }))
  },

  updateBudget: (budgetId, updates) => {
    set((state) => ({
      budgets: state.budgets.map((budget) =>
        budget.id === budgetId ? { ...budget, ...updates } : budget
      )
    }))
  },

  removeBudget: (budgetId) => {
    set((state) => ({
      budgets: state.budgets.filter((budget) => budget.id !== budgetId)
    }))
  },

  subscribeToBudgets: (coupleId) => {
    get().unsubscribeFromBudgets()

    const subscription = budgetsService.subscribeToBudgets(coupleId, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Reload budgets to recalculate progress
        get().loadBudgets(coupleId)
      } else if (payload.eventType === 'DELETE') {
        get().removeBudget(payload.old.id)
      }
    })

    set({ budgetsSubscription: subscription })
  },

  unsubscribeFromBudgets: () => {
    const { budgetsSubscription } = get()
    if (budgetsSubscription) {
      budgetsSubscription.unsubscribe()
      set({ budgetsSubscription: null })
    }
  },

  // ==================== BILLS ====================

  loadBills: async (coupleId) => {
    try {
      set({ billsLoading: true })
      const bills = await billsService.getCoupleBillsWithStatus(coupleId)
      set({ bills })
    } catch (error) {
      console.error('Failed to load bills:', error)
    } finally {
      set({ billsLoading: false })
    }
  },

  addBill: (bill) => {
    set((state) => ({
      bills: [...state.bills, bill]
    }))
  },

  updateBill: (billId, updates) => {
    set((state) => ({
      bills: state.bills.map((bill) =>
        bill.id === billId ? { ...bill, ...updates } : bill
      )
    }))
  },

  removeBill: (billId) => {
    set((state) => ({
      bills: state.bills.filter((bill) => bill.id !== billId)
    }))
  },

  subscribeToBills: (coupleId) => {
    get().unsubscribeFromBills()

    const subscription = billsService.subscribeToBills(coupleId, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Reload bills to recalculate status
        get().loadBills(coupleId)
      } else if (payload.eventType === 'DELETE') {
        get().removeBill(payload.old.id)
      }
    })

    set({ billsSubscription: subscription })
  },

  unsubscribeFromBills: () => {
    const { billsSubscription } = get()
    if (billsSubscription) {
      billsSubscription.unsubscribe()
      set({ billsSubscription: null })
    }
  },

  // ==================== CLEAR ALL ====================

  clearAll: () => {
    // Unsubscribe from all channels
    get().unsubscribeFromExpenses()
    get().unsubscribeFromBudgets()
    get().unsubscribeFromBills()

    // Clear data
    set({
      expenses: [],
      budgets: [],
      bills: []
    })
  }
}))
