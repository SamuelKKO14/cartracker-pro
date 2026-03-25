'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice, formatKm, COUNTRY_LABELS } from '@/lib/utils'
import type { ListingWithDetails } from '@/types/database'
import { Check, Copy, ExternalLink, Link2, Loader2 } from 'lucide-react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  listings: ListingWithDetails[]
}

type ShareMode = 'whatsapp_grouped' | 'whatsapp_individual' | 'table' | 'summary' | 'web_link'

const MODES: { key: ShareMode; label: string }[] = [
  { key: 'whatsapp_grouped', label: '📱 WhatsApp groupé' },
  { key: 'whatsapp_individual', label: '📱 1 msg / annonce' },
  { key: 'table', label: '📊 Tableau' },
  { key: 'summary', label: '📄 Résumé' },
  { key: 'web_link', label: '🔗 Lien web' },
]

function generateWhatsAppGrouped(listings: ListingWithDetails[]): string {
  const lines = ['🚗 *Sélection de véhicules — CarTracker Pro*\n']
  listings.forEach((l, i) => {
    lines.push(`*${i + 1}. ${l.brand} ${l.model ?? ''} ${l.year ?? ''}*`)
    if (l.km) lines.push(`   📍 ${formatKm(l.km)}`)
    if (l.price) lines.push(`   💶 ${formatPrice(l.price)}`)
    if (l.fuel) lines.push(`   ⛽ ${l.fuel} · ${l.gearbox ?? ''}`)
    if (l.country) lines.push(`   🌍 ${COUNTRY_LABELS[l.country] ?? l.country}`)
    if (l.url) lines.push(`   🔗 ${l.url}`)
    const photos = l.listing_photos ?? []
    if (photos.length > 0) lines.push(`   📸 Photos : ${photos.map(p => p.url).join(' ')}`)
    lines.push('')
  })
  return lines.join('\n')
}

function generateWhatsAppIndividual(listing: ListingWithDetails): string {
  const lines = [
    `🚗 *${listing.brand} ${listing.model ?? ''} ${listing.year ?? ''}*`,
    listing.generation ? `Génération: ${listing.generation}` : '',
    listing.km ? `📍 Kilométrage: ${formatKm(listing.km)}` : '',
    listing.price ? `💶 Prix: ${formatPrice(listing.price)}` : '',
    listing.fuel ? `⛽ Carburant: ${listing.fuel}` : '',
    listing.gearbox ? `⚙️ Boîte: ${listing.gearbox}` : '',
    listing.body ? `🚙 Carrosserie: ${listing.body}` : '',
    listing.country ? `🌍 Pays: ${COUNTRY_LABELS[listing.country] ?? listing.country}` : '',
    listing.seller ? `👤 Vendeur: ${listing.seller}` : '',
    listing.first_owner ? '✅ 1ère main' : '',
    listing.margin?.margin != null ? `💰 Marge estimée: ${formatPrice(listing.margin.margin)}` : '',
    listing.url ? `🔗 ${listing.url}` : '',
    (listing.listing_photos ?? []).length > 0
      ? `📸 Photos : ${(listing.listing_photos ?? []).map(p => p.url).join(' ')}`
      : '',
  ].filter(Boolean)
  return lines.join('\n')
}

function generateTable(listings: ListingWithDetails[]): string {
  const headers = ['Marque', 'Modèle', 'Année', 'KM', 'Prix', 'Carburant', 'Boîte', 'Pays', 'Marge']
  const rows = listings.map(l => [
    l.brand,
    l.model ?? '',
    l.year?.toString() ?? '',
    l.km ? formatKm(l.km) : '',
    l.price ? formatPrice(l.price) : '',
    l.fuel ?? '',
    l.gearbox ?? '',
    l.country ? (COUNTRY_LABELS[l.country] ?? l.country) : '',
    l.margin?.margin != null ? formatPrice(l.margin.margin) : '',
  ])

  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)))
  const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join(' | ')
  const separator = widths.map(w => '-'.repeat(w)).join('-+-')
  const dataRows = rows.map(r => r.map((c, i) => c.padEnd(widths[i])).join(' | '))

  return [headerRow, separator, ...dataRows].join('\n')
}

function generateSummary(listings: ListingWithDetails[]): string {
  const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const lines = [`Sélection de véhicules — ${date}`, '', `${listings.length} véhicule(s) analysé(s)`, '']

  listings.forEach((l, i) => {
    lines.push(`${i + 1}. ${l.brand} ${l.model ?? ''} ${l.year ?? ''} — ${formatPrice(l.price)}`)
    if (l.km) lines.push(`   Kilométrage : ${formatKm(l.km)}`)
    if (l.fuel || l.gearbox) lines.push(`   Motorisation : ${[l.fuel, l.gearbox].filter(Boolean).join(', ')}`)
    if (l.country) lines.push(`   Pays : ${COUNTRY_LABELS[l.country] ?? l.country}`)
    if (l.margin?.margin != null) lines.push(`   Marge estimée : ${formatPrice(l.margin.margin)}`)
    if (l.notes) lines.push(`   Notes : ${l.notes}`)
    const photos = l.listing_photos ?? []
    if (photos.length > 0) lines.push(`   Photos : ${photos.map(p => p.url).join(' ')}`)
    lines.push('')
  })

  return lines.join('\n')
}

// ── Web Link tab ──────────────────────────────────────────────────────────────

function WebLinkTab({ listings }: { listings: ListingWithDetails[] }) {
  const [title, setTitle] = useState(`Votre sélection de ${listings.length} véhicule${listings.length !== 1 ? 's' : ''}`)
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    setGeneratedUrl(null)
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_ids: listings.map(l => l.id),
          title: title.trim() || null,
          message: message.trim() || null,
        }),
      })
      const json = await res.json()
      if (json.url) setGeneratedUrl(json.url)
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopyUrl() {
    if (!generatedUrl) return
    await navigator.clipboard.writeText(generatedUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  function handleWhatsApp() {
    if (!generatedUrl) return
    const text = encodeURIComponent(`Bonjour ! Voici votre sélection de véhicules personnalisée : ${generatedUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Titre de la sélection</Label>
        <Input
          placeholder="Votre sélection BMW"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Message pour le client <span className="text-gray-500 text-xs">(optionnel)</span></Label>
        <Textarea
          placeholder="Bonjour, voici les véhicules que j'ai sélectionnés pour vous selon vos critères. N'hésitez pas à me dire lesquels vous intéressent !"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="min-h-[90px] text-sm"
        />
      </div>

      <div className="text-xs text-gray-500 bg-[#0a0d14] rounded-lg p-3 border border-[#1a1f2e]">
        <span className="font-medium text-gray-400">Inclus dans ce partage :</span>{' '}
        {listings.map(l => `${l.brand} ${l.model ?? ''}`.trim()).join(', ')}
        {' '}· Les URLs d&apos;origine et les scores ne seront pas visibles par le client.
      </div>

      <Button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération…</>
          : <><Link2 className="w-4 h-4" /> Générer le lien</>
        }
      </Button>

      {generatedUrl && (
        <div className="space-y-3 p-4 rounded-xl border border-green-800/40 bg-green-900/10">
          <p className="text-xs font-medium text-green-400">✅ Lien créé avec succès !</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-[#0a0d14] border border-[#2a2f3e] rounded-lg px-3 py-2 text-gray-300 truncate">
              {generatedUrl}
            </code>
            <Button size="sm" variant="secondary" onClick={handleCopyUrl} className="shrink-0">
              {copiedUrl ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
              onClick={handleWhatsApp}
            >
              📱 Partager sur WhatsApp
            </Button>
            <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function ShareModal({ open, onClose, listings }: ShareModalProps) {
  const [mode, setMode] = useState<ShareMode>('whatsapp_grouped')
  const [copied, setCopied] = useState(false)

  function getContent(): string {
    switch (mode) {
      case 'whatsapp_grouped': return generateWhatsAppGrouped(listings)
      case 'whatsapp_individual': return listings.map(generateWhatsAppIndividual).join('\n---\n\n')
      case 'table': return generateTable(listings)
      case 'summary': return generateSummary(listings)
      default: return ''
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(getContent())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isTextMode = mode !== 'web_link'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Partager {listings.length} annonce{listings.length !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                mode === m.key
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-[#1a1f2e] text-gray-300 border border-[#2a2f3e] hover:border-[#3a3f4e]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'web_link' ? (
          <WebLinkTab listings={listings} />
        ) : (
          <>
            <Textarea
              value={getContent()}
              readOnly
              className="font-mono text-xs min-h-[200px] max-h-[300px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>Fermer</Button>
              <Button onClick={handleCopy}>
                {copied ? <><Check className="w-4 h-4" /> Copié !</> : <><Copy className="w-4 h-4" /> Copier</>}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
