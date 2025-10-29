// Shared types and interfaces for the application

export * from './database'

// Category with emoji icon
export interface Category {
  name: string
  emoji: string
  color?: string
}

// Maximum number of categories allowed per couple
export const MAX_CATEGORIES = 20

// Default predefined categories
export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Groceries', emoji: '🛒', color: '#48bb78' },
  { name: 'Dining Out', emoji: '🍽️', color: '#f56565' },
  { name: 'Transportation', emoji: '🚗', color: '#4299e1' },
  { name: 'Entertainment', emoji: '🎬', color: '#a78bfa' },
  { name: 'Shopping', emoji: '🛍️', color: '#667eea' },
  { name: 'Healthcare', emoji: '🏥', color: '#f56565' },
  { name: 'Household', emoji: '🏠', color: '#48bb78' },
  { name: 'Pets', emoji: '🐾', color: '#764ba2' },
  { name: 'Other', emoji: '📦', color: '#718096' }
]

// Onboarding survey response
export interface OnboardingSurvey {
  accountType: 'joint' | 'separate' | 'mixed'
  splitMethod: 'fifty_fifty' | 'proportional' | 'custom' | 'single_payer'
  trackIncome: boolean
  user1Income?: number
  user1IncomeFrequency?: 'weekly' | 'biweekly' | 'monthly'
  user2Income?: number
  user2IncomeFrequency?: 'weekly' | 'biweekly' | 'monthly'
}

// Expense with user info (for display)
export interface ExpenseWithUser {
  id: string
  couple_id: string
  created_by: string
  created_by_name: string | null
  amount: number
  category: string
  description: string | null
  split_type: string
  split_percentage_user1: number
  split_percentage_user2: number
  receipt_url: string | null
  created_at: string
  updated_at: string
}

// Budget with progress calculation
export interface BudgetWithProgress {
  id: string
  couple_id: string
  category: string
  limit_amount: number
  current_spent: number
  remaining: number
  percentage: number
  status: 'success' | 'warning' | 'error' // green, yellow, red
  period_type: 'monthly'
  period_start_date: string // ISO date string (YYYY-MM-DD)
  auto_reset_enabled: boolean
  last_reset_at: string // Deprecated, use period_start_date
  created_at: string
  updated_at: string
}

// Bill with status
export interface BillWithStatus {
  id: string
  couple_id: string
  name: string
  amount: number
  category: string
  due_date: string
  frequency: string
  split_type: string
  split_percentage_user1: number
  split_percentage_user2: number
  reminder_days: number
  receipt_url: string | null
  is_active: boolean
  last_paid_date: string | null
  days_until_due: number
  status: 'overdue' | 'due_soon' | 'upcoming'
  created_at: string
  updated_at: string
}

// Bill payment history with user details
export interface BillPaymentHistoryWithDetails {
  id: string
  bill_id: string
  bill_name: string
  couple_id: string
  payment_date: string
  amount_paid: number
  payment_method: string | null
  notes: string | null
  receipt_url: string | null
  period_start: string
  period_end: string
  recorded_by: string
  recorded_by_name: string | null
  created_at: string
}

// User session state
export interface UserSession {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    email: string
    full_name: string | null
    permission_tier: 'logger' | 'manager'
    couple_id: string | null
    onboarding_completed: boolean
  }
  couple: {
    id: string
    user1_id: string
    user2_id: string | null
    is_paired: boolean
    account_type: string
    default_split_type: string
    track_income: boolean
    survey_status: string
    survey_completed_by_user1_at: string | null
    survey_approved_by_user2_at: string | null
    custom_categories: string[]
    custom_category_emojis: Record<string, string> | null
    quick_add_buttons: string[]
    invite_code?: string | null
  } | null
  partner?: PartnerInfo | null
}

// Partner info for display
export interface PartnerInfo {
  id: string
  full_name: string | null
  email: string
  permission_tier: 'logger' | 'manager'
}

// Notification preference
export interface NotificationPreferences {
  enabled: boolean
  bill_reminder_days: number
  budget_alert_threshold: number
}

// Form data types for creating/editing

export interface ExpenseFormData {
  amount: string
  category: string
  description?: string
  split_type: 'fifty_fifty' | 'proportional' | 'custom' | 'single_payer'
  split_percentage_user1?: number
  split_percentage_user2?: number
  receipt?: File | null
}

export interface BudgetFormData {
  category: string
  limit_amount: string
}

export interface BillFormData {
  name: string
  amount: string
  category: string
  due_date: string
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom'
  custom_frequency_days?: number
  split_type: 'fifty_fifty' | 'proportional' | 'custom' | 'single_payer'
  split_percentage_user1?: number
  split_percentage_user2?: number
  reminder_days: number
  receipt?: File | null
}

// Budget status calculation helper
export const calculateBudgetStatus = (spent: number, limit: number): 'success' | 'warning' | 'error' => {
  const percentage = (spent / limit) * 100
  if (percentage < 75) return 'success'
  if (percentage <= 100) return 'warning'
  return 'error'
}

// Bill status calculation helper
export const calculateBillStatus = (dueDate: string): { status: 'overdue' | 'due_soon' | 'upcoming'; days: number } => {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'overdue', days: diffDays }
  } else if (diffDays <= 7) {
    return { status: 'due_soon', days: diffDays }
  } else {
    return { status: 'upcoming', days: diffDays }
  }
}
