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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 px-3 min-w-[60px] transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
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
