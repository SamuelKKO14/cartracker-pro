'use client'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, STATUS_LABELS, STATUS_COLORS, getFinalScore, getScoreColor } from '@/lib/utils'
import type { ListingWithDetails, Client } from '@/types/database'
import { Pencil, Calculator, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

const KANBAN_STATUSES = ['new', 'viewed', 'contacted', 'negotiation', 'bought', 'resold', 'ignored']

interface ListingsKanbanProps {
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

export function ListingsKanban({ listings, onEdit, onMargin, onChecklist, onRefresh }: ListingsKanbanProps) {

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const newStatus = result.destination.droppableId
    const listingId = result.draggableId

    const supabase = createClient()
    await supabase.from('listings').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', listingId)
    onRefresh()
  }

  const grouped = KANBAN_STATUSES.reduce<Record<string, ListingWithDetails[]>>((acc, status) => {
    acc[status] = listings.filter(l => l.status === status)
    return acc
  }, {})

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map(status => {
          const cols = grouped[status] ?? []
          return (
            <div key={status} className="flex-shrink-0 w-64">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-xs text-gray-500">{cols.length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[100px] rounded-xl border p-2 space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? 'border-orange-500/40 bg-orange-900/10' : 'border-[#1a1f2e] bg-[#0a0d14]'
                    }`}
                  >
                    {cols.map((listing, index) => {
                      const score = getFinalScore(listing.auto_score, listing.manual_score)
                      const margin = listing.margin?.margin
                      return (
                        <Draggable key={listing.id} draggableId={listing.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 rounded-lg border bg-[#0d1117] group transition-all ${
                                snapshot.isDragging ? 'border-orange-500/60 shadow-lg rotate-1' : 'border-[#1a1f2e] hover:border-[#2a2f3e]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-sm font-medium text-gray-200 leading-tight">
                                  {listing.brand} {listing.model}
                                </p>
                                {score != null && (
                                  <span className={`text-xs font-bold shrink-0 ${getScoreColor(score)}`}>{score}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{listing.year ?? ''} · {listing.km ? `${listing.km.toLocaleString('fr-FR')} km` : ''}</p>
                              {listing.price && <p className="text-sm font-semibold text-orange-400 mt-1">{formatPrice(listing.price)}</p>}
                              {margin != null && (
                                <p className={`text-xs mt-0.5 ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatPrice(margin)}
                                </p>
                              )}
                              {listing.client && (
                                <p className="text-xs text-gray-500 mt-1">
                                  👤 {(listing.client as { name: string }).name}
                                </p>
                              )}
                              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEdit(listing)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onMargin(listing)}>
                                  <Calculator className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onChecklist(listing)}>
                                  <CheckSquare className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
