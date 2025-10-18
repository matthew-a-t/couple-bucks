import { supabase } from '@/lib/supabase'
import type { Couple, CoupleInsert, CoupleUpdate, AccountType, SplitType } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Couples Service
 * Handles couple relationship operations including creation, pairing, and settings management
 */

// Generate a random invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoiding confusing characters
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const couplesService = {
  /**
   * Create a new couple (initiated by user1)
   */
  async createCouple(
    userId: string,
    accountType: AccountType,
    defaultSplitType: SplitType,
    trackIncome: boolean,
    customCategories?: string[],
    quickAddButtons?: string[]
  ): Promise<Couple> {
    const inviteCode = generateInviteCode()
    const inviteExpiresAt = new Date()
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7) // 7 days expiry

    const coupleData: CoupleInsert = {
      user1_id: userId,
      user2_id: null,
      account_type: accountType,
      default_split_type: defaultSplitType,
      track_income: trackIncome,
      survey_status: 'draft',
      survey_completed_by_user1_at: null,
      survey_approved_by_user2_at: null,
      custom_categories: customCategories || [
        'Groceries',
        'Dining Out',
        'Transportation',
        'Utilities',
        'Entertainment',
        'Shopping',
        'Healthcare',
        'Household',
        'Pets',
        'Other'
      ],
      quick_add_buttons: quickAddButtons || ['Groceries', 'Dining Out', 'Gas', 'Coffee'],
      invite_code: inviteCode,
      invite_expires_at: inviteExpiresAt.toISOString(),
      is_paired: false
    }

    const { data, error } = await supabase
      .from('couples')
      .insert(coupleData)
      .select()
      .single()

    if (error) throw error

    // Update user's profile with couple_id
    await supabase
      .from('profiles')
      .update({ couple_id: data.id })
      .eq('id', userId)

    return data
  },

  /**
   * Join a couple using invite code (user2)
   */
  async joinCouple(userId: string, inviteCode: string): Promise<Couple> {
    // Find couple by invite code
    const { data: couple, error: findError } = await supabase
      .from('couples')
      .select('*')
      .eq('invite_code', inviteCode)
      .single()

    if (findError) {
      if (findError.code === 'PGRST116') {
        throw new Error('Invalid invite code')
      }
      throw findError
    }

    // Check if invite is expired
    if (couple.invite_expires_at && new Date(couple.invite_expires_at) < new Date()) {
      throw new Error('Invite code has expired')
    }

    // Check if already paired
    if (couple.is_paired) {
      throw new Error('This couple is already complete')
    }

    // Update user's profile with couple_id (this will trigger the couple paired status via trigger)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ couple_id: couple.id })
      .eq('id', userId)

    if (updateError) throw updateError

    // Get updated couple
    const { data: updatedCouple, error: fetchError } = await supabase
      .from('couples')
      .select('*')
      .eq('id', couple.id)
      .single()

    if (fetchError) throw fetchError

    return updatedCouple
  },

  /**
   * Get couple by ID
   */
  async getCouple(coupleId: string): Promise<Couple | null> {
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .eq('id', coupleId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  },

  /**
   * Update couple settings
   */
  async updateCouple(coupleId: string, updates: CoupleUpdate): Promise<Couple> {
    const { data, error } = await supabase
      .from('couples')
      .update(updates)
      .eq('id', coupleId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update custom categories
   */
  async updateCategories(coupleId: string, categories: string[]): Promise<Couple> {
    return this.updateCouple(coupleId, { custom_categories: categories })
  },

  /**
   * Update quick-add buttons
   */
  async updateQuickAddButtons(coupleId: string, buttons: string[]): Promise<Couple> {
    return this.updateCouple(coupleId, { quick_add_buttons: buttons })
  },

  /**
   * Regenerate invite code
   */
  async regenerateInviteCode(coupleId: string): Promise<Couple> {
    const inviteCode = generateInviteCode()
    const inviteExpiresAt = new Date()
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7)

    return this.updateCouple(coupleId, {
      invite_code: inviteCode,
      invite_expires_at: inviteExpiresAt.toISOString()
    })
  },

  /**
   * Check if user is part of a couple
   */
  async isUserPaired(userId: string): Promise<boolean> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('couple_id')
      .eq('id', userId)
      .single()

    if (error) throw error
    return profile.couple_id !== null
  },

  /**
   * Get couple members (both profiles)
   */
  async getCoupleMembers(coupleId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('couple_id', coupleId)

    if (error) throw error
    return data
  },

  /**
   * Subscribe to real-time couple updates
   * Returns a channel that must be unsubscribed when component unmounts
   */
  subscribeToCoupleChanges(
    coupleId: string,
    onUpdate: (couple: Couple) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`couple-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${coupleId}`
        },
        (payload) => {
          onUpdate(payload.new as Couple)
        }
      )
      .subscribe()

    return channel
  },

  /**
   * Subscribe to partner profile updates
   * Useful for detecting when partner completes onboarding
   */
  subscribeToPartnerUpdates(
    partnerId: string,
    onUpdate: (profile: any) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`partner-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${partnerId}`
        },
        (payload) => {
          onUpdate(payload.new)
        }
      )
      .subscribe()

    return channel
  },

  /**
   * Save survey answers as draft (User 1 in progress)
   */
  async saveSurveyDraft(
    coupleId: string,
    accountType: AccountType,
    defaultSplitType: SplitType,
    trackIncome: boolean
  ): Promise<Couple> {
    return this.updateCouple(coupleId, {
      account_type: accountType,
      default_split_type: defaultSplitType,
      track_income: trackIncome,
      survey_status: 'draft'
    })
  },

  /**
   * Mark survey as completed by User 1 (ready for User 2 review)
   */
  async completeSurveyByUser1(coupleId: string): Promise<Couple> {
    return this.updateCouple(coupleId, {
      survey_status: 'pending_review',
      survey_completed_by_user1_at: new Date().toISOString()
    })
  },

  /**
   * Update survey answers (User 2 reviews and modifies)
   */
  async updateSurveyAnswers(
    coupleId: string,
    accountType?: AccountType,
    defaultSplitType?: SplitType,
    trackIncome?: boolean,
    quickAddButtons?: string[]
  ): Promise<Couple> {
    const updates: CoupleUpdate = {}

    if (accountType !== undefined) updates.account_type = accountType
    if (defaultSplitType !== undefined) updates.default_split_type = defaultSplitType
    if (trackIncome !== undefined) updates.track_income = trackIncome
    if (quickAddButtons !== undefined) updates.quick_add_buttons = quickAddButtons

    return this.updateCouple(coupleId, updates)
  },

  /**
   * Approve survey and finalize onboarding (User 2 completes review)
   */
  async approveSurvey(coupleId: string): Promise<Couple> {
    return this.updateCouple(coupleId, {
      survey_status: 'approved',
      survey_approved_by_user2_at: new Date().toISOString()
    })
  },

  /**
   * Unsubscribe from a real-time channel
   */
  async unsubscribe(channel: RealtimeChannel): Promise<void> {
    await supabase.removeChannel(channel)
  }
}
