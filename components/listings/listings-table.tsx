'use client'
import { createClient } from '@/lib/supabase/client'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { formatPrice, formatKm, getFinalScore, getScoreColor, STATUS_LABELS, STATUS_COLORS, COUNTRY_LABELS } from '@/lib/utils'
import type { ListingWithDetails, Client } from '@/types/database'
import { ExternalLink, Pencil, Calculator, CheckSquare, Search, Trash2 } from 'lucide-react'

interface ListingsTableProps {
  listings: ListingWithDetails[]
  selected: Set<string>
  onToggleSelect: (id: string) => void
  onEdit: (l: ListingWithDetails) => void
  onMargin: (l: ListingWithDetails) => void
  onChecklist: (l: ListingWithDetails) => void
  onSearchLinks: (l: ListingWithDetails) => void
  onRefresh: () => void
  clients: Client[]
}

export function ListingsTable({ listings, selected, onToggleSelect, onEdit, onMargin, onChecklist, onSearchLinks, onRefresh }: ListingsTableProps) {

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette annonce ?')) return
    const supabase = createClient()
    await supabase.from('listings').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#1a1f2e]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1a1f2e] bg-[#0a0d14]">
            <th className="w-10 p-3"></th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">Véhicule</th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">Année</th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">KM</th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">Prix</th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">Marge</th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">Score</th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">Pays</th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">Statut</th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">Client</th>
            <th className="p-3 text-left text-xs font-semibold text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing, i) => {
            const score = getFinalScore(listing.auto_score, listing.manual_score)
            const margin = listing.margin?.margin
            const isSelected = selected.has(listing.id)

            return (
              <tr
                key={listing.id}
                className={`border-b border-[#1a1f2e] last:border-0 transition-colors ${isSelected ? 'bg-orange-900/10' : i % 2 === 0 ? 'bg-[#0d1117]' : 'bg-[#0a0d14]'} hover:bg-[#1a1f2e]`}
              >
                <td className="p-3">
                  <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(listing.id)} />
                </td>
                <td className="p-3">
                  <div>
                    <p className="font-medium text-gray-200">{listing.brand} {listing.model}</p>
                    {listing.generation && <p className="text-xs text-gray-500">{listing.generation}</p>}
                  </div>
                </td>
                <td className="p-3 text-gray-300">{listing.year ?? '—'}</td>
                <td className="p-3 text-gray-300">{listing.km ? formatKm(listing.km) : '—'}</td>
                <td className="p-3 font-medium text-orange-400">{formatPrice(listing.price)}</td>
                <td className="p-3">
                  {margin != null ? (
                    <span className={`font-medium ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPrice(margin)}
                    </span>
                  ) : '—'}
                </td>
                <td className="p-3">
                  {score != null && (
                    <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
                  )}
                </td>
                <td className="p-3 text-gray-400 text-xs">
                  {listing.country ? (COUNTRY_LABELS[listing.country]?.split(' ')[0] ?? listing.country) : '—'}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[listing.status] ?? ''}`}>
                    {STATUS_LABELS[listing.status] ?? listing.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-gray-400">
                  {listing.client ? (listing.client as { name: string }).name : '—'}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(listing)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onMargin(listing)}>
                      <Calculator className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onChecklist(listing)}>
                      <CheckSquare className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onSearchLinks(listing)}>
                      <Search className="w-3 h-3" />
                    </Button>
                    {listing.url && (
                      <a href={listing.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-400" onClick={() => handleDelete(listing.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
