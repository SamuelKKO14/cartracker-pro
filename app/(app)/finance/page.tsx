'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { MarginModal } from '@/components/listings/margin-modal'
import { Pencil, Check, X, Plus, Trash2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import type { Client, Listing, ListingMargin, Goal } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'current' | 'history'
type Period = 'month' | 'prev_month' | 'quarter' | 'year' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  month: 'Ce mois',
  prev_month: 'Mois précédent',
  quarter: 'Ce trimestre',
  year: 'Cette année',
  all: 'Tout',
}

interface Goals {
  goal_monthly_margin: number
  goal_annual_revenue: number
  goal_margin_per_vehicle: number
}

interface ResoldListing {
  id: string
  brand: string
  model: string | null
  year: number | null
  km: number | null
  price: number | null
  sold_price: number | null
  sold_at: string | null
  status: string
  listing_margins: ListingMargin[] | null
  clients: Client | null
}

interface NegoListing {
  id: string
  brand: string
  model: string | null
  year: number | null
  listing_margins: ListingMargin[] | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_FR = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

function getPeriodBounds(period: Period): { start: Date | null; end: Date } {
  const now = new Date()

  if (period === 'all') {
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return { start: null, end }
  }

  if (period === 'prev_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  let start: Date
  if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3)
    start = new Date(now.getFullYear(), q * 3, 1)
  } else {
    start = new Date(now.getFullYear(), 0, 1)
  }
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function filterResold(listings: ResoldListing[], start: Date | null, end: Date): ResoldListing[] {
  if (start === null) return listings
  return listings.filter(l => {
    if (!l.sold_at) return false
    const d = new Date(l.sold_at)
    return d >= start && d <= end
  })
}

function getListingMargin(l: ResoldListing | NegoListing): number | null {
  const m = l.listing_margins?.[0]
  if (!m) return null
  if (m.margin !== null && m.margin !== undefined) return m.margin
  const sellP = 'sold_price' in l ? (l.sold_price ?? m.sell_price) : m.sell_price
  if (sellP == null || m.total_cost == null) return null
  return sellP - m.total_cost
}

function progressColor(pct: number): string {
  if (pct >= 80) return '#1D9E75'
  if (pct >= 50) return '#EF9F27'
  return '#E24B4A'
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2 rounded-full bg-[#1a1f2e] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: progressColor(pct) }}
      />
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, valueColor,
}: {
  label: string
  value: string
  sub?: string
  valueColor?: string
}) {
  return (
    <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0a0d14]">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <p className="text-[22px] font-semibold truncate" style={{ color: valueColor ?? '#f1f5f9' }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

// ─── GoalCard ─────────────────────────────────────────────────────────────────

function GoalCard({
  title, goalKey, current, goals, onSaveGoal, extra,
}: {
  title: string
  goalKey: keyof Goals
  current: number
  goals: Goals
  onSaveGoal: (key: keyof Goals, val: number) => Promise<void>
  extra?: React.ReactNode
}) {
  const goal = goals[goalKey]
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0
  const color = progressColor(pct)
  const reached = current >= goal

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(goal))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const val = parseInt(draft)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    await onSaveGoal(goalKey, val)
    setSaving(false)
    setEditing(false)
  }

  function startEdit() {
    setDraft(String(goal))
    setEditing(true)
  }

  return (
    <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0a0d14]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-200">{title}</span>
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                className="w-24 text-xs bg-[#0d1117] border border-[#2a2f3e] rounded px-2 py-0.5 text-gray-200 outline-none"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-green-400 hover:text-green-300 p-0.5 disabled:opacity-50"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 hover:text-gray-300 p-0.5"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-500 bg-[#1a1f2e] px-2 py-0.5 rounded-full">
              objectif {fmt(goal)}
            </span>
          )}
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-xl font-bold text-gray-100">{fmt(current)}</span>
        <span className="text-xs text-gray-500">/ {fmt(goal)}</span>
      </div>

      <ProgressBar value={current} max={goal} />

      <p className="mt-2 text-xs" style={{ color }}>
        {reached
          ? 'Objectif atteint ✓'
          : `${Math.round(pct)}% — il manque ${fmt(goal - current)} pour atteindre l'objectif`}
      </p>

      {extra && (
        <div className="mt-3 pt-3 border-t border-[#1a1f2e]">{extra}</div>
      )}
    </div>
  )
}

// ─── SaleDetailModal ──────────────────────────────────────────────────────────

function SaleDetailModal({
  listing, goals, onClose,
}: {
  listing: ResoldListing
  goals: Goals
  onClose: () => void
}) {
  const m = listing.listing_margins?.[0]
  const margin = getListingMargin(listing)
  const goalPct = goals.goal_margin_per_vehicle > 0 && margin !== null
    ? Math.min((margin / goals.goal_margin_per_vehicle) * 100, 100)
    : 0

  const costs = m ? [
    { label: "Prix d'achat", value: m.buy_price },
    { label: 'Transport', value: m.transport },
    { label: 'Remise en état', value: m.repair },
    { label: 'Contrôle technique', value: m.ct_cost },
    { label: 'Immatriculation', value: m.registration },
    { label: 'Autres frais', value: m.other_costs },
  ] : []

  const sellDisplay = listing.sold_price ?? m?.sell_price

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[#0a0d14] border border-[#1a1f2e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1f2e]">
          <div>
            <p className="font-semibold text-gray-100">
              🚗 {listing.brand} {listing.model}{listing.year ? ` (${listing.year})` : ''}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {listing.sold_at
                ? new Date(listing.sold_at).toLocaleDateString('fr-FR')
                : '—'}
              {listing.clients?.name ? ` · ${listing.clients.name}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {m ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne gauche — Charges */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Charges de l'opération
              </p>
              <div className="space-y-2.5">
                {costs.map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-200">
                      {value != null ? fmt(value) : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#1a1f2e] flex justify-between text-sm font-semibold">
                <span className="text-gray-300">Total charges</span>
                <span className="text-red-400">
                  {m.total_cost != null ? fmt(m.total_cost) : '—'}
                </span>
              </div>
            </div>

            {/* Colonne droite — Résultat */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Résultat de l'opération
              </p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Prix de vente</span>
                  <span className="text-green-400 font-semibold">
                    {sellDisplay != null ? fmt(sellDisplay) : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total charges</span>
                  <span className="text-red-400">
                    {m.total_cost != null ? fmt(m.total_cost) : '—'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#1a1f2e]">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-gray-300 font-semibold text-sm">Marge nette</span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: margin !== null ? (margin >= 0 ? '#4ade80' : '#f87171') : '#6b7280' }}
                  >
                    {margin !== null ? fmt(margin) : '—'}
                  </span>
                </div>
                {margin !== null && goals.goal_margin_per_vehicle > 0 && (
                  <>
                    <ProgressBar value={margin} max={goals.goal_margin_per_vehicle} />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Marge cible atteinte à {Math.round(goalPct)}%
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">
            Aucune donnée de marge disponible pour cette annonce.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Goal progress helpers ────────────────────────────────────────────────────

const GOAL_TYPE_LABELS: Record<string, string> = { ca: "Chiffre d'affaires", margin: 'Marge nette' }
const GOAL_PERIOD_LABELS: Record<string, string> = { week: 'Semaine', month: 'Mois', year: 'Année' }

function getGoalPeriodBounds(period: string): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (period === 'week') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const start = new Date(now)
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  // year
  const start = new Date(now.getFullYear(), 0, 1)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function computeGoalProgress(goal: Goal, allResold: ResoldListing[]): number {
  const { start, end } = getGoalPeriodBounds(goal.period)
  const sales = allResold.filter(l => {
    if (!l.sold_at) return false
    const d = new Date(l.sold_at)
    return d >= start && d <= end
  })
  if (goal.type === 'ca') {
    return sales.reduce((s, l) => s + (l.sold_price ?? 0), 0)
  }
  // margin
  let total = 0
  for (const l of sales) {
    const mg = getListingMargin(l)
    if (mg !== null) total += mg
  }
  return total
}

// Pct restant de la période (0-1) pour juger si on est en retard
function getPeriodElapsedFraction(period: string): number {
  const now = new Date()
  const { start, end } = getGoalPeriodBounds(period)
  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()
  return Math.min(elapsed / total, 1)
}

// ─── BarChart Tooltip ─────────────────────────────────────────────────────────

function BarTooltipContent({
  active, payload, label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-lg p-3 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-gray-100">{fmt(payload[0].value)}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [view, setView] = useState<ViewMode>('current')
  const [period, setPeriod] = useState<Period>('month')
  const [allResold, setAllResold] = useState<ResoldListing[]>([])
  const [negoListings, setNegoListings] = useState<NegoListing[]>([])
  const [goals, setGoals] = useState<Goals>({
    goal_monthly_margin: 5000,
    goal_annual_revenue: 100000,
    goal_margin_per_vehicle: 2500,
  })
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<ResoldListing | null>(null)
  const [marginListing, setMarginListing] = useState<ResoldListing | null>(null)

  // ── Goals (table goals) ──
  const [userGoals, setUserGoals] = useState<Goal[]>([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState<{ type: string; period: string; target: string }>({
    type: 'ca', period: 'month', target: '',
  })
  const [goalSaving, setGoalSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: resold, error: resoldErr }, { data: nego }, { data: profile }, { data: goalsData }] = await Promise.all([
        supabase
          .from('listings')
          .select('id, brand, model, year, km, price, sold_price, sold_at, status, listing_margins(*), clients(*)')
          .eq('user_id', user.id)
          .eq('status', 'resold'),
        supabase
          .from('listings')
          .select('id, brand, model, year, listing_margins(*)')
          .eq('user_id', user.id)
          .eq('status', 'negotiation'),
        supabase
          .from('profiles')
          .select('goal_monthly_margin, goal_annual_revenue, goal_margin_per_vehicle')
          .eq('id', user.id)
          .single(),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
      ])

      if (resoldErr) { console.error('Erreur:', resoldErr.message); setErrorMsg(resoldErr.message) }
      setAllResold((resold as ResoldListing[]) ?? [])
      setNegoListings((nego as NegoListing[]) ?? [])
      if (profile) {
        setGoals({
          goal_monthly_margin: profile.goal_monthly_margin ?? 5000,
          goal_annual_revenue: profile.goal_annual_revenue ?? 100000,
          goal_margin_per_vehicle: profile.goal_margin_per_vehicle ?? 2500,
        })
      }
      setUserGoals((goalsData as Goal[]) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  async function saveGoal(key: keyof Goals, val: number) {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('profiles').update({ [key]: val }).eq('id', userId)
    setGoals(prev => ({ ...prev, [key]: val }))
  }

  // ── Goals CRUD ──
  async function handleAddGoal() {
    if (!userId || !goalForm.target) return
    const target = parseInt(goalForm.target)
    if (isNaN(target) || target <= 0) return
    setGoalSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('goals').insert({
      user_id: userId,
      type: goalForm.type,
      period: goalForm.period,
      target,
    }).select().single()
    if (data) setUserGoals(prev => [...prev, data as Goal])
    setGoalForm({ type: 'ca', period: 'month', target: '' })
    setShowGoalForm(false)
    setGoalSaving(false)
  }

  async function handleDeleteGoal(id: string) {
    const supabase = createClient()
    await supabase.from('goals').delete().eq('id', id)
    setUserGoals(prev => prev.filter(g => g.id !== id))
  }

  // ── Période filtrée ──
  const { start, end } = useMemo(() => getPeriodBounds(period), [period])
  const filtered = useMemo(() => filterResold(allResold, start, end), [allResold, start, end])

  // ── KPIs période sélectionnée ──
  const kpis = useMemo(() => {
    let revenue = 0, charges = 0, marginTotal = 0, marginCount = 0
    for (const l of filtered) {
      revenue += l.sold_price ?? 0
      const m = l.listing_margins?.[0]
      if (m?.total_cost) charges += m.total_cost
      const mg = getListingMargin(l)
      if (mg !== null) { marginTotal += mg; marginCount++ }
    }
    return {
      revenue,
      charges,
      marginTotal,
      avgMargin: marginCount > 0 ? marginTotal / marginCount : 0,
      soldCount: filtered.length,
      marginCount,
    }
  }, [filtered])

  // ── Objectif marge mensuelle (toujours mois courant) ──
  const monthBounds = useMemo(() => getPeriodBounds('month'), [])
  const monthFiltered = useMemo(
    () => filterResold(allResold, monthBounds.start, monthBounds.end),
    [allResold, monthBounds],
  )
  const monthMargin = useMemo(() => {
    let total = 0
    for (const l of monthFiltered) {
      const mg = getListingMargin(l)
      if (mg !== null) total += mg
    }
    return total
  }, [monthFiltered])

  // ── Objectif CA annuel (YTD) ──
  const yearBounds = useMemo(() => getPeriodBounds('year'), [])
  const yearFiltered = useMemo(
    () => filterResold(allResold, yearBounds.start, yearBounds.end),
    [allResold, yearBounds],
  )
  const yearRevenue = useMemo(
    () => yearFiltered.reduce((s, l) => s + (l.sold_price ?? 0), 0),
    [yearFiltered],
  )
  const monthsElapsed = new Date().getMonth() + 1
  const projectedAnnual = monthsElapsed > 0 ? Math.round((yearRevenue / monthsElapsed) * 12) : 0

  // ── Objectif marge / véhicule (toutes périodes) ──
  const vehicleGoalStats = useMemo(() => {
    let total = 0, count = 0, reached = 0
    for (const l of allResold) {
      const mg = getListingMargin(l)
      if (mg !== null) {
        total += mg; count++
        if (mg >= goals.goal_margin_per_vehicle) reached++
      }
    }
    return { avg: count > 0 ? total / count : 0, total: count, reached }
  }, [allResold, goals.goal_margin_per_vehicle])

  // ── Projection fin de mois ──
  const negoMarginsTotal = useMemo(() => {
    let total = 0
    for (const l of negoListings) {
      const mg = getListingMargin(l)
      if (mg !== null) total += mg
    }
    return total
  }, [negoListings])

  const projectedMonth = monthMargin + negoMarginsTotal
  const projectedPct = goals.goal_monthly_margin > 0
    ? (projectedMonth / goals.goal_monthly_margin) * 100
    : 0

  // ── Ventes triées ──
  const sortedSales = useMemo(() =>
    [...filtered].sort((a, b) => {
      if (!a.sold_at) return 1
      if (!b.sold_at) return -1
      return new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime()
    }),
    [filtered],
  )

  // ── Historique 12 mois ──
  const historyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const mEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
      const sales = filterResold(allResold, date, mEnd)
      let revenue = 0, charges = 0, margin = 0, marginCount = 0
      for (const l of sales) {
        revenue += l.sold_price ?? 0
        const mc = l.listing_margins?.[0]
        if (mc?.total_cost) charges += mc.total_cost
        const mg = getListingMargin(l)
        if (mg !== null) { margin += mg; marginCount++ }
      }
      return {
        label: `${MONTHS_FR[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`,
        margin: Math.round(margin),
        revenue: Math.round(revenue),
        charges: Math.round(charges),
        avgMargin: marginCount > 0 ? Math.round(margin / marginCount) : 0,
        soldCount: sales.length,
        isAboveGoal: margin > 0 && margin >= goals.goal_monthly_margin,
      }
    })
  }, [allResold, goals.goal_monthly_margin])

  // ── Totaux historique ──
  const historyTotals = useMemo(() => ({
    soldCount: historyData.reduce((s, r) => s + r.soldCount, 0),
    revenue: historyData.reduce((s, r) => s + r.revenue, 0),
    charges: historyData.reduce((s, r) => s + r.charges, 0),
    margin: historyData.reduce((s, r) => s + r.margin, 0),
  }), [historyData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
        Chargement…
      </div>
    )
  }

  return (
    <>
      <KeyboardShortcuts />
      <Header title="Finance" />

      {selectedSale && (
        <SaleDetailModal
          listing={selectedSale}
          goals={goals}
          onClose={() => setSelectedSale(null)}
        />
      )}

      {marginListing && (
        <MarginModal
          open
          onClose={() => setMarginListing(null)}
          listing={marginListing as unknown as Listing}
          onSaved={() => setMarginListing(null)}
        />
      )}

      <div className="flex-1 overflow-y-auto pt-14">
        {errorMsg && <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-red-900/30 border border-red-700/40 text-sm text-red-400">{errorMsg}</div>}
        <div className="p-6 max-w-6xl mx-auto space-y-6">

          {/* ── Toggles ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Vue actuelle / Historique */}
            <div className="flex gap-1 p-1 bg-[#0a0d14] border border-[#1a1f2e] rounded-xl">
              {(['current', 'history'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    view === v
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1f2e]'
                  }`}
                >
                  {v === 'current' ? 'Vue actuelle' : 'Historique'}
                </button>
              ))}
            </div>

            {/* Sélecteur de période (vue actuelle seulement) */}
            {view === 'current' && (
              <div className="flex gap-1 p-1 bg-[#0a0d14] border border-[#1a1f2e] rounded-xl flex-wrap">
                {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      period === p
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1f2e]'
                    }`}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══ VUE ACTUELLE ══════════════════════════════════════════════════ */}
          {view === 'current' && (
            <>
              {/* Section 2 — KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Chiffre d'affaires"
                  value={fmt(kpis.revenue)}
                />
                <MetricCard
                  label="Total charges"
                  value={kpis.charges > 0 ? fmt(kpis.charges) : '—'}
                />
                <MetricCard
                  label="Marge nette"
                  value={kpis.marginCount > 0 ? fmt(kpis.marginTotal) : '—'}
                  valueColor={kpis.marginTotal >= 0 ? '#4ade80' : '#f87171'}
                />
                <MetricCard
                  label="Marge moyenne / vente"
                  value={kpis.marginCount > 0 ? fmt(kpis.avgMargin) : '—'}
                  sub={kpis.soldCount > 0
                    ? `${kpis.soldCount} vente${kpis.soldCount > 1 ? 's' : ''}`
                    : undefined}
                />
              </div>

              {/* Section 3 — Objectifs */}
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Objectifs
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <GoalCard
                    title="Marge mensuelle"
                    goalKey="goal_monthly_margin"
                    current={monthMargin}
                    goals={goals}
                    onSaveGoal={saveGoal}
                  />
                  <GoalCard
                    title="CA annuel"
                    goalKey="goal_annual_revenue"
                    current={yearRevenue}
                    goals={goals}
                    onSaveGoal={saveGoal}
                    extra={
                      <p className="text-xs text-gray-500">
                        Rythme actuel →{' '}
                        <span className="text-gray-300 font-medium">
                          ~{fmt(projectedAnnual)}
                        </span>{' '}
                        projeté sur l'année
                      </p>
                    }
                  />
                </div>
                <GoalCard
                  title="Marge cible / véhicule"
                  goalKey="goal_margin_per_vehicle"
                  current={vehicleGoalStats.avg}
                  goals={goals}
                  onSaveGoal={saveGoal}
                  extra={
                    <p className="text-xs text-gray-500">
                      <span className="text-gray-300 font-medium">
                        {vehicleGoalStats.reached}/{vehicleGoalStats.total}
                      </span>{' '}
                      ventes ont atteint la cible
                    </p>
                  }
                />
              </div>

              {/* Section 4 — Projection fin de mois */}
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Projection fin de mois
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    label="Véhicules en cours"
                    value={String(negoListings.length)}
                    sub="statut négociation"
                  />
                  <MetricCard
                    label="Marge potentielle"
                    value={negoMarginsTotal > 0 ? fmt(negoMarginsTotal) : '—'}
                    sub="négociations en cours"
                  />
                  <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0a0d14]">
                    <p className="text-xs text-gray-500 mb-2">Marge projetée (mois)</p>
                    <p className="text-[22px] font-semibold text-gray-100">{fmt(projectedMonth)}</p>
                    <p
                      className="text-xs font-semibold mt-1"
                      style={{
                        color: projectedPct >= 100 ? '#1D9E75'
                          : projectedPct >= 80 ? '#EF9F27'
                          : '#E24B4A',
                      }}
                    >
                      {projectedPct >= 100
                        ? '✓ Atteignable'
                        : projectedPct >= 80
                        ? '⚠ Serré'
                        : '✗ Difficile'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4b — Mes objectifs (goals table) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">🎯 Mes objectifs</h2>
                  <button
                    onClick={() => setShowGoalForm(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 border border-orange-900/40 bg-orange-900/10 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                </div>

                {/* Form d'ajout */}
                {showGoalForm && (
                  <div className="p-4 rounded-xl border border-[#2a2f3e] bg-[#0a0d14] mb-3 space-y-3">
                    <p className="text-xs font-semibold text-gray-300">Nouvel objectif</p>
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={goalForm.type}
                        onChange={e => setGoalForm(f => ({ ...f, type: e.target.value }))}
                        className="bg-[#0d1117] border border-[#2a2f3e] rounded-lg px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-orange-500"
                      >
                        <option value="ca">Chiffre d'affaires</option>
                        <option value="margin">Marge nette</option>
                      </select>
                      <select
                        value={goalForm.period}
                        onChange={e => setGoalForm(f => ({ ...f, period: e.target.value }))}
                        className="bg-[#0d1117] border border-[#2a2f3e] rounded-lg px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-orange-500"
                      >
                        <option value="week">Semaine</option>
                        <option value="month">Mois</option>
                        <option value="year">Année</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Montant cible (€)"
                        value={goalForm.target}
                        onChange={e => setGoalForm(f => ({ ...f, target: e.target.value }))}
                        className="bg-[#0d1117] border border-[#2a2f3e] rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-orange-500 w-44"
                      />
                      <button
                        onClick={handleAddGoal}
                        disabled={goalSaving || !goalForm.target}
                        className="px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {goalSaving ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                      <button
                        onClick={() => setShowGoalForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 rounded-lg transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste des objectifs */}
                {userGoals.length === 0 && !showGoalForm ? (
                  <p className="text-xs text-gray-500 py-3">Aucun objectif défini. Cliquez sur "Ajouter" pour en créer un.</p>
                ) : (
                  <div className="space-y-3">
                    {userGoals.map(goal => {
                      const realized = computeGoalProgress(goal, allResold)
                      const pct = goal.target > 0 ? Math.min((realized / goal.target) * 100, 100) : 0
                      const elapsed = getPeriodElapsedFraction(goal.period)
                      const isLate = elapsed > 0.5 && pct < 50
                      const reached = realized >= goal.target
                      const barColor = reached ? '#1D9E75' : isLate ? '#E24B4A' : '#f97316'
                      return (
                        <div key={goal.id} className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0a0d14]">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-200">
                                {GOAL_TYPE_LABELS[goal.type] ?? goal.type}
                              </span>
                              <span className="text-xs text-gray-500 bg-[#1a1f2e] px-2 py-0.5 rounded-full">
                                {GOAL_PERIOD_LABELS[goal.period] ?? goal.period}
                              </span>
                              <span className="text-xs text-gray-500 bg-[#1a1f2e] px-2 py-0.5 rounded-full">
                                objectif {fmt(goal.target)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-xl font-bold text-gray-100">{fmt(realized)}</span>
                            <span className="text-xs text-gray-500">/ {fmt(goal.target)}</span>
                          </div>

                          <div className="h-2 rounded-full bg-[#1a1f2e] overflow-hidden mb-1.5">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: barColor }}
                            />
                          </div>

                          <p className="text-xs" style={{ color: barColor }}>
                            {reached
                              ? 'Objectif atteint ✓'
                              : isLate
                              ? `⚠ En retard — ${Math.round(pct)}% atteint, il manque ${fmt(goal.target - realized)}`
                              : `${Math.round(pct)}% — il manque ${fmt(goal.target - realized)}`}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Section 5 — Ventes */}
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Ventes{sortedSales.length > 0 ? ` — ${sortedSales.length} opération${sortedSales.length > 1 ? 's' : ''}` : ''}
                </h2>

                {sortedSales.length === 0 ? (
                  <div className="text-center py-16 rounded-xl border border-[#1a1f2e] bg-[#0a0d14]">
                    <p className="text-4xl mb-3">📊</p>
                    <p className="text-gray-300 font-semibold mb-1">Aucune vente sur cette période</p>
                    <p className="text-gray-500 text-sm">
                      Marquez vos annonces comme Revendue pour voir vos stats
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#1a1f2e] overflow-hidden divide-y divide-[#1a1f2e]">
                    {sortedSales.map(l => {
                      const margin = getListingMargin(l)
                      const hasMarginData = !!l.listing_margins?.[0]
                      return (
                        <div
                          key={l.id}
                          className="flex items-center gap-4 px-5 py-4 bg-[#0a0d14] hover:bg-[#0d1117] transition-colors cursor-pointer"
                          onClick={() => setSelectedSale(l)}
                        >
                          <span className="text-xl flex-shrink-0">🚗</span>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-100 truncate">
                              {l.brand} {l.model}{l.year ? ` — ${l.year}` : ''}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {l.clients?.name ? `Client : ${l.clients.name}` : ''}
                              {l.listing_margins?.[0]?.buy_price != null
                                ? `${l.clients?.name ? ' · ' : ''}Achetée ${fmt(l.listing_margins[0].buy_price)}`
                                : ''}
                              {l.sold_price != null
                                ? ` · Revendue ${fmt(l.sold_price)}`
                                : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs font-medium text-green-400 bg-green-900/20 border border-green-900/30 px-2 py-0.5 rounded-full">
                              Soldée
                            </span>
                            <div className="text-right min-w-[80px]">
                              {hasMarginData ? (
                                <p
                                  className="text-sm font-semibold"
                                  style={{
                                    color: margin !== null
                                      ? margin >= 0 ? '#4ade80' : '#f87171'
                                      : '#6b7280',
                                  }}
                                >
                                  {margin !== null ? fmt(margin) : 'N/A'}
                                </p>
                              ) : (
                                <button
                                  className="text-xs text-orange-400 hover:text-orange-300 border border-orange-900/40 bg-orange-900/10 px-2 py-0.5 rounded transition-colors"
                                  onClick={e => { e.stopPropagation(); setMarginListing(l) }}
                                >
                                  Ajouter les données
                                </button>
                              )}
                              {l.sold_price != null && (
                                <p className="text-xs text-gray-500 mt-0.5">{fmt(l.sold_price)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ HISTORIQUE ════════════════════════════════════════════════════ */}
          {view === 'history' && (
            <>
              {/* Graphique barres */}
              <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                <h3 className="text-sm font-semibold text-gray-300 mb-1">
                  Marge nette par mois — 12 derniers mois
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  <span className="inline-block w-2 h-2 rounded-sm bg-[#1D9E75] mr-1" />
                  Objectif atteint &nbsp;
                  <span className="inline-block w-2 h-2 rounded-sm bg-[#EF9F27] mr-1 ml-2" />
                  En dessous de l'objectif
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={historyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k€`}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip content={<BarTooltipContent />} />
                    <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
                      {historyData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.soldCount === 0 ? '#1a1f2e' : entry.isAboveGoal ? '#1D9E75' : '#EF9F27'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tableau récapitulatif */}
              <div className="rounded-xl border border-[#1a1f2e] overflow-hidden">
                <div className="px-5 py-3 bg-[#0a0d14] border-b border-[#1a1f2e]">
                  <h3 className="text-sm font-semibold text-gray-300">Récapitulatif mensuel</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1a1f2e]">
                        {['Mois', 'Nb ventes', 'CA', 'Charges', 'Marge nette', 'Marge moy/vente'].map(h => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1f2e]">
                      {historyData.map((row, i) => (
                        <tr key={i} className="hover:bg-[#0a0d14] transition-colors">
                          <td className="px-4 py-3 text-gray-300 font-medium whitespace-nowrap">
                            {row.label}
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {row.soldCount > 0 ? row.soldCount : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                            {row.revenue > 0 ? fmt(row.revenue) : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {row.charges > 0 ? fmt(row.charges) : '—'}
                          </td>
                          <td
                            className="px-4 py-3 font-semibold whitespace-nowrap"
                            style={{
                              color: row.margin > 0 ? '#4ade80'
                                : row.margin < 0 ? '#f87171'
                                : '#6b7280',
                            }}
                          >
                            {row.margin !== 0 ? fmt(row.margin) : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {row.avgMargin > 0 ? fmt(row.avgMargin) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#2a2f3e] bg-[#0a0d14]">
                        <td className="px-4 py-3 text-gray-200 font-semibold text-sm">Total</td>
                        <td className="px-4 py-3 text-gray-300 font-semibold">
                          {historyTotals.soldCount}
                        </td>
                        <td className="px-4 py-3 text-gray-300 font-semibold">
                          {historyTotals.revenue > 0 ? fmt(historyTotals.revenue) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-semibold">
                          {historyTotals.charges > 0 ? fmt(historyTotals.charges) : '—'}
                        </td>
                        <td
                          className="px-4 py-3 font-semibold"
                          style={{ color: historyTotals.margin >= 0 ? '#4ade80' : '#f87171' }}
                        >
                          {historyTotals.margin !== 0 ? fmt(historyTotals.margin) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-semibold">
                          {historyTotals.soldCount > 0
                            ? fmt(Math.round(historyTotals.margin / historyTotals.soldCount))
                            : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}
