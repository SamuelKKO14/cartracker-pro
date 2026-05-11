'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReservationWithDetails, StatutReservation } from '@/types/database'
import {
  Calendar, Clock, MapPin, User, Phone, Mail,
  CheckCircle, XCircle, AlertCircle, Eye, Loader2,
} from 'lucide-react'

const STATUT_CONFIG: Record<StatutReservation, { label: string; color: string; icon: typeof CheckCircle }> = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: AlertCircle },
  confirmee: { label: 'Confirmée', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle },
  realisee: { label: 'Réalisée', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: CheckCircle },
  annulee: { label: 'Annulée', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
  no_show: { label: 'No-show', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30', icon: Eye },
}

interface Props {
  initialData: ReservationWithDetails[]
}

export function ReservationsClient({ initialData }: Props) {
  const [reservations, setReservations] = useState<ReservationWithDetails[]>(initialData)
  const [filter, setFilter] = useState<StatutReservation | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Debounce ref pour Realtime
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Un seul channel ref pour éviter duplication
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await (supabase as any)
        .from('reservations')
        .select('*, prestations(id, nom, prix, duree_minutes, categorie), clients(id, prenom, nom, email, telephone)')
        .order('date_rdv', { ascending: false })
        .order('heure_rdv', { ascending: false })
        .limit(100)

      setReservations(((data ?? []) as ReservationWithDetails[]))
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced re-fetch (500ms) — PAS d'append au state
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadData()
    }, 500)
  }, [loadData])

  // Realtime : UN SEUL channel, re-fetch complet
  useEffect(() => {
    const supabase = createClient()

    // Nettoyer l'ancien channel s'il existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('reservations-admin')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          // RE-FETCH complet, PAS de setState append
          debouncedRefetch()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [debouncedRefetch])

  async function updateStatut(reservationId: string, newStatut: StatutReservation) {
    setActionLoading(reservationId)
    try {
      if (newStatut === 'confirmee') {
        // Utiliser la route sécurisée confirm-booking
        const res = await fetch('/api/confirm-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_id: reservationId }),
        })
        if (!res.ok) {
          const data = await res.json()
          alert(data.error || 'Erreur')
          return
        }
      } else {
        const supabase = createClient()
        const { error } = await supabase
          .from('reservations')
          .update({ statut: newStatut, updated_at: new Date().toISOString() })
          .eq('id', reservationId)
        if (error) {
          alert('Erreur: ' + error.message)
          return
        }
      }
      // Le Realtime va déclencher le re-fetch
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter(r => r.statut === filter)

  const counts = reservations.reduce((acc, r) => {
    acc[r.statut] = (acc[r.statut] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Réservations</h1>
          <p className="text-sm text-gray-400 mt-1">{reservations.length} réservation(s)</p>
        </div>
        {loading && <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            filter === 'all'
              ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              : 'bg-[#0d1117] text-gray-400 border-[#1a1f2e] hover:border-[#2a2f3e]'
          }`}
        >
          Toutes ({reservations.length})
        </button>
        {(Object.entries(STATUT_CONFIG) as [StatutReservation, typeof STATUT_CONFIG[StatutReservation]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filter === key ? cfg.color : 'bg-[#0d1117] text-gray-400 border-[#1a1f2e] hover:border-[#2a2f3e]'
            }`}
          >
            {cfg.label} ({counts[key] || 0})
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">Aucune réservation</div>
        ) : (
          filtered.map(r => {
            const statut = STATUT_CONFIG[r.statut]
            const Icon = statut.icon
            const client = r.clients
            const prestation = r.prestations

            return (
              <div
                key={r.id}
                className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-4 space-y-3"
              >
                {/* En-tête */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statut.color}`}>
                      <Icon className="w-3 h-3" />
                      {statut.label}
                    </div>
                    {prestation && (
                      <span className="text-sm font-medium text-white truncate">
                        {prestation.nom}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-white">{r.montant_total} €</div>
                    <div className="text-xs text-gray-500">
                      Acompte : {r.montant_acompte} € {r.acompte_paye
                        ? <span className="text-green-400">(payé)</span>
                        : <span className="text-yellow-400">(non payé)</span>
                      }
                    </div>
                  </div>
                </div>

                {/* Détails */}
                <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(r.date_rdv + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {r.heure_rdv.slice(0, 5)}
                    {prestation && ` (${prestation.duree_minutes} min)`}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {r.lieu === 'chez_naea' ? 'Chez Naea' : 'À domicile'}
                  </div>
                  {client && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        {client.prenom} {client.nom}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        {client.telephone}
                      </div>
                    </>
                  )}
                </div>

                {r.notes_client && (
                  <p className="text-xs text-gray-500 italic border-t border-[#1a1f2e] pt-2">
                    {r.notes_client}
                  </p>
                )}

                {/* Actions */}
                {r.statut === 'en_attente' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateStatut(r.id, 'confirmee')}
                      disabled={actionLoading === r.id}
                      className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/25 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === r.id ? 'Confirmation...' : 'Confirmer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatut(r.id, 'annulee')}
                      disabled={actionLoading === r.id}
                      className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/25 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  </div>
                )}
                {r.statut === 'confirmee' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateStatut(r.id, 'realisee')}
                      disabled={actionLoading === r.id}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-medium hover:bg-blue-500/25 transition-colors disabled:opacity-50"
                    >
                      Marquer réalisée
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatut(r.id, 'no_show')}
                      disabled={actionLoading === r.id}
                      className="px-3 py-1.5 rounded-lg bg-gray-500/15 text-gray-400 border border-gray-500/30 text-xs font-medium hover:bg-gray-500/25 transition-colors disabled:opacity-50"
                    >
                      No-show
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatut(r.id, 'annulee')}
                      disabled={actionLoading === r.id}
                      className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/25 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
