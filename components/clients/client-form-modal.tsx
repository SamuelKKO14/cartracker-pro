'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Client } from '@/types/database'

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  client?: Client | null
}

export function ClientFormModal({ open, onClose, onSaved, client }: ClientFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    budget: client?.budget?.toString() ?? '',
    criteria: client?.criteria ?? '',
    notes: client?.notes ?? '',
    billing_type: client?.billing_type ?? 'search',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        budget: form.budget ? parseInt(form.budget) : null,
        criteria: form.criteria || null,
        notes: form.notes || null,
        billing_type: form.billing_type,
        updated_at: new Date().toISOString(),
      }

      if (client) {
        await supabase.from('clients').update(payload).eq('id', client.id)
      } else {
        await supabase.from('clients').insert(payload)
      }

      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input placeholder="Jean Dupont" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input placeholder="06 12 34 56 78" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="jean@exemple.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Budget (€)</Label>
              <Input type="number" placeholder="20000" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Type de facturation</Label>
              <Select value={form.billing_type} onValueChange={v => setForm(p => ({ ...p, billing_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="search">Par recherche</SelectItem>
                  <SelectItem value="monthly">Forfait mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Critères de recherche</Label>
            <Textarea
              placeholder="SUV diesel automatique, 2019+, max 100 000 km, budget 25 000€…"
              value={form.criteria}
              onChange={e => setForm(p => ({ ...p, criteria: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              placeholder="Informations complémentaires…"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading || !form.name}>
              {loading ? 'Enregistrement…' : client ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
