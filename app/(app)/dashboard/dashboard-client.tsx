'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { ListingFormModal } from '@/components/listings/listing-form-modal'
import type { ListingInitialData } from '@/components/listings/listing-form-modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  formatPrice, formatKm, getFinalScore, getScoreColor,
  STATUS_LABELS, STATUS_COLORS
} from '@/lib/utils'
import {
  Users, Car, TrendingUp, Euro, Newspaper,
  ArrowRight, Sparkles, Loader2, AlertCircle,
  BarChart3, Plus, ExternalLink, Calculator
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────

interface KPIs {
  activeClients: number
  totalListings: number
  negotiationCount: number
  totalPositiveMargin: number
  blogCount: number
}

interface Finance {
  totalMargin: number
  resoldCount: number
  avgMargin: number
}

interface DashboardProps {
  firstName: string | null
  kpis: KPIs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentListings: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentClients: any[]
  finance: Finance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blogPosts: any[]
  allClients: { id: string; name: string }[]
}

const AI_PREVIEW_FIELDS: { key: keyof ListingInitialData; label: string; format?: (v: unknown) => string }[] = [
  { key: 'brand', label: 'Marque' },
  { key: 'model', label: 'Modèle' },
  { key: 'year', label: 'Année' },
  { key: 'km', label: 'Km', format: v => v != null ? `${(v as number).toLocaleString('fr-FR')} km` : '' },
  { key: 'price', label: 'Prix', format: v => v != null ? `${(v as number).toLocaleString('fr-FR')} €` : '' },
  { key: 'fuel', label: 'Carburant' },
  { key: 'gearbox', label: 'Boîte' },
  { key: 'country', label: 'Pays' },
  { key: 'seller', label: 'Vendeur' },
]

// ── Component ────────────────────────────────────────────────

export function DashboardClient({
  firstName, kpis, recentListings, recentClients, finance, blogPosts, allClients
}: DashboardProps) {
  const router = useRouter()

  // AI import state
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<ListingInitialData | null>(null)
  const [aiClientId, setAiClientId] = useState<string>('')

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false)
  const [formInitialData, setFormInitialData] = useState<ListingInitialData | undefined>(undefined)
  const [formDefaultClientId, setFormDefaultClientId] = useState<string | undefined>(undefined)

  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date())

  async function handleAnalyze() {
    if (!aiText.trim()) return
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    try {
      const res = await fetch('/api/analyze-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setAiError(json.error ?? 'Erreur inconnue')
      } else {
        setAiResult(json.data)
      }
    } catch {
      setAiError('Erreur réseau')
    } finally {
      setAiLoading(false)
    }
  }

  function openFormWithResult() {
    if (!aiResult) return
    setFormInitialData(aiResult)
    setFormDefaultClientId(aiClientId || undefined)
    setShowFormModal(true)
  }

  return (
    <>
      <KeyboardShortcuts onNewListing={() => { setFormInitialData(undefined); setFormDefaultClientId(undefined); setShowFormModal(true) }} />
      <Header title="Dashboard" onNewListing={() => { setFormInitialData(undefined); setFormDefaultClientId(undefined); setShowFormModal(true) }} />

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">

          {/* ── HEADER ── */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500 capitalize">{today}</p>
              <h2 className="text-xl font-semibold text-gray-100 mt-0.5">
                Bonjour{firstName ? `, ${firstName}` : ''} 👋
              </h2>
            </div>
          </div>

          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard icon={<Users className="w-4 h-4" />} label="Clients actifs" value={kpis.activeClients} color="blue" href="/clients" />
            <KPICard icon={<Car className="w-4 h-4" />} label="Annonces" value={kpis.totalListings} color="purple" href="/annonces" />
            <KPICard icon={<TrendingUp className="w-4 h-4" />} label="En négociation" value={kpis.negotiationCount} color="orange" href="/annonces?status=negotiation" />
            <KPICard icon={<Euro className="w-4 h-4" />} label="Marge potentielle" value={formatPrice(kpis.totalPositiveMargin)} color="teal" isText href="/finance" />
            <KPICard icon={<Newspaper className="w-4 h-4" />} label="Articles publiés" value={kpis.blogCount} color="pink" href="/blog" />
          </div>

          {/* ── IMPORT INTELLIGENT ── */}
          <section className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Import Intelligent
            </h3>

            <p className="text-sm text-gray-500">
              Collez le texte brut d'une annonce (depuis AutoScout24, LeBonCoin, mobile.de…) et l'IA extrait automatiquement toutes les données.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Textarea
                  placeholder={"BMW 320d xDrive Touring – 2021\n45 000 km · Diesel · Automatique\nPrix : 28 900 €\n1ère main · Vendeur pro – Allemagne"}
                  value={aiText}
                  onChange={e => { setAiText(e.target.value); setAiError(null); setAiResult(null) }}
                  className="min-h-[110px] text-sm"
                />
              </div>
              <div className="flex flex-col gap-2 sm:w-48">
                <select
                  value={aiClientId}
                  onChange={e => setAiClientId(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#2a2f3e] bg-[#0a0d14] px-3 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Sans client</option>
                  {allClients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Button
                  onClick={handleAnalyze}
                  disabled={aiLoading || !aiText.trim()}
                  variant="secondary"
                  className="w-full"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiLoading ? 'Analyse…' : 'Analyser'}
                </Button>
                {aiResult && (
                  <Button
                    onClick={openFormWithResult}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Créer l'annonce
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {aiError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {aiError}
              </div>
            )}

            {aiResult && (
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-x-4 gap-y-1.5 pt-1">
                {AI_PREVIEW_FIELDS.map(({ key, label, format }) => {
                  const raw = aiResult[key]
                  const value = format ? format(raw) : (raw != null ? String(raw) : '')
                  const found = raw != null && raw !== ''
                  return (
                    <div key={key} className="flex items-center gap-1.5 text-xs min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${found ? 'bg-green-500' : 'bg-gray-700'}`} />
                      <span className="text-gray-500 shrink-0">{label} :</span>
                      <span className={`truncate font-medium ${found ? 'text-gray-200' : 'text-gray-600'}`}>
                        {found ? value : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── ANNONCES + CLIENTS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Annonces récentes */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Car className="w-4 h-4 text-purple-400" />
                  Annonces récentes
                </h3>
                <Link href="/annonces">
                  <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                    Voir toutes <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>

              {recentListings.length === 0 ? (
                <EmptyState message="Aucune annonce" action={{ label: 'Ajouter une annonce', onClick: () => { setFormInitialData(undefined); setFormDefaultClientId(undefined); setShowFormModal(true) } }} />
              ) : (
                <div className="space-y-2">
                  {recentListings.map(listing => {
                    const score = getFinalScore(listing.auto_score, listing.manual_score)
                    const margin = listing.listing_margins?.[0]?.margin
                    return (
                      <div
                        key={listing.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[#1a1f2e] bg-[#0d1117] hover:border-[#2a2f3e] transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-200 truncate">
                              {listing.brand} {listing.model}
                            </span>
                            {listing.year && <span className="text-xs text-gray-500">{listing.year}</span>}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[listing.status] ?? STATUS_COLORS.new}`}>
                              {STATUS_LABELS[listing.status] ?? listing.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {listing.km && <span className="text-xs text-gray-500">{formatKm(listing.km)}</span>}
                            {listing.price && <span className="text-xs font-semibold text-orange-400">{formatPrice(listing.price)}</span>}
                            {margin != null && (
                              <span className={`text-xs font-medium ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {margin >= 0 ? '+' : ''}{formatPrice(margin)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {score != null && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border border-[#2a2f3e] bg-[#0a0d14]/80 ${getScoreColor(score)}`}>
                              {score}
                            </span>
                          )}
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/annonces?id=${listing.id}`}>
                              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#1a1f2e] text-gray-500 hover:text-gray-200 transition-colors" title="Voir">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                            <Link href={`/annonces?id=${listing.id}&margin=1`}>
                              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#1a1f2e] text-gray-500 hover:text-orange-400 transition-colors" title="Calculer marge">
                                <Calculator className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Clients actifs */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Clients actifs
                </h3>
                <div className="flex items-center gap-2">
                  <Link href="/clients">
                    <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                      Voir tous <ArrowRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>

              {recentClients.length === 0 ? (
                <EmptyState message="Aucun client" action={{ label: 'Ajouter un client', href: '/clients' }} />
              ) : (
                <div className="space-y-2">
                  {recentClients.map(client => (
                    <Link key={client.id} href={`/clients/${client.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-[#1a1f2e] bg-[#0d1117] hover:border-[#2a2f3e] transition-colors">
                        <div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                          {client.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{client.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {client.budget && (
                              <span className="text-xs text-gray-500">Budget : {formatPrice(client.budget)}</span>
                            )}
                            {client.notes && (
                              <span className="text-xs text-gray-600 truncate max-w-[140px]">{client.notes}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0 bg-[#0a0d14] px-2 py-0.5 rounded-full border border-[#1a1f2e]">
                          {client.listingCount} ann.
                        </span>
                      </div>
                    </Link>
                  ))}
                  <Link href="/clients">
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[#2a2f3e] text-xs text-gray-500 hover:text-orange-400 hover:border-orange-500/40 transition-colors mt-1">
                      <Plus className="w-3.5 h-3.5" />
                      Nouveau client
                    </button>
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* ── FINANCE + BLOG ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Finance */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  Finance
                </h3>
                <Link href="/finance">
                  <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                    Statistiques <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FinanceCard label="Marge totale" value={formatPrice(finance.totalMargin)} color="text-green-400" />
                <FinanceCard label="Véhicules revendus" value={String(finance.resoldCount)} color="text-blue-400" />
                <FinanceCard
                  label="Marge moyenne"
                  value={finance.resoldCount > 0 ? formatPrice(finance.avgMargin) : '—'}
                  color="text-orange-400"
                />
              </div>
            </section>

            {/* Blog */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-pink-400" />
                  Blog
                </h3>
                <div className="flex items-center gap-2">
                  <Link href="/blog/nouveau">
                    <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                      <Plus className="w-3 h-3" /> Nouvel article
                    </button>
                  </Link>
                  <Link href="/blog">
                    <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors ml-2">
                      Voir le blog <ArrowRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>

              {blogPosts.length === 0 ? (
                <EmptyState message="Aucun article publié" action={{ label: 'Écrire un article', href: '/blog/nouveau' }} />
              ) : (
                <div className="space-y-2">
                  {blogPosts.map(post => {
                    const excerpt = post.excerpt || (post.content ?? '').replace(/<[^>]*>/g, '').slice(0, 150)
                    const date = new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                    return (
                      <Link key={post.id} href={`/blog/${post.slug}`}>
                        <div className="p-3 rounded-lg border border-[#1a1f2e] bg-[#0d1117] hover:border-[#2a2f3e] transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-200 truncate">{post.title}</p>
                            <span className="text-[10px] text-gray-600 shrink-0">{date}</span>
                          </div>
                          {excerpt && (
                            <p className="text-xs text-gray-500 line-clamp-2">{excerpt}</p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>

      {showFormModal && (
        <ListingFormModal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSaved={() => {
            setShowFormModal(false)
            setAiResult(null)
            setAiText('')
            router.refresh()
          }}
          initialData={formInitialData}
          defaultClientId={formDefaultClientId}
        />
      )}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────

function KPICard({
  icon, label, value, color, isText, href
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'blue' | 'purple' | 'green' | 'orange' | 'teal' | 'pink'
  isText?: boolean
  href?: string
}) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-900/20',
    purple: 'text-purple-400 bg-purple-900/20',
    green: 'text-green-400 bg-green-900/20',
    orange: 'text-orange-400 bg-orange-900/20',
    teal: 'text-teal-400 bg-teal-900/20',
    pink: 'text-pink-400 bg-pink-900/20',
  }
  const inner = (
    <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0d1117] hover:border-[#2a2f3e] transition-colors h-full">
      <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg mb-2.5 ${colorMap[color]}`}>
        <span className={colorMap[color].split(' ')[0]}>{icon}</span>
      </div>
      <p className="text-xs text-gray-500 mb-0.5 leading-tight">{label}</p>
      <p className={`font-bold ${isText ? 'text-base' : 'text-2xl'} text-gray-100`}>{value}</p>
    </div>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

function FinanceCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-lg border border-[#1a1f2e] bg-[#0d1117] text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}

function EmptyState({
  message, action
}: {
  message: string
  action?: { label: string; onClick?: () => void; href?: string }
}) {
  const inner = action?.href ? (
    <Link href={action.href}>
      <span className="text-orange-400 text-xs hover:underline cursor-pointer">{action.label}</span>
    </Link>
  ) : action?.onClick ? (
    <button onClick={action.onClick} className="text-orange-400 text-xs hover:underline">{action.label}</button>
  ) : null

  return (
    <div className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-5 text-center space-y-1">
      <p className="text-gray-500 text-sm">{message}</p>
      {inner}
    </div>
  )
}
