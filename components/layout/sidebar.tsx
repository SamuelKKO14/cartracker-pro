'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Car, Users, Search, List, BarChart3, CalendarDays, Share2, TrendingUp, User, LogOut, Newspaper } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

const NAV_ITEMS = [
  { href: '/dashboard', icon: CalendarDays, label: 'Ma journée', key: '1' },
  { href: '/clients', icon: Users, label: 'Clients', key: '2' },
  { href: '/recherche', icon: Search, label: 'Recherche', key: '3' },
  { href: '/annonces', icon: List, label: 'Annonces', key: '4' },
  { href: '/stats', icon: BarChart3, label: 'Statistiques', key: '5' },
  { href: '/partages', icon: Share2, label: 'Partages', key: '6' },
  { href: '/finance', icon: TrendingUp, label: 'Finance', key: '7' },
  { href: '/blog', icon: Newspaper, label: 'Blog', key: '8' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data as Profile)
    }
    fetchProfile()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const displayName = profile?.full_name || userEmail
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.charAt(0).toUpperCase()

  const isCompteActive = pathname.startsWith('/compte')

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
              <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-[#1a1f2e] text-gray-200 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-[#2a2f3e] transition-opacity z-50">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Mon compte + Logout */}
      <div className="flex flex-col items-center gap-1 pb-3">
        {/* Mon compte */}
        <Link
          href="/compte"
          title={`${displayName || 'Mon compte'} (9)`}
          className={cn(
            'relative group flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
            isCompteActive
              ? 'bg-orange-500/15 text-orange-400'
              : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1f2e]'
          )}
        >
          {isCompteActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r-full -ml-px" />
          )}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-7 h-7 rounded-full object-cover ring-1 ring-[#2a2f3e]"
            />
          ) : initials ? (
            <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-[11px] font-bold text-orange-400">
              {initials}
            </div>
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-[#1a1f2e] text-gray-200 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-[#2a2f3e] transition-opacity z-50">
            {displayName || 'Mon compte'}
          </span>
        </Link>

        {/* Logout */}
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
