import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return Response.json(
      { error: 'Token manquant' },
      { status: 401, headers: CORS_HEADERS }
    )
  }

  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: 'Token invalide' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, budget, criteria')
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      return Response.json(
        { error: 'Erreur lors de la récupération des clients' },
        { status: 500, headers: CORS_HEADERS }
      )
    }

    return Response.json(
      { clients: clients ?? [] },
      { status: 200, headers: CORS_HEADERS }
    )
  } catch {
    return Response.json(
      { error: 'Erreur serveur' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
