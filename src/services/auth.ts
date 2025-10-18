import { supabase } from '@/lib/supabase'
import type { Profile, PermissionTier } from '@/types/database'
import type { UserSession } from '@/types'

/**
 * Authentication Service
 * Handles all authentication operations including signup, login, logout, and session management
 */

export const authService = {
  /**
   * Sign up a new user
   */
  async signup(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (error) throw error
    return data
  },

  /**
   * Sign in an existing user
   */
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  /**
   * Sign out the current user
   */
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    console.log('[Auth] Fetching profile for user:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Auth] Profile fetch error:', error)
      if (error.code === 'PGRST116') {
        console.error('[Auth] PGRST116: No rows returned - profile does not exist')
        return null // No rows returned
      }
      console.error('[Auth] Throwing profile fetch error')
      throw error
    }

    console.log('[Auth] Profile fetched successfully:', data)
    return data
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update permission tier
   */
  async updatePermissionTier(userId: string, tier: PermissionTier) {
    return this.updateProfile(userId, { permission_tier: tier })
  },

  /**
   * Get full user session with profile and couple data
   */
  async getUserSession(): Promise<UserSession | null> {
    console.log('[Auth] Getting user session...')

    const user = await this.getCurrentUser()
    if (!user) {
      console.error('[Auth] No user found')
      return null
    }
    console.log('[Auth] User found:', user.id, user.email)

    const profile = await this.getProfile(user.id)
    if (!profile) {
      console.error('[Auth] No profile found for user:', user.id)
      return null
    }
    console.log('[Auth] Profile found:', profile)

    let couple = null
    if (profile.couple_id) {
      console.log('[Auth] Fetching couple data:', profile.couple_id)
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('id', profile.couple_id)
        .single()

      if (error) {
        console.error('[Auth] Error fetching couple:', error)
      } else if (data) {
        console.log('[Auth] Couple found:', data)
        couple = data
      }
    } else {
      console.log('[Auth] No couple_id, user not paired yet')
    }

    const session = {
      user: {
        id: user.id,
        email: user.email!
      },
      profile,
      couple
    }
    console.log('[Auth] Session created successfully:', session)
    return session
  },

  /**
   * Get partner profile
   */
  async getPartnerProfile(coupleId: string, currentUserId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('couple_id', coupleId)
      .neq('id', currentUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
