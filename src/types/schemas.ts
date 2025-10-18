import { z } from 'zod'

// =============================================
// AUTH SCHEMAS
// =============================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Please enter your full name')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

// =============================================
// ONBOARDING SCHEMAS
// =============================================

export const onboardingSurveySchema = z.object({
  accountType: z.enum(['joint', 'separate', 'mixed'], {
    required_error: 'Please select how you manage finances'
  }),
  splitMethod: z.enum(['fifty_fifty', 'proportional', 'custom', 'single_payer'], {
    required_error: 'Please select how you split expenses'
  }),
  trackIncome: z.boolean().default(false)
})

export const permissionTierSchema = z.object({
  permissionTier: z.enum(['logger', 'manager'], {
    required_error: 'Please select your involvement level'
  })
})

export const quickAddButtonsSchema = z.object({
  buttons: z.array(z.string()).min(4, 'Select at least 4 categories').max(6, 'Select at most 6 categories')
})

export const inviteCodeSchema = z.object({
  inviteCode: z.string().min(6, 'Invalid invite code').max(20, 'Invalid invite code')
})

// =============================================
// EXPENSE SCHEMAS
// =============================================

export const expenseFormSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number'
    }),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().optional(),
  split_type: z.enum(['fifty_fifty', 'proportional', 'custom', 'single_payer']),
  split_percentage_user1: z.number().min(0).max(100).optional(),
  split_percentage_user2: z.number().min(0).max(100).optional()
}).refine((data) => {
  if (data.split_type === 'custom') {
    return (
      data.split_percentage_user1 !== undefined &&
      data.split_percentage_user2 !== undefined &&
      data.split_percentage_user1 + data.split_percentage_user2 === 100
    )
  }
  return true
}, {
  message: 'Split percentages must add up to 100',
  path: ['split_percentage_user1']
})

// =============================================
// BUDGET SCHEMAS
// =============================================

export const budgetFormSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  limit_amount: z.string()
    .min(1, 'Limit amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Limit must be a positive number'
    })
})

// =============================================
// BILL SCHEMAS
// =============================================

export const billFormSchema = z.object({
  name: z.string().min(1, 'Bill name is required').max(100, 'Name is too long'),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number'
    }),
  category: z.string().min(1, 'Please select a category'),
  due_date: z.string().min(1, 'Due date is required'),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'annual', 'custom']),
  custom_frequency_days: z.number().min(1).optional(),
  split_type: z.enum(['fifty_fifty', 'proportional', 'custom', 'single_payer']),
  split_percentage_user1: z.number().min(0).max(100).optional(),
  split_percentage_user2: z.number().min(0).max(100).optional(),
  reminder_days: z.number().min(0).max(30).default(3)
}).refine((data) => {
  if (data.frequency === 'custom') {
    return data.custom_frequency_days !== undefined && data.custom_frequency_days > 0
  }
  return true
}, {
  message: 'Custom frequency days is required for custom frequency',
  path: ['custom_frequency_days']
}).refine((data) => {
  if (data.split_type === 'custom') {
    return (
      data.split_percentage_user1 !== undefined &&
      data.split_percentage_user2 !== undefined &&
      data.split_percentage_user1 + data.split_percentage_user2 === 100
    )
  }
  return true
}, {
  message: 'Split percentages must add up to 100',
  path: ['split_percentage_user1']
})

// =============================================
// PROFILE/SETTINGS SCHEMAS
// =============================================

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long')
})

export const notificationPreferencesSchema = z.object({
  notifications_enabled: z.boolean(),
  bill_reminder_days: z.number().min(0).max(30),
  budget_alert_threshold: z.number().min(0).max(100)
})

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name is too long')
})

// =============================================
// TYPE EXPORTS
// =============================================

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type OnboardingSurveyData = z.output<typeof onboardingSurveySchema>
export type PermissionTierData = z.infer<typeof permissionTierSchema>
export type QuickAddButtonsData = z.infer<typeof quickAddButtonsSchema>
export type InviteCodeData = z.infer<typeof inviteCodeSchema>
export type ExpenseFormData = z.infer<typeof expenseFormSchema>
export type BudgetFormData = z.infer<typeof budgetFormSchema>
export type BillFormData = z.output<typeof billFormSchema>
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>
export type NotificationPreferencesData = z.infer<typeof notificationPreferencesSchema>
export type CategoryFormData = z.infer<typeof categoryFormSchema>
