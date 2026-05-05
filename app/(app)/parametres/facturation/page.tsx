'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, Crown, Building2, Zap, Loader2 } from 'lucide-react'

interface Subscription {
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_end: string | null
}

export default function FacturationPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end, cancel_at_period_end, trial_end')
        .eq('user_id', user.id)
        .single()

      setSub(data as Subscription | null)
      setLoading(false)
    }
    load()
  }, [])

  const plan = sub?.plan || 'starter'
  const status = sub?.status || 'active'

  const trialDaysLeft = sub?.trial_end
    ? Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  async function handleCheckout(priceId: string) {
    setRedirecting(priceId)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setRedirecting(null)
  }

  async function handlePortal() {
    setRedirecting('portal')
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setRedirecting(null)
  }

  const statusBadge = {
    active: { label: 'Actif', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    trialing: { label: 'Essai gratuit', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    past_due: { label: 'Paiement en retard', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    canceled: { label: 'Résilié', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    incomplete: { label: 'Incomplet', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  }[status] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Facturation</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez votre abonnement CarTracker Pro</p>
        </div>

        {/* Plan actuel */}
        <div className="rounded-xl border border-[#1a1f2e] bg-[#0a0d14] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
                {plan === 'agence' ? <Building2 className="w-5 h-5 text-orange-400" /> :
                 plan === 'pro' ? <Crown className="w-5 h-5 text-orange-400" /> :
                 <Zap className="w-5 h-5 text-orange-400" />}
              </div>
              <div>
                <p className="font-semibold text-gray-100 capitalize">Plan {plan}</p>
                <p className="text-xs text-gray-500">
                  {plan === 'starter' ? 'Gratuit — 10 annonces, 5 clients' :
                   plan === 'pro' ? '49€/mois — Tout illimité' :
                   '99€/mois — Tout illimité + multi-users'}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>

          {status === 'trialing' && trialDaysLeft > 0 && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-300">
              Période d&apos;essai : <strong>{trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''}</strong>
            </div>
          )}

          {sub?.cancel_at_period_end && sub.current_period_end && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-300">
              Votre abonnement se termine le{' '}
              <strong>{new Date(sub.current_period_end).toLocaleDateString('fr-FR')}</strong>
            </div>
          )}

          {status === 'past_due' && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              Votre paiement a échoué. Veuillez mettre à jour votre moyen de paiement.
            </div>
          )}

          {(plan === 'pro' || plan === 'agence') && (
            <button
              onClick={handlePortal}
              disabled={redirecting === 'portal'}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1f2e] hover:bg-[#2a2f3e] text-sm text-gray-200 font-medium transition-colors disabled:opacity-50"
            >
              {redirecting === 'portal' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Gérer mon abonnement
            </button>
          )}
        </div>

        {/* Upgrade cards si Starter */}
        {plan === 'starter' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pro */}
            <div className="rounded-xl border border-orange-500/30 bg-[#0a0d14] p-6 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-orange-400" />
                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Pro</p>
                </div>
                <div className="flex items-end gap-1">
                  <p className="text-3xl font-extrabold text-gray-100">49€</p>
                  <p className="text-gray-500 text-sm mb-0.5">/mois</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">14 jours d&apos;essai gratuit</p>
              </div>
              <ul className="space-y-2 flex-1 mb-5 text-sm text-gray-300">
                {['Annonces illimitées', 'Clients illimités', 'Extension Chrome', 'Gamos IA', 'Stats & Finance'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!)}
                disabled={!!redirecting}
                className="w-full px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm text-white font-semibold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(249,115,22,0.35)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {redirecting === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Passer au Pro
              </button>
            </div>

            {/* Agence */}
            <div className="rounded-xl border border-[#1a1f2e] bg-[#0a0d14] p-6 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Agence</p>
                </div>
                <div className="flex items-end gap-1">
                  <p className="text-3xl font-extrabold text-gray-100">99€</p>
                  <p className="text-gray-500 text-sm mb-0.5">/mois</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Pour les équipes</p>
              </div>
              <ul className="space-y-2 flex-1 mb-5 text-sm text-gray-400">
                {['Tout le Plan Pro', '3 utilisateurs', 'Support prioritaire', 'Rapports automatiques'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCE!)}
                disabled={!!redirecting}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2a2f3e] text-sm text-gray-300 hover:border-[#3a3f4e] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {redirecting === process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCE ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Passer à Agence
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
