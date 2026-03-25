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
  PieChart, Pie, Cell, Legend
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

export default function StatsPage() {
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('listings')
        .select('*, listing_margins(*)')
        .eq('user_id', user.id)

      setListings((data as ListingWithDetails[]) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">Chargement…</div>
    )
  }

  // KPIs
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

  // Brand data
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

  // Country data
  const countryMap: Record<string, number> = {}
  listings.forEach(l => { if (l.country) countryMap[l.country] = (countryMap[l.country] ?? 0) + 1 })
  const countryData = Object.entries(countryMap)
    .map(([code, count]) => ({ name: COUNTRY_LABELS[code]?.replace(/^.+ /, '') ?? code, count }))
    .sort((a, b) => b.count - a.count)

  // Status data
  const statusMap: Record<string, number> = {}
  listings.forEach(l => { statusMap[l.status] = (statusMap[l.status] ?? 0) + 1 })
  const statusData = Object.entries(statusMap)
    .map(([status, count]) => ({ name: STATUS_LABELS[status] ?? status, count, status }))

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
        <div className="p-6 max-w-6xl mx-auto space-y-6">

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
                          width={60}
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
                          label={false}
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
                          width={80}
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
                          width={60}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
