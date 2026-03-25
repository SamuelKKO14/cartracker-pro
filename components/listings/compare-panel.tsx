'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatPrice, formatKm, getFinalScore, getScoreColor, COUNTRY_LABELS, STATUS_LABELS } from '@/lib/utils'
import type { ListingWithDetails } from '@/types/database'
import { ExternalLink } from 'lucide-react'

interface ComparePanelProps {
  listings: ListingWithDetails[]
  onClose: () => void
}

export function ComparePanel({ listings, onClose }: ComparePanelProps) {
  const rows: { label: string; fn: (l: ListingWithDetails) => React.ReactNode }[] = [
    { label: 'Score', fn: l => {
      const s = getFinalScore(l.auto_score, l.manual_score)
      return <span className={`font-bold ${getScoreColor(s)}`}>{s ?? '—'}/100</span>
    }},
    { label: 'Prix', fn: l => <span className="text-orange-400 font-semibold">{formatPrice(l.price)}</span> },
    { label: 'Coût import', fn: l => {
      const cost = l.country && l.country !== 'FR' ? '~' + formatPrice(500) : '0€'
      return cost
    }},
    { label: 'Année', fn: l => l.year ?? '—' },
    { label: 'Kilométrage', fn: l => formatKm(l.km) },
    { label: 'Carburant', fn: l => l.fuel ?? '—' },
    { label: 'Boîte', fn: l => l.gearbox ?? '—' },
    { label: 'Pays', fn: l => l.country ? (COUNTRY_LABELS[l.country] ?? l.country) : '—' },
    { label: 'Vendeur', fn: l => l.seller ?? '—' },
    { label: '1ère main', fn: l => l.first_owner ? '✅' : '❌' },
    { label: 'Marge', fn: l => {
      const m = l.margin?.margin
      if (m == null) return '—'
      return <span className={m >= 0 ? 'text-green-400' : 'text-red-400'}>{formatPrice(m)}</span>
    }},
    { label: 'Statut', fn: l => STATUS_LABELS[l.status] ?? l.status },
    { label: 'Client', fn: l => (l.client as { name?: string } | null)?.name ?? '—' },
    { label: 'Lien', fn: l => l.url ? (
      <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline flex items-center gap-1 text-xs">
        Voir <ExternalLink className="w-3 h-3" />
      </a>
    ) : '—' },
  ]

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={`max-w-[90vw] ${listings.length > 3 ? 'max-w-[95vw]' : 'max-w-4xl'}`}>
        <DialogHeader>
          <DialogTitle>Comparaison — {listings.length} annonces</DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2f3e]">
                <th className="p-2 text-left text-xs text-gray-400 w-28">Critère</th>
                {listings.map(l => (
                  <th key={l.id} className="p-2 text-left min-w-[140px]">
                    <p className="font-semibold text-gray-200">{l.brand} {l.model}</p>
                    <p className="text-xs text-gray-500">{l.year}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={`border-b border-[#1a1f2e] ${i % 2 === 0 ? 'bg-[#0d1117]' : 'bg-[#0a0d14]'}`}>
                  <td className="p-2 text-xs text-gray-400 font-medium">{row.label}</td>
                  {listings.map(l => (
                    <td key={l.id} className="p-2 text-gray-200">{row.fn(l)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
