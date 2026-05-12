export type Plan = 'starter' | 'demarrage' | 'pro' | 'agence'
export type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

// ── Stripe Price IDs (live) ───────────────────────────────────
export const STRIPE_PRICE_DEMARRAGE = 'price_1TWNclBBs4JvHKkZyjMQOhFZ'
export const STRIPE_PRICE_PRO = 'price_1TWNdOBBs4JvHKkZYhTMXswG'
export const STRIPE_PRICE_AGENCE = 'price_1TWNdVBBs4JvHKkZABhUZO8J'

export function priceIdToPlan(priceId: string): Plan {
  switch (priceId) {
    case STRIPE_PRICE_DEMARRAGE: return 'demarrage'
    case STRIPE_PRICE_PRO: return 'pro'
    case STRIPE_PRICE_AGENCE: return 'agence'
    default: return 'starter'
  }
}

// ── Limites par plan ──────────────────────────────────────────
export interface PlanLimits {
  maxClients: number | null
  maxListings: number | null
  aiTextMonthly: number | null
  aiPhotoMonthly: number | null
  trendsAccess: boolean
  allowedCountries: string[] | null
  kanbanAccess: boolean
  tagsAccess: boolean
  goalsAccess: boolean
  projectionAccess: boolean
  financeHistory: string[]
  advancedStatsAccess: boolean
  csvExportAccess: boolean
  maxUsers: number
  supportLevel: 'standard' | 'priority' | 'priority_4h'
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  starter: {
    maxClients: 5, maxListings: 10,
    aiTextMonthly: 3, aiPhotoMonthly: 1,
    trendsAccess: false,
    allowedCountries: ['FR'],
    kanbanAccess: false, tagsAccess: false,
    goalsAccess: false, projectionAccess: false,
    financeHistory: ['month'],
    advancedStatsAccess: false, csvExportAccess: false,
    maxUsers: 1, supportLevel: 'standard',
  },
  demarrage: {
    maxClients: 15, maxListings: 30,
    aiTextMonthly: 10, aiPhotoMonthly: 3,
    trendsAccess: false,
    allowedCountries: ['FR', 'DE', 'BE', 'ES'],
    kanbanAccess: false, tagsAccess: false,
    goalsAccess: false, projectionAccess: false,
    financeHistory: ['month', 'quarter'],
    advancedStatsAccess: false, csvExportAccess: false,
    maxUsers: 1, supportLevel: 'standard',
  },
  pro: {
    maxClients: 250, maxListings: 500,
    aiTextMonthly: null, aiPhotoMonthly: null,
    trendsAccess: true,
    allowedCountries: null,
    kanbanAccess: true, tagsAccess: true,
    goalsAccess: true, projectionAccess: true,
    financeHistory: ['month', 'quarter', 'year', 'all'],
    advancedStatsAccess: true, csvExportAccess: true,
    maxUsers: 1, supportLevel: 'priority',
  },
  agence: {
    maxClients: null, maxListings: null,
    aiTextMonthly: null, aiPhotoMonthly: null,
    trendsAccess: true,
    allowedCountries: null,
    kanbanAccess: true, tagsAccess: true,
    goalsAccess: true, projectionAccess: true,
    financeHistory: ['month', 'quarter', 'year', 'all'],
    advancedStatsAccess: true, csvExportAccess: true,
    maxUsers: 3, supportLevel: 'priority_4h',
  },
}

// ── Subscription (type, pas de requête DB) ────────────────────
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

// ── Checks purs (plan en paramètre, pas de Supabase) ─────────
export function checkAITextLimit(plan: Plan): { limit: number | null } {
  return { limit: PLAN_LIMITS[plan].aiTextMonthly }
}

export function checkAIPhotoLimit(plan: Plan): { limit: number | null } {
  return { limit: PLAN_LIMITS[plan].aiPhotoMonthly }
}

export function checkTrendsAccess(plan: Plan): boolean {
  return PLAN_LIMITS[plan].trendsAccess
}

export function checkCountryAccess(plan: Plan, country: string): boolean {
  const allowed = PLAN_LIMITS[plan].allowedCountries
  return allowed === null || allowed.includes(country)
}

export function checkKanbanAccess(plan: Plan): boolean {
  return PLAN_LIMITS[plan].kanbanAccess
}

export function checkTagsAccess(plan: Plan): boolean {
  return PLAN_LIMITS[plan].tagsAccess
}

export function checkGoalsAccess(plan: Plan): boolean {
  return PLAN_LIMITS[plan].goalsAccess
}

export function checkProjectionAccess(plan: Plan): boolean {
  return PLAN_LIMITS[plan].projectionAccess
}

export function checkAdvancedStatsAccess(plan: Plan): boolean {
  return PLAN_LIMITS[plan].advancedStatsAccess
}

export function checkExportAccess(plan: Plan): boolean {
  return PLAN_LIMITS[plan].csvExportAccess
}

export function getMaxUsers(plan: Plan): number {
  return PLAN_LIMITS[plan].maxUsers
}

export function getSupportLevel(plan: Plan): string {
  return PLAN_LIMITS[plan].supportLevel
}
