import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { Home, ClipboardCheck, PiggyBank, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export const BottomNav = () => {
  const location = useLocation()
  const session = useAuthStore((state) => state.session)

  // Safely extract permission_tier with fallback to 'logger' (database default)
  const permissionTier = session?.profile?.permission_tier || 'logger'
  const isManager = permissionTier === 'manager'
  const isPaired = session?.couple?.is_paired ?? false

  // Debug logging for permission tier issues
  if (session && !session.profile?.permission_tier) {
    console.warn('[BottomNav] User session exists but permission_tier is undefined/null. Using fallback "logger":', {
      userId: session.user?.id,
      profileId: session.profile?.id,
      permissionTier: session.profile?.permission_tier,
      fallbackUsed: permissionTier
    })
  }

  // Separate home from other nav items
  // Bills tab is visible for all users (Logger can view, Manager can manage)
  const sideNavItems = [
    { path: '/review', icon: ClipboardCheck, label: 'Review' },
    { path: '/budgets', icon: PiggyBank, label: 'Budget' },
    { path: '/bills', icon: Calendar, label: 'Bills' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ]

  const isHomeActive = location.pathname === '/dashboard'

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4">
      <div className="relative max-w-[90rem] mx-auto">
        {/* Large Home Button - Centered and Elevated */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 sm:-top-8 z-10">
          <Link
            to="/dashboard"
            className={cn(
              'flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95',
              isHomeActive
                ? 'bg-accent'
                : 'bg-white'
            )}
          >
            <Home
              className={cn(
                'w-8 h-8 sm:w-10 sm:h-10 transition-colors',
                isHomeActive ? 'text-white stroke-[2.5]' : 'text-muted-foreground'
              )}
            />
          </Link>
        </div>

        {/* Navigation Bar */}
        <div className="bg-white rounded-3xl shadow-2xl px-2 sm:px-4 py-3 backdrop-blur-sm bg-white/95 relative z-0">
          <div className="flex items-center justify-around gap-1">
            {sideNavItems.slice(0, 2).map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              const isDisabled = !isPaired

              return (
                <Link
                  key={item.path}
                  to={isDisabled ? '#' : item.path}
                  onClick={(e) => isDisabled && e.preventDefault()}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-all duration-200',
                    isDisabled && 'cursor-not-allowed opacity-40'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-200',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : isDisabled
                        ? 'text-muted-foreground/50'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}>
                    <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', isActive && 'stroke-[2.5]')} />
                  </div>
                  <span className={cn('text-[10px] sm:text-xs', isActive && 'font-semibold text-primary', !isActive && 'text-muted-foreground')}>
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* Spacer for center home button */}
            <div className="w-16 sm:w-20" />

            {sideNavItems.slice(2).map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              const isDisabled = !isPaired && item.path !== '/settings'

              return (
                <Link
                  key={item.path}
                  to={isDisabled ? '#' : item.path}
                  onClick={(e) => isDisabled && e.preventDefault()}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-all duration-200',
                    isDisabled && 'cursor-not-allowed opacity-40'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-200',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : isDisabled
                        ? 'text-muted-foreground/50'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}>
                    <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', isActive && 'stroke-[2.5]')} />
                  </div>
                  <span className={cn('text-[10px] sm:text-xs', isActive && 'font-semibold text-primary', !isActive && 'text-muted-foreground')}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
