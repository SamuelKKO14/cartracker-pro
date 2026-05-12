import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from './plans'
import type { Plan, Subscription } from './plans'

export * from './plans'

// ── Fonctions server-only (requêtes Supabase) ────────────────
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data as Subscription | null
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const sub = await getUserSubscription(userId)
  if (!sub) return 'starter'
  if (sub.status === 'canceled') return 'starter'
  return sub.plan
}

export async function checkListingLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const plan = await getUserPlan(userId)
  const limit = PLAN_LIMITS[plan].maxListings
  if (limit === null) return { allowed: true }

  const supabase = await createClient()
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) >= limit) {
    return { allowed: false, error: `Limite atteinte (${limit} annonces). Passez au plan supérieur.` }
  }
  return { allowed: true }
}

export async function checkClientLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const plan = await getUserPlan(userId)
  const limit = PLAN_LIMITS[plan].maxClients
  if (limit === null) return { allowed: true }

  const supabase = await createClient()
  const { count } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) >= limit) {
    return { allowed: false, error: `Limite atteinte (${limit} clients). Passez au plan supérieur.` }
  }
  return { allowed: true }
}
