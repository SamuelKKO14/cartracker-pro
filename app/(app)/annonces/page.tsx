'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Grid3X3, Table, Kanban, Search, SlidersHorizontal, Share2, GitCompare, X } from 'lucide-react'
import { COUNTRY_LABELS, STATUS_LABELS, getFinalScore } from '@/lib/utils'
import type { ListingWithDetails, Client } from '@/types/database'

type ViewMode = 'grid' | 'table' | 'kanban'

export default function AnnoncesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('grid')
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') ?? '')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterClient, setFilterClient] = useState(searchParams.get('client') ?? '')
  const [filterMinScore, setFilterMinScore] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')
  const [showFilters, setShowFilters] = useState(false)

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

  // Filtered listings
  const filtered = listings.filter(l => {
    if (search) {
      const q = search.toLowerCase()
      const matches = [l.brand, l.model, l.generation, l.notes, l.source]
        .filter(Boolean).some(v => v!.toLowerCase().includes(q))
      if (!matches) return false
    }
    if (filterStatus && l.status !== filterStatus) return false
    if (filterCountry && l.country !== filterCountry) return false
    if (filterClient && l.client_id !== filterClient) return false
    if (filterTag && !l.tags?.includes(filterTag)) return false
    if (filterMinScore) {
      const score = getFinalScore(l.auto_score, l.manual_score)
      if (score == null || score < parseInt(filterMinScore)) return false
    }
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return (a.price ?? 0) - (b.price ?? 0)
      case 'price_desc': return (b.price ?? 0) - (a.price ?? 0)
      case 'km_asc': return (a.km ?? 0) - (b.km ?? 0)
      case 'km_desc': return (b.km ?? 0) - (a.km ?? 0)
      case 'score_desc': return (getFinalScore(b.auto_score, b.manual_score) ?? 0) - (getFinalScore(a.auto_score, a.manual_score) ?? 0)
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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearFilters() {
    setSearch(''); setFilterStatus(''); setFilterCountry(''); setFilterClient('')
    setFilterMinScore(''); setFilterTag(''); setSortBy('date_desc')
  }

  const hasFilters = search || filterStatus || filterCountry || filterClient || filterMinScore || filterTag

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
        <div className="p-4 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Rechercher une annonce…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button
              variant={showFilters ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              {hasFilters && <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">!</Badge>}
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Plus récents</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="km_asc">KM croissant</SelectItem>
                <SelectItem value="score_desc">Meilleur score</SelectItem>
                <SelectItem value="year_desc">Plus récents (année)</SelectItem>
              </SelectContent>
            </Select>

            {/* View toggle */}
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

            {/* Selection actions */}
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

          {/* Filters panel */}
          {showFilters && (
            <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0a0d14] space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Select value={filterStatus || 'all'} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterCountry || 'all'} onValueChange={v => setFilterCountry(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pays</SelectItem>
                    {Object.entries(COUNTRY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterClient || 'all'} onValueChange={v => setFilterClient(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterTag || 'all'} onValueChange={v => setFilterTag(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les tags</SelectItem>
                    {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Score min."
                  value={filterMinScore}
                  onChange={e => setFilterMinScore(e.target.value)}
                  min="0" max="100"
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-3 h-3" /> Effacer les filtres
                </Button>
              )}
            </div>
          )}

          {/* Results count */}
          <p className="text-xs text-gray-500">
            {filtered.length} annonce{filtered.length !== 1 ? 's' : ''}
            {listings.length !== filtered.length ? ` (sur ${listings.length})` : ''}
          </p>

          {/* Views */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500 text-sm">Chargement…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-gray-500 mb-2">Aucune annonce trouvée</p>
              <Button onClick={() => setShowNewListing(true)}>Ajouter une annonce</Button>
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

      {/* Modals */}
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
