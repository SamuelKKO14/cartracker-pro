'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { ListingFormModal } from '@/components/listings/listing-form-modal'
import { MarginModal } from '@/components/listings/margin-modal'
import { ChecklistModal } from '@/components/listings/checklist-modal'
import { SearchLinksModal } from '@/components/listings/search-links-modal'
import { ShareModal } from '@/components/listings/share-modal'
import { ComparePanel } from '@/components/listings/compare-panel'
import { ListingsGrid } from '@/components/listings/listings-grid'
import { ListingsTable } from '@/components/listings/listings-table'
import { ListingsKanban } from '@/components/listings/listings-kanban'
import { FiltersPanel, applyFilters, hasActiveFilters, INITIAL_FILTERS } from '@/components/listings/filters-panel'
import type { FilterState } from '@/components/listings/filters-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Grid3X3, Table, Kanban, Search, SlidersHorizontal, Share2, GitCompare, X } from 'lucide-react'
import type { ListingWithDetails, Client } from '@/types/database'

type ViewMode = 'grid' | 'table' | 'kanban'

export default function AnnoncesPage() {
  const searchParams = useSearchParams()
  const [view, setView] = useState<ViewMode>('grid')
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    ...INITIAL_FILTERS,
    filterStatuses: searchParams.get('status') ? [searchParams.get('status')!] : [],
    filterClient: searchParams.get('client') ?? '',
  })
  const [sortBy, setSortBy] = useState('date_desc')

  // Modals
  const [showNewListing, setShowNewListing] = useState(false)
  const [editListing, setEditListing] = useState<ListingWithDetails | null>(null)
  const [marginListing, setMarginListing] = useState<ListingWithDetails | null>(null)
  const [checklistListing, setChecklistListing] = useState<ListingWithDetails | null>(null)
  const [searchLinksListing, setSearchLinksListing] = useState<ListingWithDetails | null>(null)
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
      const { data } = await supabase
        .from('listings')
        .select('*, clients(id, name, budget, criteria), listing_margins(*), listing_checklist(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setListings((data as ListingWithDetails[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClients = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name')
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
    onEdit: setEditListing,
    onMargin: setMarginListing,
    onChecklist: setChecklistListing,
    onSearchLinks: setSearchLinksListing,
    onRefresh: fetchListings,
    clients,
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
      {searchLinksListing && (
        <SearchLinksModal open onClose={() => setSearchLinksListing(null)} listing={searchLinksListing} />
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
