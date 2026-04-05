import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed, onboarding_progress')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    completed: data?.onboarding_completed ?? false,
    progress: (data?.onboarding_progress as string[]) ?? [],
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { step_id } = await request.json()
  if (!step_id || typeof step_id !== 'string') {
    return NextResponse.json({ error: 'step_id requis' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_progress')
    .eq('id', user.id)
    .single()

  const current = (profile?.onboarding_progress as string[] | null) ?? []
  if (current.includes(step_id)) {
    return NextResponse.json({ progress: current })
  }

  const updated = [...current, step_id]
  await supabase
    .from('profiles')
    .update({ onboarding_progress: updated })
    .eq('id', user.id)

  return NextResponse.json({ progress: updated })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { completed } = await request.json()
  if (completed !== true) {
    return NextResponse.json({ error: 'completed: true requis' }, { status: 400 })
  }

  await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
