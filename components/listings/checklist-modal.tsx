'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import type { Listing, ListingChecklist } from '@/types/database'

interface ChecklistModalProps {
  open: boolean
  onClose: () => void
  listing: Listing
  onSaved: () => void
}

const CHECKLIST_ITEMS: { key: keyof ListingChecklist; label: string; desc: string }[] = [
  { key: 'ct_ok', label: 'Contrôle technique', desc: 'CT valide (moins de 6 mois)' },
  { key: 'carnet_ok', label: 'Carnet d\'entretien', desc: 'Carnet complet et à jour' },
  { key: 'histovec_ok', label: 'HistoVec vérifié', desc: 'Historique véhicule OK' },
  { key: 'owners_ok', label: 'Nb propriétaires', desc: 'Nombre de propriétaires vérifié' },
  { key: 'no_sinistres', label: 'Pas de sinistres', desc: 'Aucun sinistre déclaré' },
  { key: 'test_drive', label: 'Essai routier', desc: 'Essai effectué' },
  { key: 'mecanique_ok', label: 'Mécanique OK', desc: 'Vérification mécanique faite' },
  { key: 'carrosserie_ok', label: 'Carrosserie OK', desc: 'Pas de dommages visibles' },
  { key: 'pneus_ok', label: 'Pneus OK', desc: 'Usure acceptable' },
  { key: 'papiers_ok', label: 'Papiers en règle', desc: 'Carte grise et docs conformes' },
  { key: 'no_gage', label: 'Pas de gage', desc: 'Aucun gage ou opposition' },
  { key: 'price_negotiated', label: 'Prix négocié', desc: 'Prix final convenu' },
]

export function ChecklistModal({ open, onClose, listing, onSaved }: ChecklistModalProps) {
  const [loading, setLoading] = useState(false)
  const [existing, setExisting] = useState<ListingChecklist | null>(null)
  const [notes, setNotes] = useState('')
  const [checks, setChecks] = useState<Record<string, boolean>>({
    ct_ok: false, carnet_ok: false, histovec_ok: false, owners_ok: false,
    no_sinistres: false, test_drive: false, mecanique_ok: false, carrosserie_ok: false,
    pneus_ok: false, papiers_ok: false, no_gage: false, price_negotiated: false,
  })

  useEffect(() => {
    async function fetchChecklist() {
      const supabase = createClient()
      const { data } = await supabase
        .from('listing_checklist')
        .select('*')
        .eq('listing_id', listing.id)
        .single()
      if (data) {
        const d = data as ListingChecklist
        setExisting(d)
        setNotes(d.notes ?? '')
        setChecks({
          ct_ok: d.ct_ok, carnet_ok: d.carnet_ok, histovec_ok: d.histovec_ok,
          owners_ok: d.owners_ok, no_sinistres: d.no_sinistres, test_drive: d.test_drive,
          mecanique_ok: d.mecanique_ok, carrosserie_ok: d.carrosserie_ok, pneus_ok: d.pneus_ok,
          papiers_ok: d.papiers_ok, no_gage: d.no_gage, price_negotiated: d.price_negotiated,
        })
      }
    }
    if (open) fetchChecklist()
  }, [open, listing.id])

  const doneCount = Object.values(checks).filter(Boolean).length
  const progress = (doneCount / 12) * 100

  async function handleSave() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        listing_id: listing.id,
        ...checks,
        notes,
      }

      if (existing) {
        await supabase.from('listing_checklist').update(payload).eq('id', existing.id)
      } else {
        await supabase.from('listing_checklist').insert(payload)
      }

      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checklist pré-achat</DialogTitle>
          <p className="text-sm text-gray-400">{listing.brand} {listing.model} {listing.year}</p>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progression</span>
            <span className="font-semibold text-gray-200">{doneCount}/12</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Items */}
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map(item => (
            <label key={item.key} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#1a1f2e] cursor-pointer transition-colors">
              <Checkbox
                checked={checks[item.key] ?? false}
                onCheckedChange={v => setChecks(p => ({ ...p, [item.key]: v as boolean }))}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <p className={`text-sm font-medium ${checks[item.key] ? 'text-green-400 line-through' : 'text-gray-200'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-gray-300 font-medium">Notes</label>
          <Textarea placeholder="Remarques sur le véhicule…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Enregistrement…' : 'Sauvegarder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
