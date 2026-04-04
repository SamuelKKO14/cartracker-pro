'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Car, Users, Search, List, BarChart3, LayoutDashboard, Share2, TrendingUp, User, LogOut, Newspaper, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', key: '1' },
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
  const [isOpen, setIsOpen] = useState(false)

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

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

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

  const Avatar = () => (
    profile?.avatar_url ? (
      <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-[#2a2f3e]" />
    ) : initials ? (
      <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-[11px] font-bold text-orange-400">
        {initials}
      </div>
    ) : (
      <User className="w-5 h-5" />
    )
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-16 flex-col bg-[#0a0d14] border-r border-[#1a1f2e] z-40">
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
            <Avatar />
            <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-[#1a1f2e] text-gray-200 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-[#2a2f3e] transition-opacity z-50">
              {displayName || 'Mon compte'}
            </span>
          </Link>

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

      {/* ── Mobile hamburger button ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 flex items-center justify-center w-10 h-10 rounded-lg bg-[#0a0d14] border border-[#1a1f2e] text-gray-300"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile overlay ── */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={cn(
          'md:hidden fixed top-0 left-0 h-full w-64 bg-[#0a0d14] border-r border-[#1a1f2e] z-50 flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#1a1f2e]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <Car className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">CarTracker Pro</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1a1f2e] transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
                  isActive
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1f2e]'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Drawer bottom */}
        <div className="flex flex-col gap-1 p-3 border-t border-[#1a1f2e]">
          <Link
            href="/compte"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
              isCompteActive
                ? 'bg-orange-500/15 text-orange-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1f2e]'
            )}
          >
            <Avatar />
            <span className="truncate">{displayName || 'Mon compte'}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Se déconnecter
          </button>
        </div>
      </div>
    </>
  )
}
