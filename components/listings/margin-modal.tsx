'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'
import type { Listing, ListingMargin } from '@/types/database'

interface MarginModalProps {
  open: boolean
  onClose: () => void
  listing: Listing
  onSaved: () => void
}

export function MarginModal({ open, onClose, listing, onSaved }: MarginModalProps) {
  const [loading, setLoading] = useState(false)
  const [existingMargin, setExistingMargin] = useState<ListingMargin | null>(null)
  const [form, setForm] = useState({
    buy_price: listing.price?.toString() ?? '',
    transport: '0',
    repair: '0',
    ct_cost: '80',
    registration: '300',
    other_costs: '0',
    sell_price: '',
  })

  useEffect(() => {
    async function fetchMargin() {
      const supabase = createClient()
      const { data } = await supabase
        .from('listing_margins')
        .select('*')
        .eq('listing_id', listing.id)
        .single()
      if (data) {
        const d = data as ListingMargin
        setExistingMargin(d)
        setForm({
          buy_price: d.buy_price?.toString() ?? '',
          transport: d.transport?.toString() ?? '0',
          repair: d.repair?.toString() ?? '0',
          ct_cost: d.ct_cost?.toString() ?? '80',
          registration: d.registration?.toString() ?? '300',
          other_costs: d.other_costs?.toString() ?? '0',
          sell_price: d.sell_price?.toString() ?? '',
        })
      }
    }
    if (open) fetchMargin()
  }, [open, listing.id])

  const buyPrice = parseInt(form.buy_price) || 0
  const transport = parseInt(form.transport) || 0
  const repair = parseInt(form.repair) || 0
  const ctCost = parseInt(form.ct_cost) || 0
  const registration = parseInt(form.registration) || 0
  const otherCosts = parseInt(form.other_costs) || 0
  const sellPrice = parseInt(form.sell_price) || 0

  const totalCost = buyPrice + transport + repair + ctCost + registration + otherCosts
  const margin = sellPrice > 0 ? sellPrice - totalCost : null
  const marginPct = margin !== null && totalCost > 0 ? ((margin / totalCost) * 100).toFixed(1) : null

  async function handleSave() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        listing_id: listing.id,
        buy_price: buyPrice,
        transport,
        repair,
        ct_cost: ctCost,
        registration,
        other_costs: otherCosts,
        sell_price: sellPrice || null,
        margin: margin ?? null,
      }

      let error
      if (existingMargin) {
        const res = await supabase.from('listing_margins').update(payload).eq('id', existingMargin.id)
        error = res.error
      } else {
        const res = await supabase.from('listing_margins').insert(payload)
        error = res.error
      }

      if (error) {
        console.error('Erreur sauvegarde marge:', error)
        alert('Erreur lors de la sauvegarde : ' + error.message)
        return
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
          <DialogTitle>Calculateur de marge</DialogTitle>
          <p className="text-sm text-gray-400">{listing.brand} {listing.model} {listing.year}</p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Prix d'achat (€)</Label>
              <Input type="number" value={form.buy_price} onChange={e => setForm(p => ({ ...p, buy_price: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Transport (€)</Label>
              <Input type="number" value={form.transport} onChange={e => setForm(p => ({ ...p, transport: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Remise en état (€)</Label>
              <Input type="number" value={form.repair} onChange={e => setForm(p => ({ ...p, repair: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contrôle technique (€)</Label>
              <Input type="number" value={form.ct_cost} onChange={e => setForm(p => ({ ...p, ct_cost: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Immatriculation (€)</Label>
              <Input type="number" value={form.registration} onChange={e => setForm(p => ({ ...p, registration: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Autres frais (€)</Label>
              <Input type="number" value={form.other_costs} onChange={e => setForm(p => ({ ...p, other_costs: e.target.value }))} />
            </div>
          </div>

          {/* Coût total */}
          <div className="p-3 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e]">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Coût total</span>
              <span className="font-semibold text-gray-200">{formatPrice(totalCost)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Prix de revente cible (€)</Label>
            <Input type="number" value={form.sell_price} onChange={e => setForm(p => ({ ...p, sell_price: e.target.value }))} placeholder="Ex: 18000" />
          </div>

          {/* Marge */}
          {margin !== null ? (
          <div className={`p-4 rounded-xl border text-center ${margin >= 0 ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
            <p className="text-xs text-gray-400 mb-1">Marge nette</p>
            <p className={`text-3xl font-bold ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPrice(margin)}
            </p>
            <p className={`text-sm mt-1 ${margin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {margin >= 0 ? '+' : ''}{marginPct}%
            </p>
          </div>
          ) : (
          <div className="p-4 rounded-xl border border-[#2a2f3e] bg-[#0a0d14] text-center">
            <p className="text-xs text-gray-500">Entre un prix de revente cible pour voir ta marge</p>
          </div>
          )}
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
