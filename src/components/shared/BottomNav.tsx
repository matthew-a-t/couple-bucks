import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { Home, Receipt, PiggyBank, Calendar, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export const BottomNav = () => {
  const location = useLocation()
  const session = useAuthStore((state) => state.session)
  const isManager = session?.profile.permission_tier === 'manager'

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/bills', icon: Calendar, label: 'Bills' },
    ...(isManager ? [{ path: '/budgets', icon: PiggyBank, label: 'Budgets' }] : []),
    ...(isManager ? [{ path: '/reports', icon: BarChart3, label: 'Reports' }] : []),
    { path: '/settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl border border-border/50 px-4 py-3 backdrop-blur-sm bg-white/95">
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          {navItems.map((item) => {
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
    </nav>
  )
}
