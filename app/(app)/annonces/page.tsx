'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { ListingFormModal } from '@/components/listings/listing-form-modal'
import { MarginModal } from '@/components/listings/margin-modal'
import { ChecklistModal } from '@/components/listings/checklist-modal'
import { ShareModal } from '@/components/listings/share-modal'
import { ComparePanel } from '@/components/listings/compare-panel'
import { PhotosModal } from '@/components/listings/photos-modal'
import { ListingsGrid } from '@/components/listings/listings-grid'
import { ListingsTable } from '@/components/listings/listings-table'
import { ListingsKanban } from '@/components/listings/listings-kanban'
import { FiltersPanel, applyFilters, hasActiveFilters, INITIAL_FILTERS } from '@/components/listings/filters-panel'
import type { FilterState } from '@/components/listings/filters-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Grid3X3, Table, Kanban, Search, SlidersHorizontal, Share2, GitCompare, X,
  ArrowLeft, Pencil, Calculator, CheckSquare, ExternalLink, Camera, Flag,
} from 'lucide-react'
import {
  formatPrice, formatKm, STATUS_LABELS, STATUS_COLORS, COUNTRY_LABELS,
  getFinalScore, getScoreColor,
} from '@/lib/utils'
import type { ListingWithDetails, Client, Listing } from '@/types/database'

type ViewMode = 'grid' | 'table' | 'kanban'

// ─── Detail view ──────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  )
}

function ListingDetailView({
  listing: initialListing,
  onBack,
  onRefresh,
}: {
  listing: ListingWithDetails
  onBack: () => void
  onRefresh: () => void
}) {
  const [listing, setListing] = useState(initialListing)
  const [activeModal, setActiveModal] = useState<'edit' | 'margin' | 'checklist' | null>(null)
  const [markingSold, setMarkingSold] = useState(false)
  const [sellPrice, setSellPrice] = useState('')
  const [saving, setSaving] = useState(false)

  async function refetchListing() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('listings')
      .select('*, clients(id, name, budget, criteria), listing_margins(*), listing_checklist(*), listing_photos(*)')
      .eq('id', listing.id)
      .single()
    if (error) console.error('Erreur refetch:', error.message)
    if (data) setListing(data as ListingWithDetails)
    onRefresh()
  }

  async function handleMarkSold() {
    const price = parseInt(sellPrice)
    if (!price || price <= 0) { alert('Entrez un prix de vente valide'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const soldAt = new Date().toISOString()

      const { error: updateErr } = await supabase.from('listings').update({
        status: 'resold',
        sold_price: price,
        sold_at: soldAt,
        updated_at: soldAt,
      }).eq('id', listing.id)
      if (updateErr) { console.error('Erreur update listing:', updateErr.message); return }

      const marginData = listing.listing_margins?.[0] ?? null
      const totalCost = marginData?.total_cost ?? marginData?.buy_price ?? null
      const margin = totalCost !== null ? price - totalCost : null
      const marginPct = margin !== null && marginData?.buy_price
        ? parseFloat(((margin / marginData.buy_price) * 100).toFixed(2))
        : null

      const { error: insertErr } = await supabase.from('transactions').insert({
        user_id: user.id,
        listing_id: listing.id,
        brand: listing.brand,
        model: listing.model,
        year: listing.year,
        buy_price: marginData?.buy_price ?? null,
        sell_price: price,
        total_cost: totalCost,
        margin,
        margin_pct: marginPct,
        sold_at: soldAt,
      })
      if (insertErr) console.error('Erreur insert transaction:', insertErr.message)

      onRefresh()
      onBack()
    } finally {
      setSaving(false)
    }
  }

  const score = getFinalScore(listing.auto_score, listing.manual_score)
  const margin = listing.listing_margins?.[0]?.margin ?? null
  const checklist = listing.listing_checklist?.[0] ?? null
  const checklistCount = checklist
    ? Object.entries(checklist)
        .filter(([k]) => !['id', 'user_id', 'listing_id', 'notes', 'created_at'].includes(k))
        .filter(([, v]) => v === true).length
    : 0
  const photos = listing.listing_photos ?? []
  const m = listing.listing_margins?.[0]

  return (
    <div className="flex-1 overflow-y-auto pt-14">
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux annonces
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {listing.brand} {listing.model}
              {listing.generation ? <span className="text-gray-500 font-normal text-lg ml-2">{listing.generation}</span> : null}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[listing.status] ?? ''}`}>
                {STATUS_LABELS[listing.status] ?? listing.status}
              </span>
              {score != null && (
                <span className={`text-xs font-bold ${getScoreColor(score)}`}>Score {score}/100</span>
              )}
              {listing.first_owner && <span className="text-xs text-teal-400 border border-teal-800/50 px-1.5 py-0.5 rounded">1ère main</span>}
            </div>
          </div>

          {/* Action tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveModal('edit')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[#2a2f3e] bg-[#0d1117] text-gray-300 hover:bg-[#1a1f2e] hover:text-white transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
            <button
              onClick={() => setActiveModal('margin')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[#2a2f3e] bg-[#0d1117] text-gray-300 hover:bg-[#1a1f2e] hover:text-white transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" /> Marge
            </button>
            <button
              onClick={() => setActiveModal('checklist')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[#2a2f3e] bg-[#0d1117] text-gray-300 hover:bg-[#1a1f2e] hover:text-white transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" /> Checklist
            </button>
            {listing.url && (
              <a
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[#2a2f3e] bg-[#0d1117] text-gray-300 hover:bg-[#1a1f2e] hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Source
              </a>
            )}
          </div>
        </div>

        {/* Photo strip */}
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map(p => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.url}
                alt=""
                className="h-32 w-48 object-cover rounded-lg flex-shrink-0 border border-[#1a1f2e]"
              />
            ))}
          </div>
        )}

        {/* Characteristics */}
        <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0a0d14]">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Caractéristiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <InfoRow label="Marque" value={listing.brand} />
            <InfoRow label="Modèle" value={listing.model} />
            <InfoRow label="Génération" value={listing.generation} />
            <InfoRow label="Année" value={listing.year} />
            <InfoRow label="Kilométrage" value={listing.km ? formatKm(listing.km) : null} />
            <InfoRow label="Prix" value={listing.price ? formatPrice(listing.price) : null} />
            <InfoRow label="Carburant" value={listing.fuel} />
            <InfoRow label="Boîte" value={listing.gearbox} />
            <InfoRow label="Carrosserie" value={listing.body} />
            <InfoRow label="Puissance" value={listing.horsepower ? `${listing.horsepower} ch` : null} />
            <InfoRow label="Couleur" value={listing.color} />
            <InfoRow label="Pays" value={listing.country ? COUNTRY_LABELS[listing.country] : null} />
            <InfoRow label="Vendeur" value={listing.seller} />
            <InfoRow label="Source" value={listing.source} />
            <InfoRow label="Client associé" value={(listing.clients as { name?: string } | null)?.name ?? (listing.client as { name?: string } | null)?.name} />
          </div>
          {listing.tags && listing.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {listing.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-orange-900/20 text-orange-400 border border-orange-800/30">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {listing.notes && (
            <p className="mt-4 text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{listing.notes}</p>
          )}
        </div>

        {/* Marge résumé */}
        {m && (
          <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0a0d14]">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Marge calculée</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow label="Prix d'achat" value={m.buy_price ? formatPrice(m.buy_price) : null} />
              <InfoRow label="Total charges" value={m.total_cost ? formatPrice(m.total_cost) : null} />
              <InfoRow label="Prix de vente" value={m.sell_price ? formatPrice(m.sell_price) : null} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500">Marge nette</span>
                <span className={`text-sm font-bold ${margin !== null ? (margin >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                  {margin !== null ? formatPrice(margin) : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Checklist résumé */}
        {checklist && (
          <div className="p-5 rounded-xl border border-[#1a1f2e] bg-[#0a0d14]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist pré-achat</h2>
              <span className="text-xs text-gray-400">{checklistCount}/12</span>
            </div>
            <Progress value={(checklistCount / 12) * 100} className="h-2" />
          </div>
        )}

        {/* Marquer comme revendue */}
        {listing.status !== 'resold' && (
          <div className="p-5 rounded-xl border border-orange-900/40 bg-orange-900/10">
            {!markingSold ? (
              <button
                onClick={() => setMarkingSold(true)}
                className="flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                <Flag className="w-4 h-4" />
                Marquer comme revendue
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-200">Confirmer la vente</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Prix de vente (€)"
                      value={sellPrice}
                      onChange={e => setSellPrice(e.target.value)}
                      className="bg-[#0d1117] border border-[#2a2f3e] rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-orange-500 w-48"
                      autoFocus
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleMarkSold}
                    disabled={saving || !sellPrice}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {saving ? 'Enregistrement…' : 'Confirmer'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setMarkingSold(false); setSellPrice('') }}
                  >
                    Annuler
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Le statut passera à "Revendue" et une transaction sera créée.
                </p>
              </div>
            )}
          </div>
        )}

        {listing.status === 'resold' && listing.sold_price && (
          <div className="p-4 rounded-xl border border-teal-900/40 bg-teal-900/10 text-sm text-teal-300">
            ✓ Revendue {listing.sold_at ? `le ${new Date(listing.sold_at).toLocaleDateString('fr-FR')}` : ''} pour {formatPrice(listing.sold_price)}
          </div>
        )}
      </div>

      {/* Modals triggered from detail view */}
      {activeModal === 'edit' && (
        <ListingFormModal
          open
          onClose={() => setActiveModal(null)}
          onSaved={() => { setActiveModal(null); refetchListing() }}
          listing={listing}
        />
      )}
      {activeModal === 'margin' && (
        <MarginModal
          open
          onClose={() => setActiveModal(null)}
          listing={listing as unknown as Listing}
          onSaved={() => { setActiveModal(null); refetchListing() }}
        />
      )}
      {activeModal === 'checklist' && (
        <ChecklistModal
          open
          onClose={() => setActiveModal(null)}
          listing={listing as unknown as Listing}
          onSaved={() => { setActiveModal(null); refetchListing() }}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnnoncesPage() {
  const searchParams = useSearchParams()
  const [view, setView] = useState<ViewMode>('grid')
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [detailListing, setDetailListing] = useState<ListingWithDetails | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    ...INITIAL_FILTERS,
    filterStatuses: searchParams.get('status') ? [searchParams.get('status')!] : [],
    filterClient: searchParams.get('client') ?? '',
  })
  const [sortBy, setSortBy] = useState('date_desc')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Modals (still used from list view action buttons)
  const [showNewListing, setShowNewListing] = useState(false)
  const [editListing, setEditListing] = useState<ListingWithDetails | null>(null)
  const [marginListing, setMarginListing] = useState<ListingWithDetails | null>(null)
  const [checklistListing, setChecklistListing] = useState<ListingWithDetails | null>(null)
  const [photosListing, setPhotosListing] = useState<ListingWithDetails | null>(null)
  const [showShare, setShowShare] = useState(false)

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showCompare, setShowCompare] = useState(false)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('listings')
        .select('*, clients(id, name, budget, criteria), listing_margins(*), listing_checklist(*), listing_photos(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) { console.error('Erreur:', error.message); setErrorMsg(error.message) }
      setListings((data as ListingWithDetails[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClients = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name')
    if (error) console.error('Erreur fetch clients:', error.message)
    setClients((data as Client[]) ?? [])
  }, [])

  useEffect(() => {
    fetchListings()
    fetchClients()
  }, [fetchListings, fetchClients])

  // Apply filters + sort
  const filtered = applyFilters(listings, filters).sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return (a.price ?? 0) - (b.price ?? 0)
      case 'price_desc': return (b.price ?? 0) - (a.price ?? 0)
      case 'km_asc': return (a.km ?? 0) - (b.km ?? 0)
      case 'km_desc': return (b.km ?? 0) - (a.km ?? 0)
      case 'score_desc': {
        const scoreA = a.auto_score != null ? a.auto_score : 0
        const scoreB = b.auto_score != null ? b.auto_score : 0
        return scoreB - scoreA
      }
      case 'year_desc': return (b.year ?? 0) - (a.year ?? 0)
      case 'date_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default: return 0
    }
  })

  const allTags = Array.from(new Set(listings.flatMap(l => l.tags ?? [])))
  const selectedListings = filtered.filter(l => selected.has(l.id))

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const activeFilterCount = (() => {
    const f = filters
    return [
      f.filterStatuses.length > 0, f.filterClient,
      f.filterBrand, f.filterModel, f.filterYearMin, f.filterYearMax,
      f.filterKmMax, f.filterFuels.length > 0, f.filterGearbox,
      f.filterBodies.length > 0, f.filterHorsepowerMin, f.filterFirstOwnerOnly,
      f.filterCountries.length > 0, f.filterPriceMax, f.filterBudgetMax,
      f.filterScoreMin > 0, f.filterMarginMin, f.filterDateRange,
      f.filterTags.length > 0, f.filterSeller,
    ].filter(Boolean).length
  })()

  const listingProps = {
    listings: filtered,
    selected,
    onToggleSelect: toggleSelect,
    onViewDetail: setDetailListing,
    onEdit: setEditListing,
    onMargin: setMarginListing,
    onChecklist: setChecklistListing,
    onPhotos: setPhotosListing,
    onRefresh: fetchListings,
    clients,
  }

  // ── Vue détail ──
  if (detailListing) {
    return (
      <>
        <KeyboardShortcuts />
        <Header title="Annonces" />
        <ListingDetailView
          listing={detailListing}
          onBack={() => setDetailListing(null)}
          onRefresh={fetchListings}
        />
      </>
    )
  }

  return (
    <>
      <KeyboardShortcuts onNewListing={() => setShowNewListing(true)} />
      <Header
        title="Annonces"
        onNewListing={() => setShowNewListing(true)}
        onShare={selected.size > 0 ? () => setShowShare(true) : undefined}
      />

      <div className="flex-1 overflow-y-auto pt-14">
        {errorMsg && <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-red-900/30 border border-red-700/40 text-sm text-red-400">{errorMsg}</div>}
        <div className="p-4 space-y-3">

          {/* ─── BARRE PRINCIPALE ─── */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Recherche texte */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <Input
                placeholder="Marque, modèle, notes…"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9"
              />
              {filters.search && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  onClick={() => setFilters(f => ({ ...f, search: '' }))}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtres toggle */}
            <Button
              variant={showFilters ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center h-4 w-4 rounded-full bg-white/20 text-[10px] font-bold ml-0.5">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Tri */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Plus récents</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="km_asc">KM croissant</SelectItem>
                <SelectItem value="score_desc">Meilleur score</SelectItem>
                <SelectItem value="year_desc">Année (récent)</SelectItem>
              </SelectContent>
            </Select>

            {/* Vue toggle */}
            <div className="flex items-center gap-1 bg-[#0d1117] border border-[#2a2f3e] rounded-lg p-1">
              {([['grid', Grid3X3], ['table', Table], ['kanban', Kanban]] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`p-1.5 rounded transition-colors ${view === v ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Sélection actions */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</Badge>
                <Button size="sm" variant="secondary" onClick={() => setShowShare(true)}>
                  <Share2 className="w-4 h-4" /> Partager
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowCompare(true)}>
                  <GitCompare className="w-4 h-4" /> Comparer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* ─── PANNEAU DE FILTRES ─── */}
          {showFilters && (
            <FiltersPanel
              filters={filters}
              onChange={setFilters}
              clients={clients}
              allTags={allTags}
              resultCount={filtered.length}
              totalCount={listings.length}
            />
          )}

          {/* ─── RÉSULTATS ─── */}
          {!showFilters && (
            <p className="text-xs text-gray-500">
              <span className="text-gray-300 font-medium">{filtered.length}</span>
              {listings.length !== filtered.length && <span> / {listings.length}</span>}
              {' '}annonce{filtered.length !== 1 ? 's' : ''}
              {hasActiveFilters(filters) && (
                <button
                  className="ml-2 text-orange-400 hover:text-orange-300"
                  onClick={() => setFilters({ ...INITIAL_FILTERS })}
                >
                  Effacer les filtres
                </button>
              )}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500 text-sm">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <p className="text-gray-500">
                {hasActiveFilters(filters) ? 'Aucune annonce ne correspond aux filtres.' : 'Aucune annonce.'}
              </p>
              {hasActiveFilters(filters)
                ? <Button variant="secondary" onClick={() => setFilters({ ...INITIAL_FILTERS })}>Effacer les filtres</Button>
                : <Button onClick={() => setShowNewListing(true)}>Ajouter une annonce</Button>
              }
            </div>
          ) : (
            <>
              {view === 'grid' && <ListingsGrid {...listingProps} />}
              {view === 'table' && <ListingsTable {...listingProps} />}
              {view === 'kanban' && <ListingsKanban {...listingProps} onRefresh={fetchListings} />}
            </>
          )}
        </div>
      </div>

      {/* ─── MODALS ─── */}
      {showNewListing && (
        <ListingFormModal open onClose={() => setShowNewListing(false)} onSaved={() => { setShowNewListing(false); fetchListings() }} />
      )}
      {editListing && (
        <ListingFormModal open onClose={() => setEditListing(null)} onSaved={() => { setEditListing(null); fetchListings() }} listing={editListing} />
      )}
      {marginListing && (
        <MarginModal open onClose={() => setMarginListing(null)} listing={marginListing} onSaved={fetchListings} />
      )}
      {checklistListing && (
        <ChecklistModal open onClose={() => setChecklistListing(null)} listing={checklistListing} onSaved={fetchListings} />
      )}
      {photosListing && (
        <PhotosModal open onClose={() => setPhotosListing(null)} listing={photosListing} onRefresh={fetchListings} />
      )}
      {showShare && selectedListings.length > 0 && (
        <ShareModal open onClose={() => setShowShare(false)} listings={selectedListings} />
      )}
      {showCompare && selectedListings.length >= 2 && (
        <ComparePanel listings={selectedListings} onClose={() => setShowCompare(false)} />
      )}
    </>
  )
}
