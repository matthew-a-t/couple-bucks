import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { Home, ClipboardCheck, PiggyBank, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export const BottomNav = () => {
  const location = useLocation()
  const session = useAuthStore((state) => state.session)
  const isManager = session?.profile.permission_tier === 'manager'

  // Separate home from other nav items
  const sideNavItems = [
    { path: '/review', icon: ClipboardCheck, label: 'Review' },
    { path: '/budgets', icon: PiggyBank, label: 'Budget' },
    ...(isManager ? [{ path: '/bills', icon: Calendar, label: 'Bills' }] : []),
    { path: '/settings', icon: Settings, label: 'Settings' }
  ]

  const isHomeActive = location.pathname === '/dashboard'

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4">
      <div className="relative max-w-[90rem] mx-auto">
        {/* Large Home Button - Centered and Elevated */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-10">
          <Link
            to="/dashboard"
            className={cn(
              'flex items-center justify-center w-20 h-20 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95',
              isHomeActive
                ? 'bg-gradient-to-br from-primary to-secondary'
                : 'bg-white'
            )}
          >
            <Home
              className={cn(
                'w-10 h-10 transition-colors',
                isHomeActive ? 'text-white stroke-[2.5]' : 'text-muted-foreground'
              )}
            />
          </Link>
        </div>

        {/* Navigation Bar */}
        <div className="bg-white rounded-3xl shadow-2xl border border-border/50 px-4 py-3 backdrop-blur-sm bg-white/95 relative z-0">
          <div className="flex items-center justify-around">
            {sideNavItems.slice(0, 2).map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 px-3 min-w-[60px] transition-all duration-200 rounded-2xl',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className={cn('h-6 w-6', isActive && 'stroke-[2.5]')} />
                  <span className={cn('text-xs', isActive && 'font-semibold')}>
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* Spacer for center home button */}
            <div className="w-20" />

            {sideNavItems.slice(2).map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 px-3 min-w-[60px] transition-all duration-200 rounded-2xl',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className={cn('h-6 w-6', isActive && 'stroke-[2.5]')} />
                  <span className={cn('text-xs', isActive && 'font-semibold')}>
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
