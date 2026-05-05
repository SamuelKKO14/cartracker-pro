import { createClient } from '@/lib/supabase/server'

export type Plan = 'starter' | 'pro' | 'agence'
export type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

export interface Subscription {
  id: string
  user_id: string
  plan: Plan
  status: SubStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_end: string | null
  created_at: string
}

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
  if (plan !== 'starter') return { allowed: true }

  const supabase = await createClient()
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) >= 10) {
    return { allowed: false, error: 'Limite atteinte (10 annonces). Passez au plan Pro.' }
  }
  return { allowed: true }
}

export async function checkClientLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const plan = await getUserPlan(userId)
  if (plan !== 'starter') return { allowed: true }

  const supabase = await createClient()
  const { count } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) >= 5) {
    return { allowed: false, error: 'Limite atteinte (5 clients). Passez au plan Pro.' }
  }
  return { allowed: true }
}
