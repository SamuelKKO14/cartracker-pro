'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StepId =
  | 'profile'
  | 'first_client'
  | 'first_listing'
  | 'first_margin'
  | 'first_share'
  | 'explore_dashboard'

export const ALL_STEPS: StepId[] = [
  'profile',
  'first_client',
  'first_listing',
  'first_margin',
  'first_share',
  'explore_dashboard',
]

interface OnboardingCtx {
  completed: boolean
  progress: StepId[]
  panelOpen: boolean
  firstName: string | null
  recentlyCompleted: StepId | null
  completeStep: (id: StepId) => Promise<void>
  dismissPanel: () => void
  reopenPanel: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const Ctx = createContext<OnboardingCtx>({
  completed: false,
  progress: [],
  panelOpen: false,
  firstName: null,
  recentlyCompleted: null,
  completeStep: async () => {},
  dismissPanel: () => {},
  reopenPanel: () => {},
})

export function useOnboarding() {
  return useContext(Ctx)
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const [completed, setCompleted] = useState(false)
  const [progress, setProgress] = useState<StepId[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [recentlyCompleted, setRecentlyCompleted] = useState<StepId | null>(null)

  // Keep a ref so the check effect always reads the latest progress without
  // needing it as a dependency (avoids re-triggering on every step completion).
  const progressRef = useRef<StepId[]>([])
  progressRef.current = progress

  const isCheckingRef = useRef(false)
  const initializedRef = useRef(false)

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const res = await fetch('/api/onboarding')
      if (!res.ok) return
      const data: { completed: boolean; progress: StepId[] } = await res.json()

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) {
        setFirstName(profile.full_name.split(' ')[0])
      }

      setCompleted(data.completed)
      setProgress(data.progress ?? [])

      // Show panel on first load if not already completed
      if (!data.completed && !initializedRef.current) {
        setPanelOpen(true)
      }
      initializedRef.current = true
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Complete a step ─────────────────────────────────────────────────────────
  const completeStep = useCallback(async (id: StepId) => {
    setProgress(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      if (ALL_STEPS.every(s => next.includes(s))) {
        setCompleted(true)
        fetch('/api/onboarding', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        })
      }
      return next
    })

    // Sparkle animation
    setRecentlyCompleted(id)
    setTimeout(() => setRecentlyCompleted(null), 900)

    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_id: id }),
    })
  }, [])

  // ── Auto-check on pathname change ───────────────────────────────────────────
  useEffect(() => {
    if (!userId || completed) return

    async function check() {
      if (isCheckingRef.current) return
      isCheckingRef.current = true

      try {
        const supabase = createClient()
        const cur = progressRef.current
        const toComplete: StepId[] = []

        // profile: full_name AND company_name non-empty
        if (!cur.includes('profile')) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, company_name')
            .eq('id', userId!)
            .single()
          if (data?.full_name && data?.company_name) toComplete.push('profile')
        }

        // first_client
        if (!cur.includes('first_client')) {
          const { count } = await supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId!)
          if ((count ?? 0) > 0) toComplete.push('first_client')
        }

        // first_listing
        if (!cur.includes('first_listing')) {
          const { count } = await supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId!)
          if ((count ?? 0) > 0) toComplete.push('first_listing')
        }

        // first_margin
        if (!cur.includes('first_margin')) {
          const { count } = await supabase
            .from('listing_margins')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId!)
          if ((count ?? 0) > 0) toComplete.push('first_margin')
        }

        // first_share: user has created at least one share
        if (!cur.includes('first_share')) {
          const { count } = await supabase
            .from('client_shares')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId!)
          if ((count ?? 0) > 0) toComplete.push('first_share')
        }

        // explore_dashboard: visiting /dashboard with ≥1 client AND ≥1 listing
        if (!cur.includes('explore_dashboard') && pathname === '/dashboard') {
          const [{ count: cc }, { count: lc }] = await Promise.all([
            supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
            supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
          ])
          if ((cc ?? 0) > 0 && (lc ?? 0) > 0) toComplete.push('explore_dashboard')
        }

        for (const id of toComplete) {
          await completeStep(id)
        }
      } finally {
        isCheckingRef.current = false
      }
    }

    check()
  }, [pathname, userId, completed, completeStep])

  const dismissPanel = useCallback(() => {
    setPanelOpen(false)
    // Persist dismissal so the panel never auto-opens again on future logins
    fetch('/api/onboarding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
  }, [])
  const reopenPanel = useCallback(() => setPanelOpen(true), [])

  return (
    <Ctx.Provider value={{
      completed,
      progress,
      panelOpen,
      firstName,
      recentlyCompleted,
      completeStep,
      dismissPanel,
      reopenPanel,
    }}>
      {children}
    </Ctx.Provider>
  )
}
