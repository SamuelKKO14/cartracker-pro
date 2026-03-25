import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [allListingsRes, negotiationRes, marginsRes] = await Promise.all([
    supabase.from('listings').select('id, status, created_at, client_id').eq('user_id', user.id),
    supabase.from('listings')
      .select('id, brand, model, year, price, client_id, status, clients(id, name), listing_margins(margin)')
      .eq('user_id', user.id)
      .eq('status', 'negotiation'),
    supabase.from('listing_margins').select('margin').eq('user_id', user.id),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = (allListingsRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const negotiationListings = (negotiationRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const margins = (marginsRes.data ?? []) as any[]

  const totalListings = listings.length
  const todayListings = listings.filter(l => new Date(l.created_at) >= today).length
  const negotiationCount = listings.filter(l => l.status === 'negotiation').length
  const totalMargin = margins.reduce((sum: number, m: { margin?: number }) => sum + (m.margin ?? 0), 0)

  // Clients with listing counts
  const { data: clientsRaw } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .limit(10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientsData = (clientsRaw ?? []) as any[]
  const countPerClient: Record<string, number> = {}
  listings.forEach(l => {
    if (l.client_id) countPerClient[l.client_id] = (countPerClient[l.client_id] ?? 0) + 1
  })

  const activeClients = clientsData.map(c => ({
    ...c,
    listings: [{ count: countPerClient[c.id] ?? 0 }],
  }))

  const kpis = {
    activeClients: clientsData.length,
    totalListings,
    todayListings,
    negotiationCount,
    totalMargin,
  }

  return (
    <DashboardClient
      kpis={kpis}
      negotiationListings={negotiationListings}
      activeClients={activeClients}
    />
  )
}
