'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateAutoScore, COUNTRY_LABELS, getImportCost } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Client, Listing } from '@/types/database'

interface ListingFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  listing?: Listing | null
  defaultClientId?: string
}

const FUELS = ['Diesel', 'Essence', 'GPL', 'Hybride', 'Électrique']
const GEARBOXES = ['Manuelle', 'Automatique']
const BODIES = ['Berline', 'SUV/4x4', 'Break', 'Coupé', 'Cabriolet', 'Citadine', 'Utilitaire', 'Monospace']
const SOURCES = ['AutoScout24', 'La Centrale', 'LeBonCoin', 'Le Parking', 'mobile.de', 'Manuel', 'Chat']
const STATUSES = [
  { value: 'new', label: 'Nouveau' },
  { value: 'viewed', label: 'Vue' },
  { value: 'contacted', label: 'Contactée' },
  { value: 'negotiation', label: 'En négociation' },
  { value: 'bought', label: 'Achetée' },
  { value: 'resold', label: 'Revendue' },
  { value: 'ignored', label: 'Ignorée' },
]

// Pays étendus (ajout CZ, HU)
const COUNTRIES_EXTENDED: Record<string, string> = {
  FR: '🇫🇷 France',
  DE: '🇩🇪 Allemagne',
  BE: '🇧🇪 Belgique',
  NL: '🇳🇱 Pays-Bas',
  ES: '🇪🇸 Espagne',
  IT: '🇮🇹 Italie',
  PL: '🇵🇱 Pologne',
  PT: '🇵🇹 Portugal',
  RO: '🇷🇴 Roumanie',
  AT: '🇦🇹 Autriche',
  CH: '🇨🇭 Suisse',
  SE: '🇸🇪 Suède',
  NO: '🇳🇴 Norvège',
  LT: '🇱🇹 Lituanie',
  CZ: '🇨🇿 Tchéquie',
  HU: '🇭🇺 Hongrie',
}

export function ListingFormModal({ open, onClose, onSaved, listing, defaultClientId }: ListingFormModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const [form, setForm] = useState({
    // Obligatoire
    brand: listing?.brand ?? '',
    model: listing?.model ?? '',
    price: listing?.price?.toString() ?? '',
    km: listing?.km?.toString() ?? '',
    country: listing?.country ?? 'FR',
    url: listing?.url ?? '',
    // Important
    year: listing?.year?.toString() ?? '',
    fuel: listing?.fuel ?? '',
    gearbox: listing?.gearbox ?? '',
    seller: listing?.seller ?? '',
    first_owner: listing?.first_owner ?? false,
    client_id: listing?.client_id ?? defaultClientId ?? '',
    source: listing?.source ?? '',
    status: listing?.status ?? 'new',
    // Détails
    body: listing?.body ?? '',
    horsepower: (listing as Listing & { horsepower?: number | null })?.horsepower?.toString() ?? '',
    color: (listing as Listing & { color?: string | null })?.color ?? '',
    notes: listing?.notes ?? '',
    // Autres
    tags: listing?.tags ?? [] as string[],
    manual_score: listing?.manual_score?.toString() ?? '',
  })

  useEffect(() => {
    async function fetchClients() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('clients').select('id, name').eq('user_id', user.id).order('name')
      setClients((data as Client[]) ?? [])
    }
    fetchClients()
  }, [])

  function updateField(key: string, value: string | boolean | string[]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) updateField('tags', [...form.tags, tag])
    setTagInput('')
  }

  function removeTag(tag: string) {
    updateField('tags', form.tags.filter(t => t !== tag))
  }

  const autoScore = calculateAutoScore({
    year: form.year ? parseInt(form.year) : null,
    km: form.km ? parseInt(form.km) : null,
    price: form.price ? parseInt(form.price) : null,
    seller: form.seller,
    first_owner: form.first_owner,
  })

  const importCost = getImportCost(form.country)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.brand) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        brand: form.brand,
        model: form.model || null,
        generation: null,
        year: form.year ? parseInt(form.year) : null,
        km: form.km ? parseInt(form.km) : null,
        price: form.price ? parseInt(form.price) : null,
        fuel: form.fuel || null,
        gearbox: form.gearbox || null,
        body: form.body || null,
        country: form.country || null,
        seller: form.seller || null,
        first_owner: form.first_owner,
        url: form.url || null,
        source: form.source || null,
        notes: form.notes || null,
        status: form.status,
        tags: form.tags.length > 0 ? form.tags : null,
        auto_score: autoScore,
        manual_score: form.manual_score ? parseInt(form.manual_score) : null,
        client_id: form.client_id || null,
        horsepower: form.horsepower ? parseInt(form.horsepower) : null,
        color: form.color || null,
        updated_at: new Date().toISOString(),
      }

      if (listing) {
        await supabase.from('listings').update(payload).eq('id', listing.id)
      } else {
        await supabase.from('listings').insert(payload)
      }
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{listing ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ─── BLOC 1 : OBLIGATOIRE ─── */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Marque <span className="text-orange-500">*</span></Label>
                <Input placeholder="BMW, Audi…" value={form.brand} onChange={e => updateField('brand', e.target.value)} required autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Modèle</Label>
                <Input placeholder="320d, A4, Clio…" value={form.model} onChange={e => updateField('model', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prix affiché (€)</Label>
                <Input type="number" placeholder="15 000" value={form.price} onChange={e => updateField('price', e.target.value)} min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Kilométrage (km)</Label>
                <Input type="number" placeholder="80 000" value={form.km} onChange={e => updateField('km', e.target.value)} min="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Pays</Label>
                <Select value={form.country} onValueChange={v => updateField('country', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(COUNTRIES_EXTENDED).map(([code, label]) => (
                      <SelectItem key={code} value={code}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>URL de l'annonce</Label>
                <Input placeholder="https://…" value={form.url} onChange={e => updateField('url', e.target.value)} type="url" />
              </div>
            </div>

            {importCost > 0 && (
              <div className="p-2.5 rounded-lg bg-yellow-900/20 border border-yellow-800/50 text-xs text-yellow-400">
                ⚠️ Coût d'import estimé depuis {COUNTRIES_EXTENDED[form.country]?.replace(/^.+ /, '')} : <strong>+{importCost.toLocaleString('fr-FR')} €</strong>
              </div>
            )}
          </div>

          {/* ─── BLOC 2 : IMPORTANT ─── */}
          <div className="border border-[#1a1f2e] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0a0d14] text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Informations importantes
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Année</Label>
                  <Input type="number" placeholder="2020" value={form.year} onChange={e => updateField('year', e.target.value)} min="1990" max="2030" />
                </div>
                <div className="space-y-1.5">
                  <Label>Carburant</Label>
                  <Select value={form.fuel || 'none'} onValueChange={v => updateField('fuel', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {FUELS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Boîte</Label>
                  <Select value={form.gearbox || 'none'} onValueChange={v => updateField('gearbox', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {GEARBOXES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vendeur</Label>
                  <Select value={form.seller || 'none'} onValueChange={v => updateField('seller', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      <SelectItem value="particulier">Particulier</SelectItem>
                      <SelectItem value="professionnel">Professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select value={form.source || 'none'} onValueChange={v => updateField('source', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Client associé</Label>
                  <Select value={form.client_id || 'none'} onValueChange={v => updateField('client_id', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun client</SelectItem>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={v => updateField('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <Checkbox checked={form.first_owner} onCheckedChange={v => updateField('first_owner', v as boolean)} />
                <span className="text-sm text-gray-300">Première main</span>
              </label>
            </div>
          </div>

          {/* ─── BLOC 3 : DÉTAILS (dépliable) ─── */}
          <div className="border border-[#1a1f2e] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0a0d14] hover:bg-[#0d1117] transition-colors"
            >
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Détails supplémentaires
              </span>
              {showDetails
                ? <ChevronUp className="w-4 h-4 text-gray-500" />
                : <ChevronDown className="w-4 h-4 text-gray-500" />
              }
            </button>

            {showDetails && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Carrosserie</Label>
                    <Select value={form.body || 'none'} onValueChange={v => updateField('body', v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {BODIES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Puissance (ch)</Label>
                    <Input type="number" placeholder="150" value={form.horsepower} onChange={e => updateField('horsepower', e.target.value)} min="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Couleur</Label>
                    <Input placeholder="Noir, Blanc…" value={form.color} onChange={e => updateField('color', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea placeholder="Remarques, génération, observations…" value={form.notes} onChange={e => updateField('notes', e.target.value)} rows={3} />
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter un tag…"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addTag}>+</Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {form.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-orange-900/30 text-orange-300 border border-orange-700/50">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-white leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score manuel */}
                <div className="space-y-1.5">
                  <Label>Score manuel (0–100)</Label>
                  <Input type="number" placeholder="Optionnel" value={form.manual_score} onChange={e => updateField('manual_score', e.target.value)} min="0" max="100" />
                </div>
              </div>
            )}
          </div>

          {/* Score auto */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0d14] border border-[#1a1f2e]">
            <div>
              <p className="text-xs text-gray-500">Score auto calculé</p>
              <p className="text-xl font-bold text-orange-400">{autoScore}<span className="text-sm text-gray-500 font-normal">/100</span></p>
            </div>
            {form.manual_score && (
              <>
                <div className="w-px h-8 bg-[#2a2f3e]" />
                <div>
                  <p className="text-xs text-gray-500">Score manuel</p>
                  <p className="text-xl font-bold text-blue-400">{form.manual_score}<span className="text-sm text-gray-500 font-normal">/100</span></p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading || !form.brand}>
              {loading ? 'Enregistrement…' : listing ? 'Mettre à jour' : 'Ajouter l\'annonce'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
