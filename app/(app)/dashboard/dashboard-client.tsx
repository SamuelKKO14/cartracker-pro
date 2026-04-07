'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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
  BarChart3, Plus, ExternalLink, Calculator, GripVertical,
  Camera, X,
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

interface DashboardBlogPost {
  id: string; title: string; slug: string; excerpt: string | null
  content: string; created_at: string; category: string | null
}

interface DashboardProps {
  firstName: string | null
  kpis: KPIs
  recentListings: DashboardListing[]
  recentClients: DashboardClientRow[]
  finance: Finance
  blogPosts: DashboardBlogPost[]
  allClients: { id: string; name: string }[]
}

type SectionId = 'import' | 'listingsClients' | 'financeBlog'

const DEFAULT_ORDER: SectionId[] = ['import', 'listingsClients', 'financeBlog']
const LS_KEY = 'dashboard_section_order'

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

function loadOrder(): SectionId[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_ORDER
    const parsed = JSON.parse(raw) as SectionId[]
    // Validate — make sure it's a permutation of DEFAULT_ORDER
    if (
      parsed.length === DEFAULT_ORDER.length &&
      DEFAULT_ORDER.every(id => parsed.includes(id))
    ) return parsed
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

// ── Component ────────────────────────────────────────────────

export function DashboardClient({
  firstName, kpis, recentListings, recentClients, finance, blogPosts, allClients
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

  // Photo import state
  const [importTab, setImportTab] = useState<'text' | 'photo'>('text')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [photoClientId, setPhotoClientId] = useState<string>('')
  const [photoDragging, setPhotoDragging] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoLoadingMsg, setPhotoLoadingMsg] = useState('Lecture des photos...')
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoResult, setPhotoResult] = useState<ListingInitialData | null>(null)
  const [photoEditedResult, setPhotoEditedResult] = useState<Record<string, string>>({})
  const [photoCreating, setPhotoCreating] = useState(false)
  const [photoSuccess, setPhotoSuccess] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date())

  function openNewListing() {
    setFormInitialData(undefined)
    setFormDefaultClientId(undefined)
    setShowFormModal(true)
  }

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

  // ── Photo import helpers ──────────────────────────────────

  useEffect(() => {
    const urls = photoFiles.map(f => URL.createObjectURL(f))
    setPhotoPreviewUrls(urls)
    return () => { urls.forEach(u => URL.revokeObjectURL(u)) }
  }, [photoFiles])

  function addPhotos(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    setPhotoFiles(prev => [...prev, ...arr].slice(0, 10))
  }

  function removePhoto(idx: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function resizeImage(file: File, maxWidth = 1200): Promise<string> {
    return new Promise(resolve => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(objectUrl)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = objectUrl
    })
  }

  async function handleAnalyzePhotos() {
    if (photoFiles.length === 0) return
    setPhotoLoading(true)
    setPhotoError(null)
    setPhotoResult(null)

    const msgs = ['Lecture des photos...', 'Identification du véhicule...', 'Extraction des caractéristiques...']
    let msgIdx = 0
    setPhotoLoadingMsg(msgs[0])
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length
      setPhotoLoadingMsg(msgs[msgIdx])
    }, 2000)

    try {
      const base64Images = await Promise.all(photoFiles.map(f => resizeImage(f)))
      const res = await fetch('/api/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setPhotoError(json.error ?? 'Erreur inconnue')
      } else {
        const r = json.data as Record<string, unknown>
        setPhotoResult(r as ListingInitialData)
        const editable: Record<string, string> = {}
        for (const k of Object.keys(r)) {
          editable[k] = r[k] != null ? String(r[k]) : ''
        }
        setPhotoEditedResult(editable)
      }
    } catch {
      setPhotoError('Erreur réseau')
    } finally {
      clearInterval(interval)
      setPhotoLoading(false)
    }
  }

  async function handleCreateFromPhoto() {
    if (!photoResult || photoCreating) return
    setPhotoCreating(true)
    setPhotoError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const num = (k: string) => { const v = parseInt(photoEditedResult[k] ?? ''); return isNaN(v) ? null : v }
      const str = (k: string) => photoEditedResult[k]?.trim() || null

      const { data: listing, error: listingErr } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          client_id: photoClientId || null,
          brand: str('brand') ?? 'Inconnu',
          model: str('model'),
          year: num('year'),
          km: num('km'),
          price: num('price'),
          fuel: str('fuel'),
          gearbox: str('gearbox'),
          body: str('body'),
          country: str('country'),
          seller: str('seller'),
          horsepower: num('horsepower'),
          color: str('color'),
          notes: str('notes'),
          status: 'new',
        })
        .select('id')
        .single()

      if (listingErr || !listing) throw new Error(listingErr?.message ?? 'Erreur création annonce')

      const uploadResults = await Promise.all(
        photoFiles.map(async (file, idx) => {
          const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
          const path = `${user.id}/${listing.id}/${idx}.${ext}`
          const { error: upErr } = await supabase.storage
            .from('listing-photos')
            .upload(path, file, { contentType: file.type, upsert: true })
          if (upErr) return null
          const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
          return { url: publicUrl, position: idx }
        })
      )

      const valid = uploadResults.filter(Boolean) as { url: string; position: number }[]
      if (valid.length > 0) {
        await supabase.from('listing_photos').insert(
          valid.map(u => ({ user_id: user.id, listing_id: listing.id, url: u.url, position: u.position }))
        )
      }

      setPhotoSuccess(true)
      setTimeout(() => {
        setPhotoFiles([])
        setPhotoResult(null)
        setPhotoEditedResult({})
        setPhotoSuccess(false)
        router.refresh()
      }, 2000)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setPhotoCreating(false)
    }
  }

  // ── Section renderers ──────────────────────────────────────

  function renderImport() {
    return (
      <div className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-5 space-y-4">

        {/* ── Onglets ── */}
        <div className="flex gap-1 p-1 bg-[#0a0d14] border border-[#1a1f2e] rounded-xl w-fit">
          <button
            onClick={() => setImportTab('text')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${importTab === 'text' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1f2e]'}`}
          >
            📝 Import texte
          </button>
          <button
            onClick={() => setImportTab('photo')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${importTab === 'photo' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1f2e]'}`}
          >
            📸 Import photo
          </button>
        </div>

        {/* ── ONGLET TEXTE (existant, inchangé) ── */}
        {importTab === 'text' && (
          <>
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
                  <Button onClick={openFormWithResult} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
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
          </>
        )}

        {/* ── ONGLET PHOTO ── */}
        {importTab === 'photo' && (
          <>
            {photoSuccess ? (
              /* Écran de succès */
              <div className="py-12 text-center">
                <p className="text-3xl mb-3">✅</p>
                <p className="text-green-400 font-semibold text-base">Annonce créée avec succès !</p>
                <p className="text-gray-500 text-sm mt-1">Redirection en cours…</p>
              </div>

            ) : !photoResult ? (
              /* Zone d'upload */
              <>
                <div
                  onDragOver={e => { e.preventDefault(); setPhotoDragging(true) }}
                  onDragLeave={() => setPhotoDragging(false)}
                  onDrop={e => { e.preventDefault(); setPhotoDragging(false); addPhotos(e.dataTransfer.files) }}
                  onClick={() => photoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    photoDragging
                      ? 'border-orange-500/60 bg-orange-500/5'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-[#0a0d14]'
                  }`}
                >
                  <Camera className="w-12 h-12 text-gray-500 mb-3" />
                  <p className="text-sm font-medium text-gray-300 mb-1 text-center">
                    Glissez vos photos ici ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-gray-500 mb-1 text-center">
                    Screenshots d'annonces, photos de caractéristiques, photos du véhicule
                  </p>
                  <p className="text-xs text-gray-600">JPG, PNG, WEBP — jusqu'à 10 photos</p>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => { if (e.target.files) addPhotos(e.target.files) }}
                  />
                </div>

                {photoFiles.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">{photoFiles.length}/10 photos</p>
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                      {photoPreviewUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={e => { e.stopPropagation(); removePhoto(i) }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={photoClientId}
                    onChange={e => setPhotoClientId(e.target.value)}
                    className="h-9 rounded-md border border-[#2a2f3e] bg-[#0a0d14] px-3 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:w-56"
                  >
                    <option value="">— Aucun client (import libre) —</option>
                    {allClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAnalyzePhotos}
                    disabled={photoLoading || photoFiles.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 h-9 rounded-md bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                  >
                    {photoLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />{photoLoadingMsg}</>
                      : <><Camera className="w-4 h-4" />🔍 Analyser les photos avec l'IA</>
                    }
                  </button>
                </div>

                {photoError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {photoError}
                  </div>
                )}
              </>

            ) : (
              /* Formulaire éditable post-analyse */
              <>
                <p className="text-xs text-gray-500">
                  Vérifiez et corrigez les informations extraites par l'IA avant de créer l'annonce.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {([
                    { key: 'brand', label: 'Marque', type: 'text' },
                    { key: 'model', label: 'Modèle', type: 'text' },
                    { key: 'year', label: 'Année', type: 'number' },
                    { key: 'km', label: 'Kilométrage', type: 'number' },
                    { key: 'price', label: 'Prix (€)', type: 'number' },
                    { key: 'horsepower', label: 'Chevaux (ch)', type: 'number' },
                    { key: 'color', label: 'Couleur', type: 'text' },
                    { key: 'country', label: 'Pays (ISO)', type: 'text' },
                  ] as { key: string; label: string; type: string }[]).map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                      <input
                        type={type}
                        value={photoEditedResult[key] ?? ''}
                        onChange={e => setPhotoEditedResult(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full h-8 px-3 text-sm rounded-md border border-[#2a2f3e] bg-[#0a0d14] text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                  {([
                    { key: 'fuel', label: 'Carburant', options: ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'] },
                    { key: 'gearbox', label: 'Boîte de vitesses', options: ['Manuelle', 'Automatique'] },
                    { key: 'body', label: 'Carrosserie', options: ['Berline', 'SUV/4x4', 'Break', 'Coupé', 'Cabriolet', 'Citadine', 'Utilitaire', 'Monospace'] },
                    { key: 'seller', label: 'Type vendeur', options: ['particulier', 'professionnel'] },
                  ] as { key: string; label: string; options: string[] }[]).map(({ key, label, options }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                      <select
                        value={photoEditedResult[key] ?? ''}
                        onChange={e => setPhotoEditedResult(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full h-8 px-3 text-sm rounded-md border border-[#2a2f3e] bg-[#0a0d14] text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">—</option>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-xs text-gray-500 mb-1 block">Notes / équipements</label>
                    <textarea
                      value={photoEditedResult['notes'] ?? ''}
                      onChange={e => setPhotoEditedResult(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-md border border-[#2a2f3e] bg-[#0a0d14] text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                    />
                  </div>
                </div>

                {photoError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {photoError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setPhotoResult(null); setPhotoEditedResult({}); setPhotoError(null) }}
                    className="px-4 h-9 rounded-md border border-[#2a2f3e] text-gray-400 hover:text-gray-200 hover:border-[#3a3f4e] text-sm transition-colors"
                  >
                    ↩ Recommencer
                  </button>
                  <button
                    onClick={handleCreateFromPhoto}
                    disabled={photoCreating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 h-9 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    {photoCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                    {photoCreating ? 'Création en cours...' : "✅ Créer l'annonce"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
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
              {recentListings.map(listing => {
                const score = getFinalScore(listing.auto_score, listing.manual_score)
                const margin = listing.listing_margins?.[0]?.margin
                return (
                  <div key={listing.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#1a1f2e] bg-[#080b10] hover:border-[#2a2f3e] transition-colors group">
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
              {recentClients.map(client => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[#1a1f2e] bg-[#080b10] hover:border-[#2a2f3e] transition-colors">
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
                    <span className="text-xs text-gray-500 shrink-0 bg-[#0a0d14] px-2 py-0.5 rounded-full border border-[#1a1f2e]">
                      {client.listingCount} ann.
                    </span>
                  </div>
                </Link>
              ))}
              <Link href="/clients">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[#2a2f3e] text-xs text-gray-500 hover:text-orange-400 hover:border-orange-500/40 transition-colors mt-1">
                  <Plus className="w-3.5 h-3.5" /> Nouveau client
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderFinanceBlog() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finance */}
        <div className="space-y-3">
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
        </div>

        {/* Blog */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Newspaper className="w-3.5 h-3.5 text-pink-400" /> Blog
            </span>
            <div className="flex items-center gap-3">
              <Link href="/blog/nouveau">
                <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" /> Nouvel article
                </button>
              </Link>
              <Link href="/blog">
                <button className="text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
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
                    <div className="p-3 rounded-lg border border-[#1a1f2e] bg-[#080b10] hover:border-[#2a2f3e] transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-200 truncate">{post.title}</p>
                        <span className="text-[10px] text-gray-600 shrink-0">{date}</span>
                      </div>
                      {excerpt && <p className="text-xs text-gray-500 line-clamp-2">{excerpt}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const SECTION_META: Record<SectionId, { title: string; icon: React.ReactNode }> = {
    import: { title: 'Import Intelligent', icon: <Sparkles className="w-3.5 h-3.5 text-orange-400" /> },
    listingsClients: { title: 'Annonces & Clients', icon: <Car className="w-3.5 h-3.5 text-purple-400" /> },
    financeBlog: { title: 'Finance & Blog', icon: <BarChart3 className="w-3.5 h-3.5 text-teal-400" /> },
  }

  const SECTION_RENDER: Record<SectionId, () => React.ReactNode> = {
    import: renderImport,
    listingsClients: renderListingsClients,
    financeBlog: renderFinanceBlog,
  }

  return (
    <>
      <KeyboardShortcuts onNewListing={openNewListing} />
      <Header title="Dashboard" onNewListing={openNewListing} />

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">

          {/* ── HEADER ── */}
          <div>
            <p className="text-xs text-gray-500 capitalize">{today}</p>
            <h2 className="text-xl font-semibold text-gray-100 mt-0.5">
              Bonjour{firstName ? `, ${firstName}` : ''} 👋
            </h2>
          </div>

          {/* ── KPIs (fixed, not draggable) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard icon={<Users className="w-4 h-4" />} label="Clients actifs" value={kpis.activeClients} color="blue" href="/clients" />
            <KPICard icon={<Car className="w-4 h-4" />} label="Annonces" value={kpis.totalListings} color="purple" href="/annonces" />
            <KPICard icon={<TrendingUp className="w-4 h-4" />} label="En négociation" value={kpis.negotiationCount} color="orange" href="/annonces?status=negotiation" />
            <KPICard icon={<Euro className="w-4 h-4" />} label="Marge potentielle" value={formatPrice(kpis.totalPositiveMargin)} color="teal" isText href="/finance" />
            <KPICard icon={<Newspaper className="w-4 h-4" />} label="Articles publiés" value={kpis.blogCount} color="pink" href="/blog" />
          </div>

          {/* ── DRAGGABLE SECTIONS ── */}
          <div className="space-y-4">
            {order.map((sectionId, idx) => {
              const meta = SECTION_META[sectionId]
              const isDragOver = dragOverIdx === idx
              const isDragging = dragSrcIdx.current === idx
              return (
                <div
                  key={sectionId}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-xl border transition-all duration-150 ${
                    isDragOver
                      ? 'border-orange-500/50 bg-orange-500/5 shadow-lg shadow-orange-900/20 scale-[1.005]'
                      : isDragging
                      ? 'border-[#2a2f3e] bg-[#0d1117] opacity-50'
                      : 'border-[#1a1f2e] bg-[#0d1117]'
                  }`}
                >
                  {/* Section header (drag handle) */}
                  <div
                    className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1f2e] cursor-grab active:cursor-grabbing select-none"
                  >
                    <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                      {meta.icon}
                      {meta.title}
                    </span>
                  </div>
                  {/* Section content */}
                  <div className="p-4">
                    {SECTION_RENDER[sectionId]()}
                  </div>
                </div>
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
    <div className="rounded-xl border border-[#1a1f2e] bg-[#080b10] p-5 text-center space-y-1">
      <p className="text-gray-500 text-sm">{message}</p>
      {inner}
    </div>
  )
}
