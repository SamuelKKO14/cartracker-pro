import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReservationsClient } from './reservations-client'
import type { ReservationWithDetails } from '@/types/database'

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Chargement initial côté serveur
  // Cast nécessaire : le typed client utilise le schema cartracker-pro,
  // mais la DB réelle est naea-beauty avec des colonnes différentes sur clients
  const { data: reservations } = await (supabase as any)
    .from('reservations')
    .select('*, prestations(id, nom, prix, duree_minutes, categorie), clients(id, prenom, nom, email, telephone)')
    .order('date_rdv', { ascending: false })
    .order('heure_rdv', { ascending: false })
    .limit(100)

  return <ReservationsClient initialData={(reservations ?? []) as ReservationWithDetails[]} />
}
