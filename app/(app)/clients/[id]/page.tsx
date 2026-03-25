'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDateTime } from '@/lib/utils'
import type { Client, ClientNote, ListingWithDetails } from '@/types/database'
import { ArrowLeft, Phone, Mail, Euro, Bot, Send, Car } from 'lucide-react'
import Link from 'next/link'
import { ListingsGrid } from '@/components/listings/listings-grid'
import { ListingFormModal } from '@/components/listings/listing-form-modal'
import { MarginModal } from '@/components/listings/margin-modal'
import { ChecklistModal } from '@/components/listings/checklist-modal'
import { SearchLinksModal } from '@/components/listings/search-links-modal'
import { PhotosModal } from '@/components/listings/photos-modal'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [addingNote, setAddingNote] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Modals
  const [showNewListing, setShowNewListing] = useState(false)
  const [editListing, setEditListing] = useState<ListingWithDetails | null>(null)
  const [marginListing, setMarginListing] = useState<ListingWithDetails | null>(null)
  const [checklistListing, setChecklistListing] = useState<ListingWithDetails | null>(null)
  const [searchLinksListing, setSearchLinksListing] = useState<ListingWithDetails | null>(null)
  const [photosListing, setPhotosListing] = useState<ListingWithDetails | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [clientRes, notesRes, listingsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('client_notes').select('*').eq('client_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('listings').select('*, listing_margins(*), listing_checklist(*), listing_photos(*)').eq('client_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    setClient(clientRes.data as Client | null)
    setNotes((notesRes.data as ClientNote[]) ?? [])
    setListings((listingsRes.data as ListingWithDetails[]) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  async function addNote() {
    if (!noteText.trim()) return
    setAddingNote(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('client_notes').insert({
        user_id: user.id,
        client_id: id,
        text: noteText.trim(),
      })
      setNoteText('')
      fetchData()
    } finally {
      setAddingNote(false)
    }
  }

  function generateClaudePrompt(): string {
    if (!client) return ''
    const lines = [
      `Je cherche des annonces de voitures d'occasion pour un client avec les critères suivants :`,
      ``,
      client.criteria ? `Critères : ${client.criteria}` : '',
      client.budget ? `Budget maximum : ${formatPrice(client.budget)}` : '',
      ``,
      `Trouve-moi des annonces sur AutoScout24, La Centrale, LeBonCoin et mobile.de correspondant à ces critères.`,
      `Pour chaque annonce, donne-moi : marque, modèle, année, kilométrage, prix, pays, vendeur, lien.`,
      `Format : JSON array.`,
    ].filter(v => v !== null)
    return lines.join('\n')
  }

  async function copyClaudePrompt() {
    await navigator.clipboard.writeText(generateClaudePrompt())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">Chargement…</div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-400">Client introuvable</p>
          <Button className="mt-3" onClick={() => router.push('/clients')}>Retour</Button>
        </div>
      </div>
    )
  }

  const listingProps = {
    listings,
    selected,
    onToggleSelect: (id: string) => setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    }),
    onEdit: setEditListing,
    onMargin: setMarginListing,
    onChecklist: setChecklistListing,
    onSearchLinks: setSearchLinksListing,
    onPhotos: setPhotosListing,
    onRefresh: fetchData,
    clients: [],
  }

  return (
    <>
      <Header title={client.name} onNewListing={() => setShowNewListing(true)} />

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          {/* Back */}
          <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200">
            <ArrowLeft className="w-4 h-4" /> Tous les clients
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: client info + notes */}
            <div className="space-y-4">
              {/* Info card */}
              <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0d1117] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400 font-bold text-lg">
                    {client.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-100 text-lg">{client.name}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {client.billing_type === 'monthly' ? 'Forfait mensuel' : 'Par recherche'}
                    </Badge>
                  </div>
                </div>

                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-orange-400">
                    <Phone className="w-4 h-4 text-gray-500" /> {client.phone}
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-orange-400">
                    <Mail className="w-4 h-4 text-gray-500" /> {client.email}
                  </a>
                )}
                {client.budget && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Euro className="w-4 h-4 text-gray-500" /> Budget : <strong>{formatPrice(client.budget)}</strong>
                  </div>
                )}
                {client.criteria && (
                  <div className="p-3 rounded-lg bg-[#1a1f2e] text-sm text-gray-300">
                    <p className="text-xs text-gray-500 mb-1">Critères</p>
                    {client.criteria}
                  </div>
                )}

                <Button variant="secondary" className="w-full gap-2" onClick={copyClaudePrompt}>
                  <Bot className="w-4 h-4 text-orange-400" />
                  Copier le prompt Claude
                </Button>
              </div>

              {/* Notes */}
              <div className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0d1117] space-y-3">
                <h3 className="text-sm font-semibold text-gray-300">Historique des échanges</h3>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ajouter une note…"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={2}
                    onKeyDown={e => e.key === 'Enter' && e.ctrlKey && addNote()}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={addNote} disabled={addingNote || !noteText.trim()} className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {notes.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">Aucune note</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {notes.map(note => (
                      <div key={note.id} className="p-3 rounded-lg bg-[#1a1f2e] space-y-1">
                        <p className="text-xs text-gray-500">{formatDateTime(note.created_at)}</p>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: listings */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Car className="w-4 h-4 text-orange-400" />
                  Annonces ({listings.length})
                </h3>
                <Button size="sm" onClick={() => setShowNewListing(true)}>
                  + Ajouter
                </Button>
              </div>
              {listings.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  Aucune annonce pour ce client
                </div>
              ) : (
                <ListingsGrid {...listingProps} />
              )}
            </div>
          </div>
        </div>
      </div>

      {showNewListing && (
        <ListingFormModal open onClose={() => setShowNewListing(false)} onSaved={() => { setShowNewListing(false); fetchData() }} defaultClientId={id} />
      )}
      {editListing && (
        <ListingFormModal open onClose={() => setEditListing(null)} onSaved={() => { setEditListing(null); fetchData() }} listing={editListing} />
      )}
      {marginListing && (
        <MarginModal open onClose={() => setMarginListing(null)} listing={marginListing} onSaved={fetchData} />
      )}
      {checklistListing && (
        <ChecklistModal open onClose={() => setChecklistListing(null)} listing={checklistListing} onSaved={fetchData} />
      )}
      {searchLinksListing && (
        <SearchLinksModal open onClose={() => setSearchLinksListing(null)} listing={searchLinksListing} />
      )}
      {photosListing && (
        <PhotosModal open onClose={() => setPhotosListing(null)} listing={photosListing} onRefresh={fetchData} />
      )}
    </>
  )
}
