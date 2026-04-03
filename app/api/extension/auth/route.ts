import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  console.log('[Extension Auth] POST received from', request.headers.get('origin') || 'unknown origin')
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('[Extension Auth] email:', email, '— password length:', password?.length ?? 0)

    if (!email || !password) {
      console.log('[Extension Auth] missing fields')
      return Response.json(
        { error: 'Email et mot de passe requis' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      console.log('[Extension Auth] Supabase auth failed:', error?.message ?? 'no session')
      return Response.json(
        { error: 'Identifiants invalides' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    console.log('[Extension Auth] success for user:', data.user.email)
    return Response.json(
      {
        token: data.session.access_token,
        user_id: data.user.id,
        user_email: data.user.email,
      },
      { status: 200, headers: CORS_HEADERS }
    )
  } catch (e) {
    console.error('[Extension Auth] caught error:', e)
    return Response.json(
      { error: 'Erreur serveur' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
