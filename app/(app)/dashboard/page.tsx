import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    profileRes,
    clientsRes,
    listingsRes,
    transactionsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('clients')
      .select('id, name, budget, notes, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase.from('listings')
      .select('id, brand, model, year, km, price, status, fuel, auto_score, manual_score, created_at, client_id, source, clients(name), listing_margins(margin)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('transactions')
      .select('sell_price, margin, sold_at')
      .eq('user_id', user.id),
  ])

  const allListings = (listingsRes.data ?? []) as unknown as Array<{
    id: string; brand: string; model: string | null; year: number | null; km: number | null
    price: number | null; status: string; fuel: string | null; auto_score: number | null
    manual_score: number | null; created_at: string; client_id: string | null; source: string | null
    clients: { name: string } | null
    listing_margins: Array<{ margin: number | null }> | null
  }>
  const allClients = (clientsRes.data ?? []) as unknown as Array<{
    id: string; name: string; budget: number | null; notes: string | null; updated_at: string
  }>
  const allTx = (transactionsRes.data ?? []) as Array<{ sell_price: number | null; margin: number | null; sold_at: string }>

  // Count listings per client
  const countPerClient: Record<string, number> = {}
  allListings.forEach(l => {
    if (l.client_id) countPerClient[l.client_id] = (countPerClient[l.client_id] ?? 0) + 1
  })

  // Finance — all metrics from transactions table
  const resoldCount = allTx.length
  const totalMargin = allTx.reduce((s, t) => s + (t.margin ?? 0), 0)
  const avgMargin = resoldCount > 0 ? totalMargin / resoldCount : 0

  // Month (calendar) metrics
  const monthTx = allTx.filter(t => t.sold_at >= monthStart)
  const monthCA = monthTx.reduce((s, t) => s + (t.sell_price ?? 0), 0)
  const monthMargin = monthTx.reduce((s, t) => s + (t.margin ?? 0), 0)
  const monthAvgMargin = monthTx.length > 0 ? monthMargin / monthTx.length : 0
  const monthSoldCount = monthTx.length

  // 30 days sliding window metrics
  const thirtyTx = allTx.filter(t => t.sold_at >= thirtyDaysAgo)
  const thirtyCA = thirtyTx.reduce((s, t) => s + (t.sell_price ?? 0), 0)
  const thirtyMargin = thirtyTx.reduce((s, t) => s + (t.margin ?? 0), 0)
  const thirtyAvgMargin = thirtyTx.length > 0 ? thirtyMargin / thirtyTx.length : 0
  const thirtySoldCount = thirtyTx.length

  return (
    <DashboardClient
      firstName={(profileRes.data?.full_name ?? '').split(' ')[0] || null}
      kpis={{
        activeClients: allClients.length,
        totalListings: allListings.length,
        negotiationCount: allListings.filter(l => l.status === 'negotiation').length,
        totalPositiveMargin: totalMargin,
        resoldCount,
      }}
      recentListings={allListings.slice(0, 5)}
      recentClients={allClients.slice(0, 5).map(c => ({
        ...c,
        listingCount: countPerClient[c.id] ?? 0,
      }))}
      finance={{
        totalMargin,
        resoldCount,
        avgMargin,
        monthCA,
        monthMargin,
        monthAvgMargin,
        monthSoldCount,
        thirtyCA,
        thirtyMargin,
        thirtyAvgMargin,
        thirtySoldCount,
      }}
      allClients={allClients.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
    />
  )
}
