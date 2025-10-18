import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSession, PartnerInfo } from '@/types'
import { authService } from '@/services'

interface AuthState {
  // State
  session: UserSession | null
  partner: PartnerInfo | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  setSession: (session: UserSession | null) => void
  setPartner: (partner: PartnerInfo | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      session: null,
      partner: null,
      isLoading: false,
      isInitialized: false,

      // Set session
      setSession: (session) => set({ session }),

      // Set partner
      setPartner: (partner) => set({ partner }),

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Initialize auth state (called on app load)
      initialize: async () => {
        try {
          set({ isLoading: true })

          const session = await authService.getUserSession()

          if (session) {
            set({ session })

            // Load partner info if user is paired
            if (session.couple && session.couple.is_paired) {
              try {
                const partner = await authService.getPartnerProfile(
                  session.couple.id,
                  session.user.id
                )
                set({ partner })
              } catch (partnerError) {
                console.warn('Failed to load partner info:', partnerError)
                // Continue without partner info
              }
            }
          }

          set({ isInitialized: true })
        } catch (error) {
          console.error('Failed to initialize auth:', error)
          // If session loading fails, log the user out to clear corrupted state
          try {
            await authService.logout()
          } catch (logoutError) {
            console.error('Failed to logout during error recovery:', logoutError)
          }
          // Clear persisted state
          localStorage.removeItem('couple-bucks-auth')
          set({ session: null, partner: null, isInitialized: true })
        } finally {
          set({ isLoading: false })
        }
      },

      // Login
      login: async (email, password) => {
        try {
          set({ isLoading: true })

          await authService.login(email, password)

          // Clear any stale onboarding data from previous sessions
          sessionStorage.removeItem('onboarding_survey')
          sessionStorage.removeItem('onboarding_tier')
          sessionStorage.removeItem('onboarding_quick_add')

          // Wait a bit for the profile to be created by the trigger
          await new Promise(resolve => setTimeout(resolve, 500))

          // Fetch full session with retries
          let session = null
          let retries = 3
          while (retries > 0 && !session) {
            try {
              session = await authService.getUserSession()
              if (session) break
            } catch (err) {
              console.warn('Retry fetching session...', err)
              retries--
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 500))
              }
            }
          }

          if (!session) {
            throw new Error('Failed to load user session. Please try logging in again.')
          }

          set({ session })

          // Load partner if paired
          if (session.couple && session.couple.is_paired) {
            const partner = await authService.getPartnerProfile(
              session.couple.id,
              session.user.id
            )
            set({ partner })
          }
        } catch (error) {
          console.error('Login failed:', error)
          set({ isLoading: false })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Signup
      signup: async (email, password, fullName) => {
        try {
          set({ isLoading: true })

          await authService.signup(email, password, fullName)

          // Auto-login after signup
          await authService.login(email, password)

          // Wait for profile creation
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Fetch session with retries
          let session = null
          let retries = 3
          while (retries > 0 && !session) {
            try {
              session = await authService.getUserSession()
              if (session) break
            } catch (err) {
              console.warn('Retry fetching session after signup...', err)
              retries--
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 500))
              }
            }
          }

          if (!session) {
            throw new Error('Account created but failed to load session. Please try logging in.')
          }

          set({ session })
        } catch (error) {
          console.error('Signup failed:', error)
          set({ isLoading: false })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Logout
      logout: async () => {
        try {
          set({ isLoading: true })
          await authService.logout()
          set({ session: null, partner: null })
        } catch (error) {
          console.error('Logout failed:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Refresh session (useful after profile updates)
      refreshSession: async () => {
        try {
          const session = await authService.getUserSession()
          set({ session })

          // Refresh partner info
          if (session && session.couple && session.couple.is_paired) {
            const partner = await authService.getPartnerProfile(
              session.couple.id,
              session.user.id
            )
            set({ partner })
          }
        } catch (error) {
          console.error('Failed to refresh session:', error)
          throw error
        }
      },

      // Update profile
      updateProfile: async (updates) => {
        try {
          const { session } = get()
          if (!session) throw new Error('No active session')

          console.log('[Auth] Updating profile with:', updates)
          await authService.updateProfile(session.user.id, updates)
          console.log('[Auth] Profile updated successfully')
          await get().refreshSession()
        } catch (error: any) {
          console.error('[Auth] Failed to update profile:', error)
          console.error('[Auth] Update data was:', updates)
          console.error('[Auth] Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          throw error
        }
      }
    }),
    {
      name: 'couple-bucks-auth',
      partialize: (state) => ({
        // Only persist session, not loading states
        session: state.session,
        partner: state.partner
      })
    }
  )
)

// Setup auth state change listener
authService.onAuthStateChange(async (event) => {
  const store = useAuthStore.getState()

  // Only handle SIGNED_OUT event here
  // Login/signup functions handle their own session loading to avoid race conditions
  if (event === 'SIGNED_OUT') {
    // Clear session on sign out
    store.setSession(null)
    store.setPartner(null)
  }
})
