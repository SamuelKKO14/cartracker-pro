'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { Client, ListingMargin } from '@/types/database'

// ─── Types ──────────────────────────────────────────────────────────────────

type Period = '7J' | '30J' | '3M' | '6M' | '1AN' | 'TOUT'
const PERIODS: Period[] = ['7J', '30J', '3M', '6M', '1AN', 'TOUT']

interface ResoldListing {
  id: string
  brand: string
  model: string | null
  year: number | null
  sold_price: number | null
  sold_at: string | null
  listing_margins: ListingMargin[] | null
  clients: Client | null
}

// ─── Formatters ──────────────────────────────────────────────────────────────

const formatEur = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

// ─── Period helpers ───────────────────────────────────────────────────────────

function getPeriodRange(period: Period): { start: Date | null; end: Date } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  if (period === 'TOUT') return { start: null, end }

  const start = new Date()
  switch (period) {
    case '7J': start.setDate(start.getDate() - 7); break
    case '30J': start.setDate(start.getDate() - 30); break
    case '3M': start.setMonth(start.getMonth() - 3); break
    case '6M': start.setMonth(start.getMonth() - 6); break
    case '1AN': start.setFullYear(start.getFullYear() - 1); break
  }
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function filterByRange(listings: ResoldListing[], start: Date | null, end: Date): ResoldListing[] {
  return listings.filter(l => {
    if (!l.sold_at) return false
    const d = new Date(l.sold_at)
    if (start && d < start) return false
    if (d > end) return false
    return true
  })
}

function getMargin(l: ResoldListing): number | null {
  if (!l.sold_price) return null
  const m = l.listing_margins?.[0]
  if (!m) return null
  const cost = m.total_cost ?? m.buy_price
  if (cost == null) return null
  return l.sold_price - cost
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

interface Metrics {
  soldCount: number
  revenue: number
  totalMargin: number
  avgMargin: number
  marginCount: number
}

function computeMetrics(listings: ResoldListing[]): Metrics {
  let revenue = 0
  let totalMargin = 0
  let marginCount = 0

  for (const l of listings) {
    if (l.sold_price) revenue += l.sold_price
    const m = getMargin(l)
    if (m !== null) {
      totalMargin += m
      marginCount++
    }
  }

  return {
    soldCount: listings.length,
    revenue,
    totalMargin,
    avgMargin: marginCount > 0 ? totalMargin / marginCount : 0,
    marginCount,
  }
}

function formatPct(curr: number, prev: number): { text: string; positive: boolean } | null {
  if (prev === 0 && curr === 0) return null
  if (prev === 0) return { text: 'Nouveau', positive: curr > 0 }
  const pct = Math.round(((curr - prev) / Math.abs(prev)) * 100)
  return { text: `${pct >= 0 ? '+' : ''}${pct}%`, positive: pct >= 0 }
}

// ─── Chart ───────────────────────────────────────────────────────────────────

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function getGroupKey(date: Date, period: Period): string {
  if (period === '7J' || period === '30J') {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
  }
  if (period === '3M' || period === '6M') {
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const weekNum = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    return `S${weekNum} ${date.getFullYear()}`
  }
  return `${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`
}

function buildChartData(listings: ResoldListing[], period: Period) {
  const sorted = [...listings]
    .filter(l => l.sold_at && getMargin(l) !== null)
    .sort((a, b) => new Date(a.sold_at!).getTime() - new Date(b.sold_at!).getTime())

  const groups: Record<string, number> = {}
  const order: string[] = []

  for (const l of sorted) {
    const key = getGroupKey(new Date(l.sold_at!), period)
    if (!(key in groups)) { groups[key] = 0; order.push(key) }
    groups[key] += getMargin(l) ?? 0
  }

  let cumul = 0
  return order.map(label => {
    cumul += groups[label]
    return { label, margin: Math.round(cumul) }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  icon, label, value, compare,
}: {
  icon: string
  label: string
  value: string
  compare: { text: string; positive: boolean } | null | undefined
}) {
  return (
    <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0a0d14]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 mb-2">{icon} {label}</p>
          <p className="text-2xl font-bold text-gray-100 truncate">{value}</p>
        </div>
        {compare && (
          <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
            compare.positive
              ? 'text-green-400 bg-green-900/20'
              : 'text-red-400 bg-red-900/20'
          }`}>
            {compare.positive ? '↑' : '↓'} {compare.text}
          </span>
        )}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-lg p-3 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-orange-400 font-semibold">{formatEur(payload[0].value)}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <p className="text-5xl mb-4">📊</p>
      <p className="text-gray-300 font-semibold text-lg mb-2">Aucune vente sur cette période</p>
      <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
        Marquez vos annonces comme &ldquo;Revendue&rdquo; avec le prix de vente pour voir vos statistiques
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [period, setPeriod] = useState<Period>('30J')
  const [allResold, setAllResold] = useState<ResoldListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('listings')
        .select('id, brand, model, year, sold_price, sold_at, listing_margins(*), clients(*)')
        .eq('user_id', user.id)
        .eq('status', 'resold')

      setAllResold((data as ResoldListing[]) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const { start, end } = useMemo(() => getPeriodRange(period), [period])

  const filtered = useMemo(
    () => filterByRange(allResold, start, end),
    [allResold, start, end],
  )

  const prevFiltered = useMemo(() => {
    if (period === 'TOUT' || !start) return []
    const duration = end.getTime() - start.getTime()
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - duration)
    return filterByRange(allResold, prevStart, prevEnd)
  }, [allResold, period, start, end])

  const metrics = useMemo(() => computeMetrics(filtered), [filtered])
  const prevMetrics = useMemo(() => computeMetrics(prevFiltered), [prevFiltered])
  const chartData = useMemo(() => buildChartData(filtered, period), [filtered, period])

  const tableListings = useMemo(() =>
    [...filtered].sort((a, b) => {
      if (!a.sold_at) return 1
      if (!b.sold_at) return -1
      return new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime()
    }),
    [filtered],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
        Chargement…
      </div>
    )
  }

  const showCompare = period !== 'TOUT'

  const cards = [
    {
      icon: '💰',
      label: "Chiffre d'affaires",
      value: formatEur(metrics.revenue),
      compare: showCompare ? formatPct(metrics.revenue, prevMetrics.revenue) : null,
    },
    {
      icon: '📈',
      label: 'Marge nette totale',
      value: metrics.marginCount > 0 ? formatEur(metrics.totalMargin) : '—',
      compare: showCompare && metrics.marginCount > 0 ? formatPct(metrics.totalMargin, prevMetrics.totalMargin) : null,
    },
    {
      icon: '🚗',
      label: 'Véhicules vendus',
      value: String(metrics.soldCount),
      compare: showCompare ? formatPct(metrics.soldCount, prevMetrics.soldCount) : null,
    },
    {
      icon: '📊',
      label: 'Marge moyenne',
      value: metrics.marginCount > 0 ? formatEur(metrics.avgMargin) : '—',
      compare: showCompare && metrics.marginCount > 0 ? formatPct(metrics.avgMargin, prevMetrics.avgMargin) : null,
    },
  ]

  return (
    <>
      <KeyboardShortcuts />
      <Header title="Finance" />

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 max-w-6xl mx-auto space-y-6">

          {/* Period selector */}
          <div className="flex gap-1 p-1 bg-[#0a0d14] border border-[#1a1f2e] rounded-xl w-fit">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  period === p
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1f2e]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map(card => (
                  <MetricCard key={card.label} {...card} />
                ))}
              </div>

              {/* Chart */}
              {chartData.length > 1 && (
                <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">
                    Évolution de la marge nette cumulée
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        tickFormatter={v => `${(v / 1000).toFixed(0)}k€`}
                        axisLine={false}
                        tickLine={false}
                        width={45}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="margin"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#f97316' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Operations table */}
              <div className="rounded-xl border border-[#1a1f2e] overflow-hidden">
                <div className="px-5 py-3 bg-[#0a0d14] border-b border-[#1a1f2e]">
                  <h3 className="text-sm font-semibold text-gray-300">
                    Opérations — {tableListings.length} vente{tableListings.length > 1 ? 's' : ''}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1a1f2e]">
                        {['Véhicule', 'Date de vente', "Prix d'achat", 'Prix de vente', 'Marge nette', 'Client'].map(h => (
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
                      {tableListings.map(l => {
                        const margin = getMargin(l)
                        const buyPrice = l.listing_margins?.[0]?.buy_price

                        return (
                          <tr key={l.id} className="hover:bg-[#0a0d14] transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">
                              {l.brand} {l.model}{l.year ? ` (${l.year})` : ''}
                            </td>
                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                              {l.sold_at
                                ? new Date(l.sold_at).toLocaleDateString('fr-FR')
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                              {buyPrice != null ? formatEur(buyPrice) : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                              {l.sold_price != null ? formatEur(l.sold_price) : '—'}
                            </td>
                            <td className={`px-4 py-3 font-semibold whitespace-nowrap ${
                              margin === null
                                ? 'text-gray-500'
                                : margin >= 0
                                  ? 'text-green-400'
                                  : 'text-red-400'
                            }`}>
                              {margin !== null ? formatEur(margin) : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-400">
                              {l.clients?.name ?? '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
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
