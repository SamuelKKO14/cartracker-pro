'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ListingFormModal } from '@/components/listings/listing-form-modal'
import type { ListingInitialData } from '@/components/listings/listing-form-modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Camera, X, Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react'

// ── Constants ────────────────────────────────────────────────

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

// ── Props ────────────────────────────────────────────────────

interface SmartImportProps {
  allClients: { id: string; name: string }[]
  onListingCreated?: () => void
}

// ── Component ────────────────────────────────────────────────

export function SmartImport({ allClients, onListingCreated }: SmartImportProps) {
  const router = useRouter()

  // Tab
  const [importTab, setImportTab] = useState<'text' | 'photo'>('text')

  // Text import state
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<ListingInitialData | null>(null)
  const [aiClientId, setAiClientId] = useState<string>('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [formInitialData, setFormInitialData] = useState<ListingInitialData | undefined>(undefined)
  const [formDefaultClientId, setFormDefaultClientId] = useState<string | undefined>(undefined)

  // Photo import state
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

  // Sync object URLs with photoFiles (with cleanup)
  useEffect(() => {
    const urls = photoFiles.map(f => URL.createObjectURL(f))
    setPhotoPreviewUrls(urls)
    return () => { urls.forEach(u => URL.revokeObjectURL(u)) }
  }, [photoFiles])

  // ── Text import ────────────────────────────────────────────

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

  // ── Photo import ───────────────────────────────────────────

  function addPhotos(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    setPhotoFiles(prev => [...prev, ...arr].slice(0, 30))
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
        onListingCreated?.()
        router.refresh()
      }, 2000)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setPhotoCreating(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      {showFormModal && (
        <ListingFormModal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSaved={() => {
            setShowFormModal(false)
            setAiResult(null)
            setAiText('')
            onListingCreated?.()
            router.refresh()
          }}
          initialData={formInitialData}
          defaultClientId={formDefaultClientId}
        />
      )}

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

        {/* ── ONGLET TEXTE ── */}
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
              <div className="py-12 text-center">
                <p className="text-3xl mb-3">✅</p>
                <p className="text-green-400 font-semibold text-base">Annonce créée avec succès !</p>
                <p className="text-gray-500 text-sm mt-1">Redirection en cours…</p>
              </div>

            ) : !photoResult ? (
              <>
                {/* Zone de drop */}
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
                  <p className="text-xs text-gray-600">JPG, PNG, WEBP — jusqu'à 30 photos</p>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => { if (e.target.files) addPhotos(e.target.files) }}
                  />
                </div>

                {/* Miniatures */}
                {photoFiles.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">{photoFiles.length}/30 photos</p>
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

                {/* Client + Bouton analyser */}
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
    </>
  )
}
