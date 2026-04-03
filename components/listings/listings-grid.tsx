'use client'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  formatPrice, formatKm, getFinalScore, getScoreColor,
  STATUS_LABELS, STATUS_COLORS, COUNTRY_LABELS
} from '@/lib/utils'
import type { ListingWithDetails, Client } from '@/types/database'
import { Camera, ExternalLink, Pencil, Calculator, CheckSquare, Trash2 } from 'lucide-react'

interface ListingsGridProps {
  listings: ListingWithDetails[]
  selected: Set<string>
  onToggleSelect: (id: string) => void
  onViewDetail: (l: ListingWithDetails) => void
  onEdit: (l: ListingWithDetails) => void
  onMargin: (l: ListingWithDetails) => void
  onChecklist: (l: ListingWithDetails) => void
  onPhotos: (l: ListingWithDetails) => void
  onRefresh: () => void
  clients: Client[]
}

export function ListingsGrid({
  listings, selected, onToggleSelect, onViewDetail, onEdit, onMargin, onChecklist, onPhotos, onRefresh
}: ListingsGridProps) {

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette annonce ?')) return
    const supabase = createClient()
    await supabase.from('listings').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map(listing => {
        const score = getFinalScore(listing.auto_score, listing.manual_score)
        const margin = listing.margin?.margin
        const checklist = listing.checklist
        const checklistCount = checklist ? Object.entries(checklist)
          .filter(([k]) => !['id', 'user_id', 'listing_id', 'notes', 'created_at'].includes(k))
          .filter(([, v]) => v === true).length : 0
        const isSelected = selected.has(listing.id)
        const photos = listing.listing_photos ?? []
        const coverUrl = photos[0]?.url ?? null

        return (
          <div
            key={listing.id}
            onClick={() => onViewDetail(listing)}
            className={`relative rounded-xl border bg-[#0d1117] transition-all group overflow-hidden cursor-pointer ${
              isSelected ? 'border-orange-500/60 shadow-orange-900/20 shadow-lg' : 'border-[#1a1f2e] hover:border-[#2a2f3e]'
            }`}
          >
            {/* Cover photo or placeholder */}
            <div className="relative h-40 bg-[#0a0d14] overflow-hidden">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={`${listing.brand} ${listing.model ?? ''}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Camera className="w-8 h-8 text-gray-700" />
                </div>
              )}

              {/* Checkbox overlay */}
              <div className="absolute top-2.5 left-2.5 z-10" onClick={e => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(listing.id)}
                />
              </div>

              {/* Score badge overlay */}
              {score != null && (
                <div className={`absolute top-2.5 right-2.5 z-10 text-xs font-bold px-2 py-0.5 rounded-full ${getScoreColor(score)} bg-[#0a0d14]/90 border border-[#2a2f3e]`}>
                  {score}
                </div>
              )}
            </div>

            <div className="p-4">
              {/* Header */}
              <div className="mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-100 text-sm">
                    {listing.brand} {listing.model}
                  </h3>
                  {listing.generation && (
                    <span className="text-xs text-gray-500">{listing.generation}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[listing.status] ?? STATUS_COLORS.new}`}>
                    {STATUS_LABELS[listing.status] ?? listing.status}
                  </span>
                  {listing.country && listing.country !== 'FR' && (
                    <span className="text-xs text-yellow-400">
                      {COUNTRY_LABELS[listing.country]?.split(' ')[0]}
                    </span>
                  )}
                  {listing.first_owner && (
                    <span className="text-xs text-teal-400">1ère main</span>
                  )}
                </div>
              </div>

              {/* Key info */}
              <div className="space-y-1 mb-3">
                {listing.year && <p className="text-xs text-gray-400">{listing.year} · {listing.fuel ?? ''} · {listing.gearbox ?? ''}</p>}
                {listing.km && <p className="text-xs text-gray-400">{formatKm(listing.km)}</p>}
                {listing.price && <p className="text-base font-bold text-orange-400">{formatPrice(listing.price)}</p>}
              </div>

              {/* Client */}
              {listing.client && (
                <div className="mb-2">
                  <span className="text-xs text-gray-500">
                    👤 {(listing.client as { name: string }).name}
                  </span>
                </div>
              )}

              {/* Margin */}
              {margin != null && (
                <div className={`text-xs px-2 py-1 rounded mb-2 ${margin >= 0 ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                  Marge : {formatPrice(margin)}
                </div>
              )}

              {/* Checklist progress */}
              {checklist && (
                <div className="mb-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Checklist</span>
                    <span>{checklistCount}/12</span>
                  </div>
                  <Progress value={(checklistCount / 12) * 100} className="h-1" />
                </div>
              )}

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {listing.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-orange-900/20 text-orange-400 border border-orange-800/30">
                      {tag}
                    </span>
                  ))}
                  {listing.tags.length > 3 && <span className="text-xs text-gray-500">+{listing.tags.length - 3}</span>}
                </div>
              )}

              {/* Photos button */}
              <button
                onClick={e => { e.stopPropagation(); onPhotos(listing) }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 mb-3 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Photos {photos.length > 0 ? `(${photos.length})` : ''}
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={e => { e.stopPropagation(); onEdit(listing) }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={e => { e.stopPropagation(); onMargin(listing) }}>
                  <Calculator className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={e => { e.stopPropagation(); onChecklist(listing) }}>
                  <CheckSquare className="w-3 h-3" />
                </Button>
                {listing.url && (
                  <a href={listing.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                )}
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500 hover:text-red-400 ml-auto" onClick={e => { e.stopPropagation(); handleDelete(listing.id) }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
