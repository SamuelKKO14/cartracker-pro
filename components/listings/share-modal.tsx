'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice, formatKm, COUNTRY_LABELS } from '@/lib/utils'
import type { ListingWithDetails } from '@/types/database'
import { Copy, Check } from 'lucide-react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  listings: ListingWithDetails[]
}

type ShareMode = 'whatsapp_grouped' | 'whatsapp_individual' | 'table' | 'summary'

const MODES: { key: ShareMode; label: string }[] = [
  { key: 'whatsapp_grouped', label: '📱 WhatsApp groupé' },
  { key: 'whatsapp_individual', label: '📱 1 message / annonce' },
  { key: 'table', label: '📊 Tableau comparatif' },
  { key: 'summary', label: '📄 Résumé texte' },
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
    lines.push('')
  })

  return lines.join('\n')
}

export function ShareModal({ open, onClose, listings }: ShareModalProps) {
  const [mode, setMode] = useState<ShareMode>('whatsapp_grouped')
  const [copied, setCopied] = useState(false)

  function getContent(): string {
    switch (mode) {
      case 'whatsapp_grouped':
        return generateWhatsAppGrouped(listings)
      case 'whatsapp_individual':
        return listings.map(generateWhatsAppIndividual).join('\n---\n\n')
      case 'table':
        return generateTable(listings)
      case 'summary':
        return generateSummary(listings)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(getContent())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Partager {listings.length} annonce{listings.length !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                mode === m.key
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-[#1a1f2e] text-gray-300 border border-[#2a2f3e] hover:border-[#3a3f4e]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

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
      </DialogContent>
    </Dialog>
  )
}
