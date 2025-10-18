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
              const partner = await authService.getPartnerProfile(
                session.couple.id,
                session.user.id
              )
              set({ partner })
            }
          }

          set({ isInitialized: true })
        } catch (error) {
          console.error('Failed to initialize auth:', error)
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

          // Fetch full session
          const session = await authService.getUserSession()
          set({ session })

          // Load partner if paired
          if (session && session.couple && session.couple.is_paired) {
            const partner = await authService.getPartnerProfile(
              session.couple.id,
              session.user.id
            )
            set({ partner })
          }
        } catch (error) {
          console.error('Login failed:', error)
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

          // Fetch session
          const session = await authService.getUserSession()
          set({ session })
        } catch (error) {
          console.error('Signup failed:', error)
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

          await authService.updateProfile(session.user.id, updates)
          await get().refreshSession()
        } catch (error) {
          console.error('Failed to update profile:', error)
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
authService.onAuthStateChange(async (event, supabaseSession) => {
  const store = useAuthStore.getState()

  if (event === 'SIGNED_IN' && supabaseSession) {
    // Refresh session on sign in
    await store.refreshSession()
  } else if (event === 'SIGNED_OUT') {
    // Clear session on sign out
    store.setSession(null)
    store.setPartner(null)
  } else if (event === 'TOKEN_REFRESHED' && supabaseSession) {
    // Optionally refresh on token refresh
    await store.refreshSession()
  }
})
