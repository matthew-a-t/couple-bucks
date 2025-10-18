import { supabase } from '@/lib/supabase'
import type { Bill, BillInsert, BillUpdate, BillFrequency } from '@/types/database'
import type { BillWithStatus } from '@/types'
import { calculateBillStatus } from '@/types'

/**
 * Bills Service
 * Handles all bill operations including creation, updates, and status tracking
 */

export const billsService = {
  /**
   * Create a new bill
   */
  async createBill(billData: BillInsert): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .insert(billData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get all bills for a couple
   */
  async getCoupleBills(coupleId: string, includeInactive = false): Promise<Bill[]> {
    let query = supabase
      .from('bills')
      .select('*')
      .eq('couple_id', coupleId)

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    query = query.order('due_date')

    const { data, error } = await query

    if (error) throw error
    return data
  },

  /**
   * Get bills with status calculation
   */
  async getCoupleBillsWithStatus(coupleId: string, includeInactive = false): Promise<BillWithStatus[]> {
    const bills = await this.getCoupleBills(coupleId, includeInactive)

    return bills.map((bill) => {
      const { status, days } = calculateBillStatus(bill.due_date)

      return {
        ...bill,
        amount: Number(bill.amount),
        days_until_due: days,
        status
      }
    })
  },

  /**
   * Get bills grouped by status
   */
  async getBillsGroupedByStatus(coupleId: string) {
    const billsWithStatus = await this.getCoupleBillsWithStatus(coupleId)

    const overdue = billsWithStatus.filter((bill) => bill.status === 'overdue')
    const dueSoon = billsWithStatus.filter((bill) => bill.status === 'due_soon')
    const upcoming = billsWithStatus.filter((bill) => bill.status === 'upcoming')

    return {
      overdue,
      dueSoon,
      upcoming
    }
  },

  /**
   * Get upcoming bills (next N bills)
   */
  async getUpcomingBills(coupleId: string, limit = 3): Promise<BillWithStatus[]> {
    const billsWithStatus = await this.getCoupleBillsWithStatus(coupleId)

    // Filter to only upcoming or due soon, sort by days until due
    return billsWithStatus
      .filter((bill) => bill.status !== 'overdue')
      .sort((a, b) => a.days_until_due - b.days_until_due)
      .slice(0, limit)
  },

  /**
   * Get a single bill by ID
   */
  async getBill(billId: string): Promise<Bill | null> {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  },

  /**
   * Update a bill
   */
  async updateBill(billId: string, updates: BillUpdate): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .update(updates)
      .eq('id', billId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Mark bill as paid
   */
  async markBillAsPaid(billId: string, paidDate?: string): Promise<Bill> {
    const bill = await this.getBill(billId)
    if (!bill) throw new Error('Bill not found')

    const paymentDate = paidDate || new Date().toISOString().split('T')[0]

    // Calculate next due date based on frequency
    const nextDueDate = this.calculateNextDueDate(bill.due_date, bill.frequency, bill.custom_frequency_days)

    return this.updateBill(billId, {
      last_paid_date: paymentDate,
      due_date: nextDueDate
    })
  },

  /**
   * Calculate next due date based on frequency
   */
  calculateNextDueDate(
    currentDueDate: string,
    frequency: BillFrequency,
    customDays?: number | null
  ): string {
    const current = new Date(currentDueDate)

    switch (frequency) {
      case 'weekly':
        current.setDate(current.getDate() + 7)
        break
      case 'monthly':
        current.setMonth(current.getMonth() + 1)
        break
      case 'quarterly':
        current.setMonth(current.getMonth() + 3)
        break
      case 'annual':
        current.setFullYear(current.getFullYear() + 1)
        break
      case 'custom':
        if (customDays) {
          current.setDate(current.getDate() + customDays)
        }
        break
    }

    return current.toISOString().split('T')[0]
  },

  /**
   * Delete a bill
   */
  async deleteBill(billId: string): Promise<void> {
    const { error } = await supabase.from('bills').delete().eq('id', billId)

    if (error) throw error
  },

  /**
   * Deactivate a bill (soft delete)
   */
  async deactivateBill(billId: string): Promise<Bill> {
    return this.updateBill(billId, { is_active: false })
  },

  /**
   * Reactivate a bill
   */
  async reactivateBill(billId: string): Promise<Bill> {
    return this.updateBill(billId, { is_active: true })
  },

  /**
   * Get bills due within N days
   */
  async getBillsDueWithinDays(coupleId: string, days: number): Promise<Bill[]> {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('is_active', true)
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', futureDate.toISOString().split('T')[0])
      .order('due_date')

    if (error) throw error
    return data
  },

  /**
   * Get bills by category
   */
  async getBillsByCategory(coupleId: string, category: string): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('category', category)
      .order('due_date')

    if (error) throw error
    return data
  },

  /**
   * Subscribe to bill changes for real-time updates
   */
  subscribeToBills(coupleId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`bills:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills',
          filter: `couple_id=eq.${coupleId}`
        },
        callback
      )
      .subscribe()
  }
}
