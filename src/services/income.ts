import { supabase } from '@/lib/supabase'
import type { Income, IncomeInsert, IncomeUpdate, IncomeFrequency } from '@/types/database'

/**
 * Income Service
 * Handles all income-related operations including CRUD and split calculations
 */

export const incomeService = {
  /**
   * Create a new income record
   */
  async createIncome(incomeData: IncomeInsert): Promise<Income> {
    const { data, error } = await supabase
      .from('incomes')
      .insert(incomeData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get income for a specific profile
   */
  async getIncomeForProfile(profileId: string): Promise<Income[]> {
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('profile_id', profileId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching incomes for profile:', profileId, error)
      throw error
    }
    return data || []
  },

  /**
   * Get primary income for a profile (most recent primary income)
   */
  async getPrimaryIncomeForProfile(profileId: string): Promise<Income | null> {
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_primary', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Get all incomes for a couple (both partners)
   */
  async getCoupleIncomes(coupleId: string): Promise<Income[]> {
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('couple_id', coupleId)
      .order('profile_id', { ascending: true })
      .order('is_primary', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Update an income record
   */
  async updateIncome(incomeId: string, updates: IncomeUpdate): Promise<Income> {
    const { data, error } = await supabase
      .from('incomes')
      .update(updates)
      .eq('id', incomeId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete an income record
   */
  async deleteIncome(incomeId: string): Promise<void> {
    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', incomeId)

    if (error) throw error
  },

  /**
   * Normalize income to monthly amount
   * Converts weekly/biweekly income to monthly equivalent
   */
  calculateMonthlyIncome(amount: number, frequency: IncomeFrequency): number {
    switch (frequency) {
      case 'weekly':
        // 52 weeks / 12 months = ~4.33 weeks per month
        return amount * 4.333333
      case 'biweekly':
        // 26 pay periods / 12 months = ~2.17 pay periods per month
        return amount * 2.166667
      case 'monthly':
        return amount
      default:
        return amount
    }
  },

  /**
   * Calculate proportional split percentages based on couple's income
   * Returns split percentages that total 100
   */
  async calculateProportionalSplit(coupleId: string): Promise<{
    user1Percentage: number
    user2Percentage: number
    user1Income: number
    user2Income: number
    totalIncome: number
  }> {
    // Get couple details to find user IDs
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('user1_id, user2_id')
      .eq('id', coupleId)
      .single()

    if (coupleError) throw coupleError
    if (!couple) throw new Error('Couple not found')

    // Get incomes for both users
    const incomes = await this.getCoupleIncomes(coupleId)

    // Calculate monthly income for each user (sum of all their income sources)
    const user1Incomes = incomes.filter(i => i.profile_id === couple.user1_id)
    const user2Incomes = incomes.filter(i => i.profile_id === couple.user2_id)

    const user1MonthlyIncome = user1Incomes.reduce(
      (total, income) => total + this.calculateMonthlyIncome(income.amount, income.frequency),
      0
    )

    const user2MonthlyIncome = user2Incomes.reduce(
      (total, income) => total + this.calculateMonthlyIncome(income.amount, income.frequency),
      0
    )

    const totalIncome = user1MonthlyIncome + user2MonthlyIncome

    // If no income data, default to 50/50
    if (totalIncome === 0) {
      return {
        user1Percentage: 50,
        user2Percentage: 50,
        user1Income: 0,
        user2Income: 0,
        totalIncome: 0
      }
    }

    // Calculate percentages (rounded to nearest integer)
    const user1Percentage = Math.round((user1MonthlyIncome / totalIncome) * 100)
    const user2Percentage = 100 - user1Percentage // Ensure they sum to exactly 100

    return {
      user1Percentage,
      user2Percentage,
      user1Income: user1MonthlyIncome,
      user2Income: user2MonthlyIncome,
      totalIncome
    }
  },

  /**
   * Check if couple has income tracking enabled
   */
  async hasIncomeTracking(coupleId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('couples')
      .select('track_income')
      .eq('id', coupleId)
      .single()

    if (error) throw error
    return data?.track_income ?? false
  },

  /**
   * Get income summary for display
   */
  async getIncomeSummary(profileId: string): Promise<{
    totalMonthlyIncome: number
    incomeSources: Array<{
      id: string
      source_name: string
      amount: number
      frequency: IncomeFrequency
      monthlyEquivalent: number
      is_primary: boolean
    }>
  }> {
    const incomes = await this.getIncomeForProfile(profileId)

    const incomeSources = incomes.map(income => ({
      id: income.id,
      source_name: income.source_name,
      amount: income.amount,
      frequency: income.frequency,
      monthlyEquivalent: this.calculateMonthlyIncome(income.amount, income.frequency),
      is_primary: income.is_primary
    }))

    const totalMonthlyIncome = incomeSources.reduce(
      (total, source) => total + source.monthlyEquivalent,
      0
    )

    return {
      totalMonthlyIncome,
      incomeSources
    }
  }
}
