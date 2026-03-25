'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { ClientShare, ClientShareResponse } from '@/types/database'
import { Check, ChevronDown, ChevronUp, Copy, Eye, Link2, MessageSquare, Share2, Trash2 } from 'lucide-react'

interface ShareWithMeta extends ClientShare {
  client_name?: string | null
  responses?: ClientShareResponse[]
  expanded?: boolean
}

const REACTION_LABELS: Record<string, string> = {
  interested: '✅ Intéressé(e)',
  not_interested: '❌ Pas pour moi',
}

export default function PartagesPage() {
  const [shares, setShares] = useState<ShareWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchShares = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: rawShares } = await supabase
        .from('client_shares')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!rawShares) return
      const sharesData = rawShares as ClientShare[]

      // Fetch client names
      const clientIds = [...new Set(sharesData.map(s => s.client_id).filter(Boolean))] as string[]
      const clientMap: Record<string, string> = {}
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds)
        ;(clients as Array<{ id: string; name: string }> | null)?.forEach(c => { clientMap[c.id] = c.name })
      }

      // Fetch all responses for this user's shares
      const shareIds = sharesData.map(s => s.id)
      const responsesMap: Record<string, ClientShareResponse[]> = {}
      if (shareIds.length > 0) {
        const { data: responses } = await supabase
          .from('client_share_responses')
          .select('*')
          .in('share_id', shareIds)
        ;(responses as ClientShareResponse[] | null)?.forEach(r => {
          if (!responsesMap[r.share_id]) responsesMap[r.share_id] = []
          responsesMap[r.share_id].push(r)
        })
      }

      setShares(sharesData.map(s => ({
        ...s,
        client_name: s.client_id ? (clientMap[s.client_id] ?? null) : null,
        responses: responsesMap[s.id] ?? [],
        expanded: false,
      })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchShares() }, [fetchShares])

  function getShareUrl(token: string) {
    return `${window.location.origin}/share/${token}`
  }

  async function handleCopy(share: ShareWithMeta) {
    await navigator.clipboard.writeText(getShareUrl(share.token))
    setCopiedId(share.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce partage ? Le lien ne sera plus accessible.')) return
    const supabase = createClient()
    await supabase.from('client_shares').delete().eq('id', id)
    fetchShares()
  }

  function toggleExpand(id: string) {
    setShares(prev => prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s))
  }

  return (
    <>
      <KeyboardShortcuts />
      <Header title="Mes partages" />

      <div className="flex-1 overflow-y-auto pt-14">
        <div className="p-6 max-w-4xl mx-auto space-y-4">

          {loading ? (
            <div className="text-center py-20 text-gray-500">Chargement…</div>
          ) : shares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Share2 className="w-12 h-12 text-gray-600" />
              <p className="text-gray-400 text-sm">Aucun partage créé.</p>
              <p className="text-gray-600 text-xs">Sélectionnez des annonces dans la page Annonces et cliquez sur "Partager" pour créer un lien client.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map(share => (
                <div key={share.id} className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] overflow-hidden">
                  {/* Share header */}
                  <div className="p-4 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-200 text-sm">
                          {share.title ?? 'Partage sans titre'}
                        </p>
                        {share.client_name && (
                          <span className="text-xs text-gray-500">👤 {share.client_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span>{formatDate(share.created_at)}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{share.views} vue{share.views !== 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{share.responses?.length ?? 0} réponse{(share.responses?.length ?? 0) !== 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1"><Link2 className="w-3 h-3" />{share.listing_ids.length} annonce{share.listing_ids.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => handleCopy(share)}
                      >
                        {copiedId === share.id
                          ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copié</>
                          : <><Copy className="w-3.5 h-3.5" /> Copier</>
                        }
                      </Button>
                      {(share.responses?.length ?? 0) > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => toggleExpand(share.id)}
                        >
                          {share.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Réponses
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
                        onClick={() => handleDelete(share.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Responses panel */}
                  {share.expanded && share.responses && share.responses.length > 0 && (
                    <div className="border-t border-[#1a1f2e] bg-[#0a0d14]">
                      {share.responses.map(r => (
                        <div key={r.id} className="flex items-start gap-3 px-4 py-3 border-b border-[#1a1f2e] last:border-0">
                          <span className="text-sm shrink-0">{REACTION_LABELS[r.reaction] ?? r.reaction}</span>
                          {r.comment && (
                            <span className="text-xs text-gray-400 italic">"{r.comment}"</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
