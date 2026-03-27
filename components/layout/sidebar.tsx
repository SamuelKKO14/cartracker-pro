'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Car, Users, Search, List, BarChart3, CalendarDays, Share2, TrendingUp, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: CalendarDays, label: 'Ma journée', key: '1' },
  { href: '/clients', icon: Users, label: 'Clients', key: '2' },
  { href: '/recherche', icon: Search, label: 'Recherche', key: '3' },
  { href: '/annonces', icon: List, label: 'Annonces', key: '4' },
  { href: '/stats', icon: BarChart3, label: 'Statistiques', key: '5' },
  { href: '/partages', icon: Share2, label: 'Partages', key: '6' },
  { href: '/finance', icon: TrendingUp, label: 'Finance', key: '7' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-16 flex flex-col bg-[#0a0d14] border-r border-[#1a1f2e] z-40">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-[#1a1f2e]">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
          <Car className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-3">
        {NAV_ITEMS.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={`${item.label} (${item.key})`}
              className={cn(
                'relative group flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                isActive
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1f2e]'
              )}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r-full -ml-px" />}
              <item.icon className="w-5 h-5" />
              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-[#1a1f2e] text-gray-200 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-[#2a2f3e] transition-opacity z-50">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="flex items-center justify-center pb-3">
        <button
          onClick={handleLogout}
          title="Se déconnecter"
          className="group relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-[#1a1f2e] text-gray-200 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-[#2a2f3e] transition-opacity z-50">
            Se déconnecter
          </span>
        </button>
      </div>
    </aside>
  )
}
