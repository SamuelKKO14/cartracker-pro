'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice, getFinalScore, STATUS_LABELS, COUNTRY_LABELS } from '@/lib/utils'
import type { ListingWithDetails } from '@/types/database'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  CartesianGrid, Area, AreaChart,
} from 'recharts'

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#10b981', '#34d399']

const STATUS_COLORS_CHART: Record<string, string> = {
  new: '#3b82f6',
  viewed: '#8b5cf6',
  contacted: '#eab308',
  negotiation: '#f97316',
  bought: '#10b981',
  resold: '#14b8a6',
  ignored: '#6b7280',
}

const MONTHS_FR = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

type ListingWithClient = ListingWithDetails & {
  clients?: { name: string } | null
}

export default function StatsPage() {
  const [listings, setListings] = useState<ListingWithClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('listings')
        .select('*, listing_margins(*), clients(name)')
        .eq('user_id', user.id)

      setListings((data as ListingWithClient[]) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">Chargement…</div>
    )
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const total = listings.length
  const withPrice = listings.filter(l => l.price != null)
  const avgPrice = withPrice.length > 0 ? Math.round(withPrice.reduce((s, l) => s + (l.price ?? 0), 0) / withPrice.length) : 0
  const withKm = listings.filter(l => l.km != null)
  const avgKm = withKm.length > 0 ? Math.round(withKm.reduce((s, l) => s + (l.km ?? 0), 0) / withKm.length) : 0
  const withScore = listings.map(l => getFinalScore(l.auto_score, l.manual_score)).filter(s => s != null) as number[]
  const avgScore = withScore.length > 0 ? Math.round(withScore.reduce((a, b) => a + b, 0) / withScore.length) : 0
  const goodDeals = withScore.filter(s => s >= 70).length
  const bought = listings.filter(l => l.status === 'bought').length
  const totalMargin = listings.reduce((sum, l) => {
    const m = (l.margin as { margin?: number } | null)?.margin
    return sum + (m ?? 0)
  }, 0)

  // ── Brand data ────────────────────────────────────────────────────────────
  const brandMap: Record<string, { total: number; totalPrice: number; count: number }> = {}
  listings.forEach(l => {
    const b = l.brand
    if (!brandMap[b]) brandMap[b] = { total: 0, totalPrice: 0, count: 0 }
    brandMap[b].total++
    if (l.price) { brandMap[b].totalPrice += l.price; brandMap[b].count++ }
  })
  const brandData = Object.entries(brandMap)
    .map(([name, d]) => ({
      name,
      count: d.total,
      avgPrice: d.count > 0 ? Math.round(d.totalPrice / d.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // ── Country data — normalize codes to uppercase to avoid duplicates ────────
  const countryMap: Record<string, number> = {}
  listings.forEach(l => {
    if (l.country) {
      const code = l.country.toUpperCase()
      countryMap[code] = (countryMap[code] ?? 0) + 1
    }
  })
  const countryData = Object.entries(countryMap)
    .map(([code, count]) => ({ name: COUNTRY_LABELS[code]?.replace(/^.+ /, '') ?? code, count }))
    .sort((a, b) => b.count - a.count)

  // ── Status data ───────────────────────────────────────────────────────────
  const statusMap: Record<string, number> = {}
  listings.forEach(l => { statusMap[l.status] = (statusMap[l.status] ?? 0) + 1 })
  const statusData = Object.entries(statusMap)
    .map(([status, count]) => ({ name: STATUS_LABELS[status] ?? status, count, status }))

  // ── Monthly evolution (last 6 months) ────────────────────────────────────
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const count = listings.filter(l => {
      if (!l.created_at) return false
      const ld = new Date(l.created_at)
      return ld.getFullYear() === year && ld.getMonth() === month
    }).length
    return { label: `${MONTHS_FR[month]} ${year.toString().slice(2)}`, count }
  })

  // ── Top 5 best deals ──────────────────────────────────────────────────────
  const top5 = listings
    .map(l => ({ ...l, score: getFinalScore(l.auto_score, l.manual_score) }))
    .filter(l => l.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5)

  // ── Performance by client (top 5) ─────────────────────────────────────────
  const clientMap: Record<string, { name: string; total: number; bought: number }> = {}
  listings.forEach(l => {
    const client = l.clients
    if (!client?.name) return
    const key = client.name
    if (!clientMap[key]) clientMap[key] = { name: key, total: 0, bought: 0 }
    clientMap[key].total++
    if (l.status === 'bought' || l.status === 'resold') clientMap[key].bought++
  })
  const clientData = Object.values(clientMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // ── Score distribution (histogram by buckets of 10) ───────────────────────
  const scoreBuckets = Array.from({ length: 10 }, (_, i) => {
    const min = i * 10
    const max = min + 10
    const count = withScore.filter(s => s >= min && (i === 9 ? s <= 100 : s < max)).length
    return { label: `${min}-${max}`, min, count }
  })

  // ── Average time by terminal status (in days) ─────────────────────────────
  const timeByStatus: Record<string, { total: number; count: number }> = {}
  listings.forEach(l => {
    if (!['bought', 'resold', 'ignored'].includes(l.status)) return
    if (!l.created_at || !l.updated_at) return
    const created = new Date(l.created_at).getTime()
    const updated = new Date(l.updated_at).getTime()
    const days = Math.round((updated - created) / (1000 * 60 * 60 * 24))
    if (days < 0) return
    if (!timeByStatus[l.status]) timeByStatus[l.status] = { total: 0, count: 0 }
    timeByStatus[l.status].total += days
    timeByStatus[l.status].count++
  })
  const timeData = Object.entries(timeByStatus)
    .map(([status, { total, count }]) => ({
      name: STATUS_LABELS[status] ?? status,
      avgDays: count > 0 ? Math.round(total / count) : 0,
    }))

  const kpis = [
    { label: 'Total annonces', value: total, color: 'text-gray-100' },
    { label: 'Prix moyen', value: formatPrice(avgPrice), color: 'text-orange-400' },
    { label: 'KM moyen', value: avgKm ? `${avgKm.toLocaleString('fr-FR')} km` : '—', color: 'text-gray-100' },
    { label: 'Score moyen', value: avgScore ? `${avgScore}/100` : '—', color: 'text-blue-400' },
    { label: 'Bonnes affaires (≥70)', value: goodDeals, color: 'text-green-400' },
    { label: 'Achetées', value: bought, color: 'text-teal-400' },
    { label: 'Marge totale', value: formatPrice(totalMargin), color: totalMargin >= 0 ? 'text-green-400' : 'text-red-400' },
  ]

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-lg p-3 text-xs">
        <p className="text-gray-300 font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-orange-400">{typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}</p>
        ))}
      </div>
    )
  }

  return (
    <>
      <KeyboardShortcuts />
      <Header title="Statistiques" />

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 overflow-x-hidden">

          {total === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p>Aucune donnée disponible.</p>
              <p className="text-sm mt-1">Ajoutez des annonces pour voir les statistiques.</p>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {kpis.map(kpi => (
                  <Card key={kpi.label}>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                      <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Évolution mensuelle */}
              {monthlyData.some(d => d.count > 0) && (
                <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">📈 Évolution mensuelle (6 derniers mois)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                      <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top 5 meilleures affaires */}
              {top5.length > 0 && (
                <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">🏆 Top 5 meilleures affaires</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[400px]">
                      <thead>
                        <tr className="border-b border-[#1a1f2e]">
                          {['Véhicule', 'Année', 'Prix', 'Score', 'Statut'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1f2e]">
                        {top5.map((l, i) => (
                          <tr key={l.id} className="hover:bg-[#0a0d14] transition-colors">
                            <td className="px-3 py-2.5 text-gray-200 font-medium whitespace-nowrap">
                              <span className="text-gray-500 mr-2">#{i + 1}</span>
                              {l.brand} {l.model}
                            </td>
                            <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{l.year ?? '—'}</td>
                            <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">
                              {l.price != null ? formatPrice(l.price) : '—'}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span
                                className="font-bold"
                                style={{ color: (l.score ?? 0) >= 70 ? '#4ade80' : (l.score ?? 0) >= 40 ? '#f97316' : '#f87171' }}
                              >
                                {l.score}/100
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className="text-xs text-gray-400 bg-[#1a1f2e] px-2 py-0.5 rounded-full">
                                {STATUS_LABELS[l.status] ?? l.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prix moyen par marque */}
                {brandData.length > 0 && (
                  <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Prix moyen par marque</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={brandData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <XAxis
                          type="number"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          tickFormatter={v => `${(v / 1000).toFixed(0)}k€`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: '#9ca3af', fontSize: 11 }}
                          width={100}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avgPrice" fill="#f97316" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Répartition par statut */}
                {statusData.length > 0 && (
                  <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Répartition par statut</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                          labelLine={false}
                        >
                          {statusData.map((entry, i) => (
                            <Cell key={i} fill={STATUS_COLORS_CHART[entry.status] ?? COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Répartition par pays */}
                {countryData.length > 0 && (
                  <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Répartition par pays</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={countryData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <XAxis
                          type="number"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: '#9ca3af', fontSize: 11 }}
                          width={100}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Nb annonces par marque */}
                {brandData.length > 0 && (
                  <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Volume par marque</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={brandData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <XAxis
                          type="number"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: '#9ca3af', fontSize: 11 }}
                          width={100}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Performance par client */}
                {clientData.length > 0 && (
                  <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">👥 Performance par client (top 5)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={clientData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <XAxis
                          type="number"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: '#9ca3af', fontSize: 11 }}
                          width={100}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            const d = clientData.find(c => c.name === label)
                            return (
                              <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-lg p-3 text-xs">
                                <p className="text-gray-300 font-medium mb-1">{label}</p>
                                <p className="text-orange-400">{d?.total} annonce{(d?.total ?? 0) > 1 ? 's' : ''} au total</p>
                                <p className="text-green-400">{d?.bought} achetée{(d?.bought ?? 0) > 1 ? 's' : ''}</p>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Total" />
                        <Bar dataKey="bought" fill="#10b981" radius={[0, 4, 4, 0]} name="Achetées" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Distribution des scores */}
                {withScore.length > 0 && (
                  <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">🎯 Distribution des scores</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scoreBuckets} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                        <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {scoreBuckets.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.min >= 70 ? '#4ade80' : entry.min >= 40 ? '#f97316' : '#f87171'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Temps moyen par statut */}
              {timeData.length > 0 && (
                <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0d1117]">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">⏱ Temps moyen par statut (en jours)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {timeData.map(d => (
                      <div key={d.name} className="p-4 rounded-lg bg-[#0a0d14] border border-[#1a1f2e] text-center">
                        <p className="text-2xl font-bold text-orange-400">{d.avgDays}j</p>
                        <p className="text-xs text-gray-500 mt-1">{d.name}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">entre ajout et changement de statut</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
