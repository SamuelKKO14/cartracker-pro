'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateAutoScore, COUNTRY_LABELS, getImportCost } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronUp, Camera, X } from 'lucide-react'
import type { Client, Listing } from '@/types/database'

export interface ListingInitialData {
  brand?: string
  model?: string
  generation?: string | null
  year?: number | null
  km?: number | null
  price?: number | null
  fuel?: string | null
  gearbox?: string | null
  body?: string | null
  country?: string | null
  seller?: string | null
  first_owner?: boolean | null
  horsepower?: number | null
  color?: string | null
  url?: string | null
  notes?: string | null
}

interface ListingFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  listing?: Listing | null
  defaultClientId?: string
  initialData?: ListingInitialData
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

export function ListingFormModal({ open, onClose, onSaved, listing, defaultClientId, initialData }: ListingFormModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [photoDragging, setPhotoDragging] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    // Obligatoire
    brand: listing?.brand ?? initialData?.brand ?? '',
    model: listing?.model ?? initialData?.model ?? '',
    price: listing?.price?.toString() ?? initialData?.price?.toString() ?? '',
    km: listing?.km?.toString() ?? initialData?.km?.toString() ?? '',
    country: listing?.country ?? initialData?.country ?? 'FR',
    url: listing?.url ?? initialData?.url ?? '',
    // Important
    year: listing?.year?.toString() ?? initialData?.year?.toString() ?? '',
    fuel: listing?.fuel ?? initialData?.fuel ?? '',
    gearbox: listing?.gearbox ?? initialData?.gearbox ?? '',
    seller: listing?.seller ?? initialData?.seller ?? '',
    first_owner: listing?.first_owner ?? initialData?.first_owner ?? false,
    client_id: listing?.client_id ?? defaultClientId ?? '',
    source: listing?.source ?? '',
    status: listing?.status ?? 'new',
    // Détails
    body: listing?.body ?? initialData?.body ?? '',
    horsepower: (listing as Listing & { horsepower?: number | null })?.horsepower?.toString() ?? initialData?.horsepower?.toString() ?? '',
    color: (listing as Listing & { color?: string | null })?.color ?? initialData?.color ?? '',
    notes: listing?.notes ?? initialData?.notes ?? '',
    // Revendue
    sold_price: listing?.sold_price?.toString() ?? '',
    sold_at: listing?.sold_at ? listing.sold_at.split('T')[0] : '',
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

  useEffect(() => {
    const urls = photoFiles.map(f => URL.createObjectURL(f))
    setPhotoPreviewUrls(urls)
    return () => { urls.forEach(u => URL.revokeObjectURL(u)) }
  }, [photoFiles])

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

  function addPhotoFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    setPhotoFiles(prev => [...prev, ...arr].slice(0, 30))
  }

  function removePhotoFile(idx: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx))
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
        sold_price: form.status === 'resold' && form.sold_price ? parseInt(form.sold_price) : null,
        sold_at: form.status === 'resold' && form.sold_at ? new Date(form.sold_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      if (listing) {
        await supabase.from('listings').update(payload).eq('id', listing.id)
      } else {
        const { data: newListing } = await supabase
          .from('listings')
          .insert(payload)
          .select('id')
          .single()

        if (newListing && photoFiles.length > 0) {
          for (let i = 0; i < photoFiles.length; i++) {
            const file = photoFiles[i]
            const ext = file.name.split('.').pop() ?? 'jpg'
            const path = `${user.id}/${newListing.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const { error: storageError } = await supabase.storage
              .from('listing-photos')
              .upload(path, file, { contentType: file.type })
            if (storageError) continue
            const { data: { publicUrl } } = supabase.storage
              .from('listing-photos')
              .getPublicUrl(path)
            await supabase.from('listing_photos').insert({
              user_id: user.id,
              listing_id: newListing.id,
              url: publicUrl,
              position: i,
            })
          }
        }
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

              {form.status === 'resold' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Prix de vente réel (€)</Label>
                    <Input type="number" placeholder="Ex: 18000" value={form.sold_price} onChange={e => updateField('sold_price', e.target.value)} min="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date de vente</Label>
                    <Input type="date" value={form.sold_at} onChange={e => updateField('sold_at', e.target.value)} />
                  </div>
                </div>
              )}

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

          {/* ─── PHOTOS (création uniquement) ─── */}
          {!listing && (
            <div className="border border-[#1a1f2e] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-[#0a0d14] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Photos ({photoFiles.length}/30)
              </div>
              <div className="p-4 space-y-3">
                <div
                  onDragOver={e => { e.preventDefault(); setPhotoDragging(true) }}
                  onDragLeave={() => setPhotoDragging(false)}
                  onDrop={e => { e.preventDefault(); setPhotoDragging(false); addPhotoFiles(e.dataTransfer.files) }}
                  onClick={() => photoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    photoDragging
                      ? 'border-orange-500/60 bg-orange-500/5'
                      : 'border-gray-700 hover:border-gray-600 hover:bg-[#0a0d14]'
                  }`}
                >
                  <Camera className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="text-xs text-gray-400 text-center">Glissez des photos ou cliquez pour sélectionner</p>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => { if (e.target.files) addPhotoFiles(e.target.files); e.target.value = '' }}
                  />
                </div>
                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {photoPreviewUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removePhotoFile(i) }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
