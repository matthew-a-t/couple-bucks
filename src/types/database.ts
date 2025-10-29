// Database types matching Supabase schema
// Auto-generated types can be created with: supabase gen types typescript --project-id your-project-id

export type PermissionTier = 'logger' | 'manager'
export type SplitType = 'fifty_fifty' | 'proportional' | 'custom' | 'single_payer'
export type AccountType = 'joint' | 'separate' | 'mixed'
export type BillFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom'
export type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly'
export type BudgetPeriodType = 'monthly'
export type SurveyStatus = 'draft' | 'pending_review' | 'approved'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  permission_tier: PermissionTier
  couple_id: string | null
  onboarding_completed: boolean

  // Notification preferences
  notifications_enabled: boolean
  bill_reminder_days: number
  budget_alert_threshold: number

  created_at: string
  updated_at: string
}

export interface Couple {
  id: string

  // User references
  user1_id: string
  user2_id: string | null

  // Onboarding survey responses
  account_type: AccountType
  default_split_type: SplitType
  track_income: boolean

  // Survey status tracking
  survey_status: SurveyStatus
  survey_completed_by_user1_at: string | null
  survey_approved_by_user2_at: string | null

  // Custom categories (JSON array)
  custom_categories: string[]

  // Custom category emojis (JSON object mapping category name to emoji)
  custom_category_emojis: Record<string, string> | null

  // Quick-add buttons (JSON array of category names)
  quick_add_buttons: string[]

  // Partner invitation
  invite_code: string | null
  invite_expires_at: string | null
  is_paired: boolean

  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  couple_id: string
  created_by: string

  // Expense details
  amount: number
  category: string
  description: string | null

  // Split information
  split_type: SplitType
  split_percentage_user1: number
  split_percentage_user2: number

  // Receipt
  receipt_url: string | null

  // Bill association
  bill_id: string | null

  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  couple_id: string

  // Budget details
  category: string
  limit_amount: number

  // Period tracking
  period_type: BudgetPeriodType
  period_start_date: string // ISO date string (YYYY-MM-DD)
  auto_reset_enabled: boolean

  // Current period tracking (calculated or denormalized)
  current_spent: number
  last_reset_at: string // Kept for backward compatibility, use period_start_date instead

  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  couple_id: string

  // Bill details
  name: string
  amount: number
  category: string

  // Recurrence
  due_date: string
  frequency: BillFrequency
  custom_frequency_days: number | null

  // Split information
  split_type: SplitType
  split_percentage_user1: number
  split_percentage_user2: number

  // Reminder settings
  reminder_days: number

  // Status
  is_active: boolean
  last_paid_date: string | null

  created_at: string
  updated_at: string
}

export interface Income {
  id: string
  profile_id: string
  couple_id: string

  // Income details
  amount: number
  source_name: string
  frequency: IncomeFrequency
  is_primary: boolean

  created_at: string
  updated_at: string
}

export interface BudgetHistory {
  id: string
  budget_id: string
  couple_id: string

  // Period information
  period_start: string // ISO date string (YYYY-MM-DD)
  period_end: string // ISO date string (YYYY-MM-DD)

  // Budget snapshot
  category: string
  limit_amount: number
  total_spent: number
  expenses_count: number

  // Status at period end
  status: 'success' | 'warning' | 'error'

  created_at: string
}

// Insert types (for creating new records)
export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
export type CoupleInsert = Omit<Couple, 'id' | 'created_at' | 'updated_at'>
export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at'>
export type BudgetInsert = Omit<Budget, 'id' | 'created_at' | 'updated_at'>
export type BillInsert = Omit<Bill, 'id' | 'created_at' | 'updated_at'>
export type IncomeInsert = Omit<Income, 'id' | 'created_at' | 'updated_at'>
export type BudgetHistoryInsert = Omit<BudgetHistory, 'id' | 'created_at'>

// Update types (for updating records, all fields optional except id)
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
export type CoupleUpdate = Partial<Omit<Couple, 'id' | 'created_at' | 'updated_at'>>
export type ExpenseUpdate = Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>
export type BudgetUpdate = Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at'>>
export type BillUpdate = Partial<Omit<Bill, 'id' | 'created_at' | 'updated_at'>>
export type IncomeUpdate = Partial<Omit<Income, 'id' | 'created_at' | 'updated_at'>>
