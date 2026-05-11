'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Prestation } from '@/types/database'
import { Calendar, Clock, MapPin, User, Mail, Phone, FileText, CheckCircle, AlertCircle } from 'lucide-react'

type BookingResult = {
  success: boolean
  reservation_id: string
  prestation_nom: string
  montant_total: number
  montant_acompte: number
}

export function BookingForm() {
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<BookingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Anti double-submit : useRef en plus du useState
  const submittingRef = useRef(false)

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    prestation_id: '',
    date_rdv: '',
    heure_rdv: '',
    lieu: 'chez_naea',
    notes_client: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('prestations')
      .select('*')
      .eq('actif', true)
      .order('ordre')
      .then(({ data }) => {
        setPrestations((data as Prestation[]) ?? [])
        setLoading(false)
      })
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = useCallback(async () => {
    // Double protection : useRef bloque avant même le setState
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la réservation')
        return
      }

      setResult(data)
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }, [form])

  if (result) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/8 p-10 flex flex-col items-center justify-center gap-4 text-center">
        <CheckCircle className="w-12 h-12 text-green-400" />
        <h2 className="text-xl font-semibold text-white">Réservation envoyée !</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Votre demande pour <strong className="text-white">{result.prestation_nom}</strong> a été enregistrée.
          Vous recevrez une confirmation par email.
        </p>
        <div className="mt-2 text-sm text-gray-500">
          <p>Montant total : <span className="text-white">{result.montant_total} €</span></p>
          <p>Acompte à régler : <span className="text-orange-400">{result.montant_acompte} €</span></p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  // Générer les créneaux horaires (9h-19h, toutes les 30 min)
  const timeSlots: string[] = []
  for (let h = 9; h < 19; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`)
    timeSlots.push(`${String(h).padStart(2, '0')}:30`)
  }

  // Date min : demain
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // Date max : 2 mois
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 2)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const isFormValid =
    form.prenom && form.nom && form.email && form.telephone &&
    form.prestation_id && form.date_rdv && form.heure_rdv && form.lieu

  return (
    <div className="rounded-xl border border-[#1a1f2e] bg-[#0d1117] p-6 space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Infos personnelles */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <User className="w-3 h-3" /> Prénom *
          </label>
          <input
            name="prenom"
            value={form.prenom}
            onChange={handleChange}
            required
            placeholder="Marie"
            className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <User className="w-3 h-3" /> Nom *
          </label>
          <input
            name="nom"
            value={form.nom}
            onChange={handleChange}
            required
            placeholder="Dupont"
            className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Mail className="w-3 h-3" /> Email *
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="marie@exemple.fr"
            className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Phone className="w-3 h-3" /> Téléphone *
          </label>
          <input
            name="telephone"
            type="tel"
            value={form.telephone}
            onChange={handleChange}
            required
            placeholder="06 12 34 56 78"
            className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Prestation */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Prestation *</label>
        <select
          name="prestation_id"
          value={form.prestation_id}
          onChange={handleChange}
          required
          className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white focus:outline-none focus:border-orange-500/60 transition-colors"
        >
          <option value="">Choisissez une prestation</option>
          {prestations.map(p => (
            <option key={p.id} value={p.id}>
              {p.nom} — {p.prix} € ({p.duree_minutes} min)
            </option>
          ))}
        </select>
      </div>

      {/* Date, heure, lieu */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Date *
          </label>
          <input
            name="date_rdv"
            type="date"
            value={form.date_rdv}
            onChange={handleChange}
            min={minDate}
            max={maxDateStr}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white focus:outline-none focus:border-orange-500/60 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Heure *
          </label>
          <select
            name="heure_rdv"
            value={form.heure_rdv}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white focus:outline-none focus:border-orange-500/60 transition-colors"
          >
            <option value="">Choisissez</option>
            {timeSlots.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Lieu *
          </label>
          <select
            name="lieu"
            value={form.lieu}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white focus:outline-none focus:border-orange-500/60 transition-colors"
          >
            <option value="chez_naea">Chez Naea</option>
            <option value="domicile">À domicile</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
          <FileText className="w-3 h-3" /> Notes (optionnel)
        </label>
        <textarea
          name="notes_client"
          value={form.notes_client}
          onChange={handleChange}
          rows={3}
          placeholder="Informations complémentaires, allergies..."
          className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors resize-none"
        />
      </div>

      {/* Bouton — type="button" pour éviter double submit via form, disabled immédiatement */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !isFormValid}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-all hover:scale-[1.01] shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Envoi en cours...
          </>
        ) : (
          'Réserver mon créneau'
        )}
      </button>
    </div>
  )
}
