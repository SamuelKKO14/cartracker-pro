'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { ListingFormModal } from '@/components/listings/listing-form-modal'
import type { ListingInitialData } from '@/components/listings/listing-form-modal'
import { SmartImport } from '@/components/import/smart-import'
import {
  formatPrice, formatKm, getFinalScore, getScoreColor,
  STATUS_LABELS, STATUS_COLORS
} from '@/lib/utils'
import {
  Users, Car, TrendingUp, Euro, ShoppingCart,
  ArrowRight, Sparkles,
  BarChart3, Plus, ExternalLink, Calculator, GripVertical,
} from 'lucide-react'
import { AnimatedGradientText } from '@/components/ui/magicui/AnimatedGradientText'

// ── Types ────────────────────────────────────────────────

interface KPIs {
  activeClients: number
  totalListings: number
  negotiationCount: number
  totalPositiveMargin: number
  resoldCount: number
}

interface Finance {
  totalMargin: number
  resoldCount: number
  avgMargin: number
  monthCA: number
}

interface DashboardListing {
  id: string; brand: string; model: string | null; year: number | null; km: number | null
  price: number | null; status: string; fuel: string | null; auto_score: number | null
  manual_score: number | null; created_at: string; client_id: string | null; source: string | null
  clients: { name: string } | null
  listing_margins: Array<{ margin: number | null }> | null
}

interface DashboardClientRow {
  id: string; name: string; budget: number | null; notes: string | null
  updated_at: string; listingCount: number
}

interface DashboardProps {
  firstName: string | null
  kpis: KPIs
  recentListings: DashboardListing[]
  recentClients: DashboardClientRow[]
  finance: Finance
  allClients: { id: string; name: string }[]
}

type SectionId = 'import' | 'listingsClients' | 'finance'

const DEFAULT_ORDER: SectionId[] = ['import', 'listingsClients', 'finance']
const LS_KEY = 'dashboard_section_order'

function loadOrder(): SectionId[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_ORDER
    const parsed = JSON.parse(raw) as SectionId[]
    if (
      parsed.length === DEFAULT_ORDER.length &&
      DEFAULT_ORDER.every(id => parsed.includes(id))
    ) return parsed
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: d, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

// ── Component ────────────────────────────────────────────────

export function DashboardClient({
  firstName, kpis, recentListings, recentClients, finance, allClients
}: DashboardProps) {
  const router = useRouter()

  // Section order (DnD)
  const [order, setOrder] = useState<SectionId[]>(DEFAULT_ORDER)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragSrcIdx = useRef<number | null>(null)

  useEffect(() => {
    setOrder(loadOrder())
  }, [])

  const handleDragStart = useCallback((idx: number) => {
    dragSrcIdx.current = idx
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault()
    const srcIdx = dragSrcIdx.current
    if (srcIdx === null || srcIdx === dropIdx) {
      setDragOverIdx(null)
      return
    }
    setOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(srcIdx, 1)
      next.splice(dropIdx, 0, moved)
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    dragSrcIdx.current = null
    setDragOverIdx(null)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragSrcIdx.current = null
    setDragOverIdx(null)
  }, [])

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false)
  const [formInitialData, setFormInitialData] = useState<ListingInitialData | undefined>(undefined)
  const [formDefaultClientId, setFormDefaultClientId] = useState<string | undefined>(undefined)

  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date())

  function openNewListing() {
    setFormInitialData(undefined)
    setFormDefaultClientId(undefined)
    setShowFormModal(true)
  }

  // ── Section renderers ──────────────────────────────────────

  function renderImport() {
    return (
      <SmartImport allClients={allClients} onListingCreated={() => router.refresh()} />
    )
  }

  function renderListingsClients() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Annonces récentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-purple-400" /> Annonces récentes
            </span>
            <Link href="/annonces">
              <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                Voir toutes <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          {recentListings.length === 0 ? (
            <EmptyState message="Aucune annonce" action={{ label: 'Ajouter', onClick: openNewListing }} />
          ) : (
            <div className="space-y-2">
              {recentListings.map((listing, i) => {
                const score = getFinalScore(listing.auto_score, listing.manual_score)
                const margin = listing.listing_margins?.[0]?.margin
                return (
                  <motion.div
                    key={listing.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={i * 0.05}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-200 truncate">{listing.brand} {listing.model}</span>
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
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.04] ${getScoreColor(score)}`}>
                          {score}
                        </span>
                      )}
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/annonces?id=${listing.id}`}>
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-200 transition-colors" title="Voir">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <Link href={`/annonces?id=${listing.id}&margin=1`}>
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-orange-400 transition-colors" title="Calculer marge">
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Clients actifs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-400" /> Clients actifs
            </span>
            <Link href="/clients">
              <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                Voir tous <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          {recentClients.length === 0 ? (
            <EmptyState message="Aucun client" action={{ label: 'Ajouter un client', href: '/clients' }} />
          ) : (
            <div className="space-y-2">
              {recentClients.map((client, i) => (
                <motion.div
                  key={client.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i * 0.05}
                >
                  <Link href={`/clients/${client.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all">
                      <div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                        {client.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{client.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {client.budget && <span className="text-xs text-gray-500">Budget : {formatPrice(client.budget)}</span>}
                          {client.notes && <span className="text-xs text-gray-600 truncate max-w-[140px]">{client.notes}</span>}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.08]">
                        {client.listingCount} ann.
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
              <Link href="/clients">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/[0.08] text-xs text-gray-500 hover:text-orange-400 hover:border-orange-500/40 transition-all mt-1">
                  <Plus className="w-3.5 h-3.5" /> Nouveau client
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderFinance() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-teal-400" /> Finance
          </span>
          <Link href="/finance">
            <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
              Statistiques <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FinanceCard label="Marge totale" value={formatPrice(finance.totalMargin)} color="text-green-400" />
          <FinanceCard label="Revendus" value={String(finance.resoldCount)} color="text-blue-400" />
          <FinanceCard label="Marge moy." value={finance.resoldCount > 0 ? formatPrice(finance.avgMargin) : '—'} color="text-orange-400" />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">CA mois en cours</p>
              <p className="text-lg font-bold text-white">{formatPrice(finance.monthCA)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Marge moy./véhicule</p>
              <p className="text-lg font-bold text-white">{finance.resoldCount > 0 ? formatPrice(finance.avgMargin) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Véhicules vendus</p>
              <p className="text-lg font-bold text-white">{finance.resoldCount}</p>
            </div>
          </div>
          <Link href="/finance">
            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:text-orange-400 hover:border-orange-500/40 transition-all">
              Voir les finances <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const SECTION_META: Record<SectionId, { title: string; icon: React.ReactNode }> = {
    import: { title: 'Import Intelligent', icon: <Sparkles className="w-3.5 h-3.5 text-orange-400" /> },
    listingsClients: { title: 'Annonces & Clients', icon: <Car className="w-3.5 h-3.5 text-purple-400" /> },
    finance: { title: 'Finance', icon: <BarChart3 className="w-3.5 h-3.5 text-teal-400" /> },
  }

  const SECTION_RENDER: Record<SectionId, () => React.ReactNode> = {
    import: renderImport,
    listingsClients: renderListingsClients,
    finance: renderFinance,
  }

  return (
    <>
      <KeyboardShortcuts onNewListing={openNewListing} />
      <Header title="Dashboard" onNewListing={openNewListing} />

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs text-gray-500 capitalize">{today}</p>
            <h2 className="text-xl font-semibold text-gray-100 mt-0.5">
              Bonjour{firstName ? <>, <AnimatedGradientText>{firstName}</AnimatedGradientText></> : ''} !
            </h2>
          </motion.div>

          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { icon: <Users className="w-4 h-4" />, label: 'Clients actifs', value: kpis.activeClients, color: 'blue' as const, href: '/clients' },
              { icon: <Car className="w-4 h-4" />, label: 'Annonces', value: kpis.totalListings, color: 'purple' as const, href: '/annonces' },
              { icon: <TrendingUp className="w-4 h-4" />, label: 'En négociation', value: kpis.negotiationCount, color: 'orange' as const, href: '/annonces?status=negotiation' },
              { icon: <Euro className="w-4 h-4" />, label: 'Marge potentielle', value: formatPrice(kpis.totalPositiveMargin), color: 'teal' as const, href: '/finance', isText: true },
              { icon: <ShoppingCart className="w-4 h-4" />, label: 'Véhicules vendus', value: kpis.resoldCount, color: 'green' as const, href: '/finance' },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i * 0.05}
              >
                <KPICard {...kpi} />
              </motion.div>
            ))}
          </div>

          {/* ── DRAGGABLE SECTIONS ── */}
          <div className="space-y-4">
            {order.map((sectionId, idx) => {
              const meta = SECTION_META[sectionId]
              const isDragOver = dragOverIdx === idx
              const isDragging = dragSrcIdx.current === idx
              return (
                <motion.div
                  key={sectionId}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.2 + idx * 0.1}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-xl border backdrop-blur-sm transition-all duration-200 ${
                    isDragOver
                      ? 'border-orange-500/40 bg-orange-500/[0.03] shadow-[0_0_30px_rgba(249,115,22,0.08)]'
                      : isDragging
                      ? 'border-white/[0.04] bg-white/[0.01] opacity-50'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] cursor-grab active:cursor-grabbing select-none">
                    <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                      {meta.icon}
                      {meta.title}
                    </span>
                  </div>
                  <div className="p-4">
                    {SECTION_RENDER[sectionId]()}
                  </div>
                </motion.div>
              )
            })}
          </div>

        </div>
      </div>

      {showFormModal && (
        <ListingFormModal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSaved={() => {
            setShowFormModal(false)
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
  icon, label, value, color, isText, href,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'blue' | 'purple' | 'green' | 'orange' | 'teal' | 'pink'
  isText?: boolean
  href?: string
}) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    green: 'text-green-400 bg-green-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    teal: 'text-teal-400 bg-teal-500/10',
    pink: 'text-pink-400 bg-pink-500/10',
  }
  const inner = (
    <div className="relative p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-200 h-full">
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
    <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center space-y-1">
      <p className="text-gray-500 text-sm">{message}</p>
      {inner}
    </div>
  )
}
