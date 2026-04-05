import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    profileRes,
    clientsRes,
    listingsRes,
    marginsRes,
    resoldRes,
    blogRes,
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
    supabase.from('listing_margins')
      .select('margin')
      .eq('user_id', user.id)
      .gt('margin', 0),
    supabase.from('listings')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'resold'),
    supabase.from('blog_posts')
      .select('id, title, slug, excerpt, content, created_at, category')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(2),
  ])

  const allListings = (listingsRes.data ?? []) as Array<{
    id: string; brand: string; model: string | null; year: number | null; km: number | null
    price: number | null; status: string; fuel: string | null; auto_score: number | null
    manual_score: number | null; created_at: string; client_id: string | null; source: string | null
    clients: { name: string } | null
    listing_margins: Array<{ margin: number | null }> | null
  }>
  const allClients = (clientsRes.data ?? []) as Array<{
    id: string; name: string; budget: number | null; notes: string | null; updated_at: string
  }>
  const positiveMargins = (marginsRes.data ?? []) as Array<{ margin: number }>
  const blogPosts = (blogRes.data ?? []) as Array<{
    id: string; title: string; slug: string; excerpt: string | null
    content: string; created_at: string; category: string | null
  }>
  const resoldCount = (resoldRes.data ?? []).length

  // Count listings per client
  const countPerClient: Record<string, number> = {}
  allListings.forEach(l => {
    if (l.client_id) countPerClient[l.client_id] = (countPerClient[l.client_id] ?? 0) + 1
  })

  // Finance
  const totalPositiveMargin = positiveMargins.reduce((s: number, m: { margin: number }) => s + m.margin, 0)
  const allResoldMargins = allListings
    .filter(l => l.status === 'resold')
    .map(l => (l.listing_margins?.[0]?.margin ?? 0) as number)
  const avgMargin = allResoldMargins.length > 0
    ? allResoldMargins.reduce((s, v) => s + v, 0) / allResoldMargins.length
    : 0

  return (
    <DashboardClient
      firstName={(profileRes.data?.full_name ?? '').split(' ')[0] || null}
      kpis={{
        activeClients: allClients.length,
        totalListings: allListings.length,
        negotiationCount: allListings.filter(l => l.status === 'negotiation').length,
        totalPositiveMargin,
        blogCount: blogPosts.length,
      }}
      recentListings={allListings.slice(0, 5)}
      recentClients={allClients.slice(0, 5).map(c => ({
        ...c,
        listingCount: countPerClient[c.id] ?? 0,
      }))}
      finance={{
        totalMargin: totalPositiveMargin,
        resoldCount,
        avgMargin,
      }}
      blogPosts={blogPosts}
      allClients={allClients.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
    />
  )
}
