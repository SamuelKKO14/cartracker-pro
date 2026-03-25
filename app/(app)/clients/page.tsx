'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ClientFormModal } from '@/components/clients/client-form-modal'
import { ImportClientsModal } from '@/components/clients/import-clients-modal'
import { formatPrice } from '@/lib/utils'
import type { Client } from '@/types/database'
import { Download, Plus, Search, Users, Phone, Mail, Euro, Pencil, Trash2, FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ClientsPage() {
  const [clients, setClients] = useState<(Client & { listing_count?: number; negotiation_count?: number; bought_count?: number })[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewClient, setShowNewClient] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (!clientsData) return

      // Get listing counts
      const { data: rawListings } = await supabase
        .from('listings')
        .select('client_id, status')
        .eq('user_id', user.id)
        .not('client_id', 'is', null)

      const listings = rawListings as Array<{ client_id: string; status: string }> | null

      const counts: Record<string, { total: number; negotiation: number; bought: number }> = {}
      listings?.forEach(l => {
        if (!l.client_id) return
        if (!counts[l.client_id]) counts[l.client_id] = { total: 0, negotiation: 0, bought: 0 }
        counts[l.client_id].total++
        if (l.status === 'negotiation') counts[l.client_id].negotiation++
        if (l.status === 'bought') counts[l.client_id].bought++
      })

      const typed = clientsData as Client[]
      setClients(typed.map(c => ({
        ...c,
        listing_count: counts[c.id]?.total ?? 0,
        negotiation_count: counts[c.id]?.negotiation ?? 0,
        bought_count: counts[c.id]?.bought ?? 0,
      })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce client et toutes ses notes ?')) return
    const supabase = createClient()
    await supabase.from('clients').delete().eq('id', id)
    fetchClients()
  }

  const filtered = clients.filter(c =>
    !search || [c.name, c.email, c.phone, c.criteria].filter(Boolean).some(v => v!.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <KeyboardShortcuts onNewListing={() => {}} />
      <Header title="Clients" />

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 space-y-4 max-w-5xl mx-auto">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Rechercher un client…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <Download className="w-4 h-4" /> Importer
            </Button>
            <Button onClick={() => setShowNewClient(true)}>
              <Plus className="w-4 h-4" /> Nouveau client
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Users className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-gray-400">Aucun client</p>
              <Button onClick={() => setShowNewClient(true)}>Ajouter un client</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(client => (
                <div key={client.id} className="group flex items-center gap-4 p-4 rounded-xl border border-[#1a1f2e] bg-[#0d1117] hover:border-[#2a2f3e] transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400 font-semibold text-sm shrink-0">
                    {client.name[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-200">{client.name}</p>
                      {client.billing_type === 'monthly' && (
                        <Badge variant="secondary" className="text-xs">Forfait mensuel</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                      {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                      {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                      {client.budget && <span className="flex items-center gap-1"><Euro className="w-3 h-3" />{formatPrice(client.budget)}</span>}
                    </div>
                    {client.criteria && (
                      <p className="text-xs text-gray-400 mt-1 truncate" title={client.criteria}>
                        🔍 {client.criteria}
                      </p>
                    )}
                  </div>

                  {/* Counters */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-200">{client.listing_count}</p>
                      <p className="text-xs text-gray-500">annonces</p>
                    </div>
                    {(client.negotiation_count ?? 0) > 0 && (
                      <div className="text-center">
                        <p className="text-base font-bold text-orange-400">{client.negotiation_count}</p>
                        <p className="text-xs text-gray-500">négo</p>
                      </div>
                    )}
                    {(client.bought_count ?? 0) > 0 && (
                      <div className="text-center">
                        <p className="text-base font-bold text-green-400">{client.bought_count}</p>
                        <p className="text-xs text-gray-500">acheté</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Link href={`/clients/${client.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditClient(client)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(client.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Link href={`/annonces?client=${client.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showImport && (
        <ImportClientsModal open onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); fetchClients() }} />
      )}
      {showNewClient && (
        <ClientFormModal open onClose={() => setShowNewClient(false)} onSaved={() => { setShowNewClient(false); fetchClients() }} />
      )}
      {editClient && (
        <ClientFormModal open onClose={() => setEditClient(null)} onSaved={() => { setEditClient(null); fetchClients() }} client={editClient} />
      )}
    </>
  )
}
