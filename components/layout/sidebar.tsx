'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, List, BarChart3, LayoutDashboard, Share2, TrendingUp, User, LogOut, Newspaper, Menu, X, HelpCircle, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LogoIcon, LogoFull } from '@/components/ui/logo'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { useOnboarding } from '@/components/onboarding/onboarding-provider'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', key: '1' },
  { href: '/finance', icon: TrendingUp, label: 'Finance', key: '2' },
  { href: '/recherche', icon: Search, label: 'Recherche', key: '3' },
  { href: '/annonces', icon: List, label: 'Annonces', key: '4' },
  { href: '/stats', icon: BarChart3, label: 'Statistiques', key: '5' },
  { href: '/clients', icon: Users, label: 'Clients', key: '6' },
  { href: '/partages', icon: Share2, label: 'Partages', key: '7' },
  { href: '/blog', icon: Newspaper, label: 'Blog', key: '8' },
  { href: '/parametres/facturation', icon: CreditCard, label: 'Facturation', key: '9' },
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
  const { completed: onboardingDone, progress, reopenPanel } = useOnboarding()

  const Avatar = () => (
    profile?.avatar_url ? (
      <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-white/[0.08]" />
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
      {/* ── Desktop sidebar — glassmorphism ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-16 flex-col bg-[#0a0d14]/80 backdrop-blur-xl border-r border-white/[0.06] z-40">
        {/* Logo */}
        <div className="flex items-center justify-center h-14 border-b border-white/[0.06]">
          <LogoIcon className="w-8 h-8" />
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
                  'relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-orange-500/15 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r-full -ml-px"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <item.icon className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2.5 py-1.5 text-xs bg-[#0d1117]/95 backdrop-blur-sm text-gray-200 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/[0.08] transition-opacity z-50 shadow-lg">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom: Mon compte + Logout */}
        <div className="flex flex-col items-center gap-1 pb-3 border-t border-white/[0.06] pt-3">
          <Link
            href="/compte"
            title={`${displayName || 'Mon compte'} (0)`}
            className={cn(
              'relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200',
              isCompteActive
                ? 'bg-orange-500/15 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
            )}
          >
            {isCompteActive && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r-full -ml-px"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <Avatar />
            <span className="absolute left-full ml-2 px-2.5 py-1.5 text-xs bg-[#0d1117]/95 backdrop-blur-sm text-gray-200 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/[0.08] transition-opacity z-50 shadow-lg">
              {displayName || 'Mon compte'}
            </span>
          </Link>

          {/* Guide de démarrage */}
          <button
            onClick={reopenPanel}
            title="Guide de démarrage"
            className={cn(
              'group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200',
              onboardingDone
                ? 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.04]'
                : 'text-orange-400/70 hover:text-orange-400 hover:bg-orange-500/10'
            )}
          >
            <HelpCircle className="w-5 h-5" />
            {!onboardingDone && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            )}
            <span className="absolute left-full ml-2 px-2.5 py-1.5 text-xs bg-[#0d1117]/95 backdrop-blur-sm text-gray-200 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/[0.08] transition-opacity z-50 shadow-lg">
              Guide de démarrage {!onboardingDone ? `(${progress.length}/6)` : ''}
            </span>
          </button>

          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="group relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2.5 py-1.5 text-xs bg-[#0d1117]/95 backdrop-blur-sm text-gray-200 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/[0.08] transition-opacity z-50 shadow-lg">
              Se déconnecter
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile hamburger button ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 flex items-center justify-center w-10 h-10 rounded-lg bg-[#0a0d14]/80 backdrop-blur-xl border border-white/[0.08] text-gray-300 shadow-lg"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer — glassmorphism ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="md:hidden fixed top-0 left-0 h-full w-64 bg-[#0a0d14]/90 backdrop-blur-2xl border-r border-white/[0.06] z-50 flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-white/[0.06]">
              <LogoFull className="h-7" />
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
              {NAV_ITEMS.map((item, i) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                        isActive
                          ? 'bg-orange-500/15 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* Drawer bottom */}
            <div className="flex flex-col gap-1 p-3 border-t border-white/[0.06]">
              <Link
                href="/compte"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                  isCompteActive
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                )}
              >
                <Avatar />
                <span className="truncate">{displayName || 'Mon compte'}</span>
              </Link>
              <button
                onClick={() => { setIsOpen(false); reopenPanel() }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm w-full text-left',
                  onboardingDone
                    ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                    : 'text-orange-400/80 hover:text-orange-400 hover:bg-orange-500/10'
                )}
              >
                <HelpCircle className="w-4 h-4 flex-shrink-0" />
                Guide de démarrage {!onboardingDone ? `(${progress.length}/6)` : ''}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full text-left"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
