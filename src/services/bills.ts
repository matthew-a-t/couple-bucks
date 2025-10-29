import { supabase } from '@/lib/supabase'
import type { Bill, BillInsert, BillUpdate, BillFrequency, BillPaymentHistory, BillPaymentHistoryInsert } from '@/types/database'
import type { BillWithStatus, BillPaymentHistoryWithDetails } from '@/types'
import { calculateBillStatus } from '@/types'
import { storageService } from './storage'

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
   * Now records payment in bill_payment_history for tracking
   * Note: This does NOT create an expense (bills and expenses are separate)
   */
  async markBillAsPaid(
    billId: string,
    userId: string,
    paidDate?: string,
    paymentMethod?: string,
    notes?: string
  ): Promise<{ bill: Bill; payment: BillPaymentHistory }> {
    const bill = await this.getBill(billId)
    if (!bill) throw new Error('Bill not found')

    const paymentDate = paidDate || new Date().toISOString().split('T')[0]

    // Record payment in history
    const payment = await this.recordBillPayment(
      billId,
      bill.couple_id,
      userId,
      Number(bill.amount),
      paymentDate,
      paymentMethod,
      notes
    )

    // Calculate next due date based on frequency
    const nextDueDate = this.calculateNextDueDate(bill.due_date, bill.frequency, bill.custom_frequency_days)

    // Update bill with new due date and last paid date
    const updatedBill = await this.updateBill(billId, {
      last_paid_date: paymentDate,
      due_date: nextDueDate
    })

    return { bill: updatedBill, payment }
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
    const { data, error} = await supabase
      .from('bills')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('category', category)
      .order('due_date')

    if (error) throw error
    return data
  },

  /**
   * Get bills for a specific month/year
   */
  async getBillsForMonth(coupleId: string, year: number, month: number): Promise<BillWithStatus[]> {
    // Get start and end dates for the month
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0) // Last day of month

    const periodStartStr = periodStart.toISOString().split('T')[0]
    const periodEndStr = periodEnd.toISOString().split('T')[0]

    // Get all active bills for the couple
    const bills = await this.getCoupleBills(coupleId, false)

    // Filter bills that are due within this month
    const billsInMonth = bills.filter((bill) => {
      const dueDate = new Date(bill.due_date)
      return dueDate >= periodStart && dueDate <= periodEnd
    })

    // Add status information
    return billsInMonth.map((bill) => {
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
   * Search bills by name
   */
  async searchBills(coupleId: string, searchTerm: string): Promise<BillWithStatus[]> {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('is_active', true)
      .ilike('name', `%${searchTerm}%`)
      .order('due_date')

    if (error) throw error

    return data.map((bill) => {
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
   * Filter bills by multiple criteria
   */
  async filterBills(
    coupleId: string,
    filters: {
      categories?: string[]
      frequencies?: BillFrequency[]
      statuses?: ('overdue' | 'due_soon' | 'upcoming')[]
      includeInactive?: boolean
    }
  ): Promise<BillWithStatus[]> {
    let query = supabase
      .from('bills')
      .select('*')
      .eq('couple_id', coupleId)

    if (!filters.includeInactive) {
      query = query.eq('is_active', true)
    }

    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories)
    }

    if (filters.frequencies && filters.frequencies.length > 0) {
      query = query.in('frequency', filters.frequencies)
    }

    query = query.order('due_date')

    const { data, error } = await query

    if (error) throw error

    // Add status and filter by status if needed
    const billsWithStatus = data.map((bill) => {
      const { status, days } = calculateBillStatus(bill.due_date)
      return {
        ...bill,
        amount: Number(bill.amount),
        days_until_due: days,
        status
      }
    })

    if (filters.statuses && filters.statuses.length > 0) {
      return billsWithStatus.filter((bill) => filters.statuses!.includes(bill.status))
    }

    return billsWithStatus
  },

  /**
   * Get bill statistics for overview
   */
  async getBillStatistics(coupleId: string): Promise<{
    totalMonthly: number
    totalAnnual: number
    activeBillsCount: number
    byFrequency: Record<string, { count: number; total: number }>
    byCategory: Record<string, { count: number; total: number }>
  }> {
    const bills = await this.getCoupleBills(coupleId, false)

    let totalMonthly = 0
    let totalAnnual = 0
    const byFrequency: Record<string, { count: number; total: number }> = {}
    const byCategory: Record<string, { count: number; total: number }> = {}

    bills.forEach((bill) => {
      const amount = Number(bill.amount)

      // Calculate monthly equivalent
      let monthlyEquivalent = 0
      switch (bill.frequency) {
        case 'weekly':
          monthlyEquivalent = amount * 4.33 // Average weeks per month
          break
        case 'monthly':
          monthlyEquivalent = amount
          break
        case 'quarterly':
          monthlyEquivalent = amount / 3
          break
        case 'annual':
          monthlyEquivalent = amount / 12
          break
        case 'custom':
          if (bill.custom_frequency_days) {
            monthlyEquivalent = (amount * 30) / bill.custom_frequency_days
          }
          break
      }

      totalMonthly += monthlyEquivalent
      totalAnnual += monthlyEquivalent * 12

      // Track by frequency
      if (!byFrequency[bill.frequency]) {
        byFrequency[bill.frequency] = { count: 0, total: 0 }
      }
      byFrequency[bill.frequency].count++
      byFrequency[bill.frequency].total += amount

      // Track by category
      if (!byCategory[bill.category]) {
        byCategory[bill.category] = { count: 0, total: 0 }
      }
      byCategory[bill.category].count++
      byCategory[bill.category].total += amount
    })

    return {
      totalMonthly,
      totalAnnual,
      activeBillsCount: bills.length,
      byFrequency,
      byCategory
    }
  },

  /**
   * Upload bill receipt
   */
  async uploadBillReceipt(file: File, coupleId: string, billId: string): Promise<string> {
    return storageService.uploadReceipt(file, coupleId, billId)
  },

  /**
   * Update bill receipt
   */
  async updateBillReceipt(
    file: File,
    coupleId: string,
    billId: string,
    oldReceiptUrl?: string
  ): Promise<string> {
    return storageService.updateReceipt(file, coupleId, billId, oldReceiptUrl)
  },

  /**
   * Record a bill payment in history
   */
  async recordBillPayment(
    billId: string,
    coupleId: string,
    userId: string,
    amountPaid: number,
    paymentDate?: string,
    paymentMethod?: string,
    notes?: string,
    receiptUrl?: string
  ): Promise<BillPaymentHistory> {
    const bill = await this.getBill(billId)
    if (!bill) throw new Error('Bill not found')

    const payment = paymentDate || new Date().toISOString().split('T')[0]

    // Calculate period for this payment based on bill frequency
    const periodStart = new Date(payment)
    const periodEnd = new Date(this.calculateNextDueDate(payment, bill.frequency, bill.custom_frequency_days))

    const paymentData: BillPaymentHistoryInsert = {
      bill_id: billId,
      couple_id: coupleId,
      payment_date: payment,
      amount_paid: amountPaid,
      payment_method: paymentMethod || null,
      notes: notes || null,
      receipt_url: receiptUrl || null,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      recorded_by: userId
    }

    const { data, error } = await supabase
      .from('bill_payment_history')
      .insert(paymentData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get payment history for a bill
   */
  async getBillPaymentHistory(billId: string, limit?: number): Promise<BillPaymentHistoryWithDetails[]> {
    let query = supabase
      .from('bill_payment_history')
      .select(
        `
        *,
        bills!inner(name),
        profiles!bill_payment_history_recorded_by_fkey(full_name)
      `
      )
      .eq('bill_id', billId)
      .order('payment_date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map((payment: any) => ({
      id: payment.id,
      bill_id: payment.bill_id,
      bill_name: payment.bills?.name || 'Unknown Bill',
      couple_id: payment.couple_id,
      payment_date: payment.payment_date,
      amount_paid: Number(payment.amount_paid),
      payment_method: payment.payment_method,
      notes: payment.notes,
      receipt_url: payment.receipt_url,
      period_start: payment.period_start,
      period_end: payment.period_end,
      recorded_by: payment.recorded_by,
      recorded_by_name: payment.profiles?.full_name || null,
      created_at: payment.created_at
    }))
  },

  /**
   * Get all payment history for a couple
   */
  async getCouplePaymentHistory(coupleId: string, limit?: number): Promise<BillPaymentHistoryWithDetails[]> {
    let query = supabase
      .from('bill_payment_history')
      .select(
        `
        *,
        bills!inner(name),
        profiles!bill_payment_history_recorded_by_fkey(full_name)
      `
      )
      .eq('couple_id', coupleId)
      .order('payment_date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map((payment: any) => ({
      id: payment.id,
      bill_id: payment.bill_id,
      bill_name: payment.bills?.name || 'Unknown Bill',
      couple_id: payment.couple_id,
      payment_date: payment.payment_date,
      amount_paid: Number(payment.amount_paid),
      payment_method: payment.payment_method,
      notes: payment.notes,
      receipt_url: payment.receipt_url,
      period_start: payment.period_start,
      period_end: payment.period_end,
      recorded_by: payment.recorded_by,
      recorded_by_name: payment.profiles?.full_name || null,
      created_at: payment.created_at
    }))
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
  },

  /**
   * Subscribe to bill payment history for real-time updates
   */
  subscribeToBillPaymentHistory(coupleId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`bill_payment_history:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bill_payment_history',
          filter: `couple_id=eq.${coupleId}`
        },
        callback
      )
      .subscribe()
  }
}
