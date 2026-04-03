'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ChevronDown, ChevronUp, X, RotateCcw } from 'lucide-react'
import { COUNTRY_LABELS, STATUS_LABELS, STATUS_COLORS, getFinalScore, getImportCost } from '@/lib/utils'
import type { Client, ListingWithDetails } from '@/types/database'

export interface FilterState {
  search: string
  filterClient: string
  filterStatuses: string[]
  // Véhicule
  filterBrand: string
  filterModel: string
  filterYearMin: string
  filterYearMax: string
  filterKmMax: string
  filterFuels: string[]
  filterGearbox: string
  filterBodies: string[]
  filterHorsepowerMin: string
  filterFirstOwnerOnly: boolean
  filterCountries: string[]
  // Business
  filterPriceMax: string
  filterBudgetMax: string
  filterScoreMin: number
  filterMarginMin: string
  filterDateRange: string
  filterTags: string[]
  filterSeller: string
}

export const INITIAL_FILTERS: FilterState = {
  search: '',
  filterClient: '',
  filterStatuses: [],
  filterBrand: '',
  filterModel: '',
  filterYearMin: '',
  filterYearMax: '',
  filterKmMax: '',
  filterFuels: [],
  filterGearbox: '',
  filterBodies: [],
  filterHorsepowerMin: '',
  filterFirstOwnerOnly: false,
  filterCountries: [],
  filterPriceMax: '',
  filterBudgetMax: '',
  filterScoreMin: 0,
  filterMarginMin: '',
  filterDateRange: '',
  filterTags: [],
  filterSeller: '',
}

export function applyFilters(listings: ListingWithDetails[], f: FilterState): ListingWithDetails[] {
  return listings.filter(l => {
    if (f.search) {
      const q = f.search.toLowerCase()
      const ok = [l.brand, l.model, l.notes, l.source, ...(l.tags ?? [])]
        .filter(Boolean).some(v => v!.toLowerCase().includes(q))
      if (!ok) return false
    }
    if (f.filterStatuses.length > 0 && !f.filterStatuses.includes(l.status)) return false
    if (f.filterClient && l.client_id !== f.filterClient) return false
    if (f.filterBrand && !l.brand.toLowerCase().includes(f.filterBrand.toLowerCase())) return false
    if (f.filterModel && !l.model?.toLowerCase().includes(f.filterModel.toLowerCase())) return false
    if (f.filterYearMin && l.year != null && l.year < parseInt(f.filterYearMin)) return false
    if (f.filterYearMax && l.year != null && l.year > parseInt(f.filterYearMax)) return false
    if (f.filterKmMax && l.km != null && l.km > parseInt(f.filterKmMax)) return false
    if (f.filterFuels.length > 0 && (!l.fuel || !f.filterFuels.includes(l.fuel))) return false
    if (f.filterGearbox && l.gearbox !== f.filterGearbox) return false
    if (f.filterBodies.length > 0 && (!l.body || !f.filterBodies.includes(l.body))) return false
    if (f.filterHorsepowerMin) {
      const hp = (l as ListingWithDetails & { horsepower?: number | null }).horsepower
      if (hp == null || hp < parseInt(f.filterHorsepowerMin)) return false
    }
    if (f.filterFirstOwnerOnly && !l.first_owner) return false
    if (f.filterCountries.length > 0 && (!l.country || !f.filterCountries.includes(l.country))) return false
    if (f.filterPriceMax && l.price != null && l.price > parseInt(f.filterPriceMax)) return false
    if (f.filterBudgetMax) {
      const total = (l.price ?? 0) + getImportCost(l.country)
      if (total > parseInt(f.filterBudgetMax)) return false
    }
    if (f.filterScoreMin > 0) {
      const score = getFinalScore(l.auto_score, l.manual_score)
      if (score == null || score < f.filterScoreMin) return false
    }
    if (f.filterMarginMin) {
      const margin = (l.margin as { margin?: number } | null)?.margin
        ?? (l.listing_margins as Array<{ margin?: number }> | null)?.[0]?.margin
      if (margin == null || margin < parseInt(f.filterMarginMin)) return false
    }
    if (f.filterDateRange) {
      const days = parseInt(f.filterDateRange)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      if (new Date(l.created_at) < cutoff) return false
    }
    if (f.filterTags.length > 0 && !f.filterTags.some(t => l.tags?.includes(t))) return false
    if (f.filterSeller && l.seller !== f.filterSeller) return false
    return true
  })
}

export function hasActiveFilters(f: FilterState): boolean {
  return !!(
    f.search || f.filterClient || f.filterStatuses.length ||
    f.filterBrand || f.filterModel || f.filterYearMin || f.filterYearMax ||
    f.filterKmMax || f.filterFuels.length || f.filterGearbox ||
    f.filterBodies.length || f.filterHorsepowerMin || f.filterFirstOwnerOnly ||
    f.filterCountries.length || f.filterPriceMax || f.filterBudgetMax ||
    f.filterScoreMin > 0 || f.filterMarginMin || f.filterDateRange ||
    f.filterTags.length || f.filterSeller
  )
}

const FUELS = ['Diesel', 'Essence', 'GPL', 'Hybride', 'Électrique']
const BODIES = ['Berline', 'SUV/4x4', 'Break', 'Coupé', 'Cabriolet', 'Citadine', 'Utilitaire', 'Monospace']

const ALL_STATUSES = [
  { value: 'new', label: 'Nouvelle' },
  { value: 'viewed', label: 'Vue' },
  { value: 'contacted', label: 'Contactée' },
  { value: 'negotiation', label: 'Négociation' },
  { value: 'bought', label: 'Achetée' },
  { value: 'resold', label: 'Revendue' },
  { value: 'ignored', label: 'Ignorée' },
]

interface FiltersPanelProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  clients: Client[]
  allTags: string[]
  resultCount: number
  totalCount: number
}

function CollapsibleSection({
  title, badge, children, defaultOpen = false
}: {
  title: string
  badge?: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-[#1a1f2e] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0a0d14] hover:bg-[#0d1117] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
          {badge != null && badge > 0 && (
            <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold">
              {badge}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-4 space-y-3">
          {children}
        </div>
      </div>
    </div>
  )
}

function MultiChips({
  options, selected, onChange, colorFn
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (v: string[]) => void
  colorFn?: (v: string) => string
}) {
  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const active = selected.includes(o.value)
        const baseColor = colorFn ? colorFn(o.value) : ''
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              active
                ? baseColor || 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                : 'bg-transparent text-gray-400 border-[#2a2f3e] hover:border-[#3a3f4e] hover:text-gray-300'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function ClientAutocomplete({ clients, value, onChange }: {
  clients: Client[]
  value: string
  onChange: (id: string) => void
}) {
  const selectedClient = clients.find(c => c.id === value)
  const [text, setText] = useState(selectedClient?.name ?? '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setText(selectedClient?.name ?? '')
  }, [selectedClient?.name])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const suggestions = text.trim()
    ? clients.filter(c => normalize(c.name).includes(normalize(text)))
    : []

  function select(c: Client) {
    setText(c.name)
    onChange(c.id)
    setOpen(false)
  }

  function clear() {
    setText('')
    onChange('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Input
          placeholder="Rechercher un client…"
          value={text}
          onChange={e => { setText(e.target.value); setOpen(true); if (!e.target.value) onChange('') }}
          onFocus={() => { if (text) setOpen(true) }}
          className="h-8 text-sm pr-6"
        />
        {text && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1117] border border-[#2a2f3e] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
          {suggestions.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => select(c)}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#1a1f2e] hover:text-white transition-colors"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function FiltersPanel({ filters: f, onChange, clients, allTags, resultCount, totalCount }: FiltersPanelProps) {
  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...f, [key]: value })
  }

  const vehicleActiveCount = [
    f.filterBrand, f.filterModel, f.filterYearMin, f.filterYearMax,
    f.filterKmMax, f.filterGearbox, f.filterHorsepowerMin
  ].filter(Boolean).length
    + f.filterFuels.length
    + f.filterBodies.length
    + f.filterCountries.length
    + (f.filterFirstOwnerOnly ? 1 : 0)

  const businessActiveCount = [
    f.filterPriceMax, f.filterBudgetMax, f.filterMarginMin, f.filterDateRange, f.filterSeller
  ].filter(Boolean).length
    + (f.filterScoreMin > 0 ? 1 : 0)
    + f.filterTags.length

  return (
    <div className="space-y-3">

      {/* ─── BLOC 1 : ESSENTIEL (toujours visible) ─── */}
      <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0a0d14] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recherche</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              <span className="text-gray-200 font-semibold">{resultCount}</span>
              {totalCount !== resultCount && <span> / {totalCount}</span>}
              {' '}annonce{resultCount !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters(f) && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-orange-400 hover:text-orange-300"
                onClick={() => onChange({ ...INITIAL_FILTERS })}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* Client + Statuts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Client associé</label>
            <ClientAutocomplete
              clients={clients}
              value={f.filterClient}
              onChange={id => set('filterClient', id)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Vendeur</label>
            <Select value={f.filterSeller || 'all'} onValueChange={v => set('filterSeller', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="particulier">Particulier</SelectItem>
                <SelectItem value="professionnel">Professionnel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statuts multi-select */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">Statut</label>
          <MultiChips
            options={ALL_STATUSES}
            selected={f.filterStatuses}
            onChange={v => set('filterStatuses', v)}
            colorFn={v => STATUS_COLORS[v] ?? ''}
          />
        </div>
      </div>

      {/* ─── BLOC 2 : VÉHICULE (dépliable) ─── */}
      <CollapsibleSection title="Véhicule" badge={vehicleActiveCount}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Marque</label>
            <Input
              placeholder="BMW, Audi…"
              value={f.filterBrand}
              onChange={e => set('filterBrand', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Modèle</label>
            <Input
              placeholder="320d, A4…"
              value={f.filterModel}
              onChange={e => set('filterModel', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Année min / max</label>
            <div className="flex gap-2">
              <Input placeholder="2015" value={f.filterYearMin} onChange={e => set('filterYearMin', e.target.value)} className="h-8 text-sm" type="number" min="1990" max="2030" />
              <Input placeholder="2024" value={f.filterYearMax} onChange={e => set('filterYearMax', e.target.value)} className="h-8 text-sm" type="number" min="1990" max="2030" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Kilométrage max</label>
            <Input placeholder="150 000" value={f.filterKmMax} onChange={e => set('filterKmMax', e.target.value)} className="h-8 text-sm" type="number" min="0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Boîte</label>
            <Select value={f.filterGearbox || 'all'} onValueChange={v => set('filterGearbox', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Toutes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Manuelle">Manuelle</SelectItem>
                <SelectItem value="Automatique">Automatique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Puissance min (ch)</label>
            <Input placeholder="100" value={f.filterHorsepowerMin} onChange={e => set('filterHorsepowerMin', e.target.value)} className="h-8 text-sm" type="number" min="0" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">Carburant</label>
          <MultiChips
            options={FUELS.map(v => ({ value: v, label: v }))}
            selected={f.filterFuels}
            onChange={v => set('filterFuels', v)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">Carrosserie</label>
          <MultiChips
            options={BODIES.map(v => ({ value: v, label: v }))}
            selected={f.filterBodies}
            onChange={v => set('filterBodies', v)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">Pays</label>
          <MultiChips
            options={Object.entries(COUNTRY_LABELS).map(([v, label]) => ({ value: v, label: label.replace(/^.+ /, '') }))}
            selected={f.filterCountries}
            onChange={v => set('filterCountries', v)}
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <button
            type="button"
            onClick={() => set('filterFirstOwnerOnly', !f.filterFirstOwnerOnly)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${f.filterFirstOwnerOnly ? 'bg-orange-500' : 'bg-[#2a2f3e]'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${f.filterFirstOwnerOnly ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-gray-300">Première main uniquement</span>
        </label>
      </CollapsibleSection>

      {/* ─── BLOC 3 : BUSINESS (dépliable) ─── */}
      <CollapsibleSection title="Business" badge={businessActiveCount}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Prix max (€)</label>
            <Input placeholder="30 000" value={f.filterPriceMax} onChange={e => set('filterPriceMax', e.target.value)} className="h-8 text-sm" type="number" min="0" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Budget total max (€) <span className="text-gray-600 font-normal normal-case">prix + import</span></label>
            <Input placeholder="35 000" value={f.filterBudgetMax} onChange={e => set('filterBudgetMax', e.target.value)} className="h-8 text-sm" type="number" min="0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Marge nette min (€)</label>
            <Input placeholder="500" value={f.filterMarginMin} onChange={e => set('filterMarginMin', e.target.value)} className="h-8 text-sm" type="number" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Ajoutée il y a moins de</label>
            <Select value={f.filterDateRange || 'all'} onValueChange={v => set('filterDateRange', v === 'all' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Toutes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="15">15 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs text-gray-500">Score bonne affaire min</label>
            <span className={`text-xs font-semibold ${f.filterScoreMin >= 70 ? 'text-green-400' : f.filterScoreMin >= 50 ? 'text-orange-400' : 'text-gray-400'}`}>
              {f.filterScoreMin > 0 ? `≥ ${f.filterScoreMin}` : 'Tous'}
            </span>
          </div>
          <Slider
            value={[f.filterScoreMin]}
            onValueChange={([v]) => set('filterScoreMin', v)}
            min={0}
            max={100}
            step={5}
          />
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => {
                const active = f.filterTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => set('filterTags', active ? f.filterTags.filter(t => t !== tag) : [...f.filterTags, tag])}
                    className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-all ${
                      active
                        ? 'bg-orange-900/30 text-orange-300 border-orange-700/50'
                        : 'text-gray-400 border-[#2a2f3e] hover:border-[#3a3f4e]'
                    }`}
                  >
                    {tag}
                    {active && <X className="w-2.5 h-2.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </CollapsibleSection>
    </div>
  )
}
