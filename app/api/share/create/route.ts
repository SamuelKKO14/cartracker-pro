import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { listing_ids, client_id, title, message } = await request.json()

    if (!listing_ids?.length) {
      return NextResponse.json({ error: 'Aucune annonce sélectionnée' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('client_shares')
      .insert({
        user_id: user.id,
        client_id: client_id || null,
        listing_ids,
        title: title || null,
        message: message || null,
      })
      .select('token')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Erreur serveur' }, { status: 500 })
    }

    const host = request.headers.get('host') ?? 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    return NextResponse.json({
      token: data.token,
      url: `${baseUrl}/share/${data.token}`,
    })
  } catch (err) {
    console.error('share/create error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
