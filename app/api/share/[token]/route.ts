import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ClientShare } from '@/types/database'

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Params = { params: Promise<{ token: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const supabase = supabasePublic

    const { data: rawShare } = await supabase
      .from('client_shares')
      .select('*')
      .eq('token', token)
      .single()

    if (!rawShare) {
      return NextResponse.json({ error: 'Lien introuvable ou expiré' }, { status: 404 })
    }
    const share = rawShare as ClientShare

    supabase.from('client_shares').update({ views: (share.views ?? 0) + 1 }).eq('id', share.id).then(() => {})

    const { data: listings } = await supabase
      .from('listings')
      .select('id, brand, model, year, km, price, fuel, gearbox, country, body, listing_photos(*)')
      .in('id', share.listing_ids)

    const { data: responses } = await supabase
      .from('client_share_responses')
      .select('listing_id, reaction, comment')
      .eq('share_id', share.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listingsArr = (listings as any[]) ?? []
    const ordered = share.listing_ids
      .map((id: string) => listingsArr.find((l: { id: string }) => l.id === id))
      .filter(Boolean)

    return NextResponse.json({ share: { title: share.title, message: share.message }, listings: ordered, responses: responses ?? [] })
  } catch (err) {
    console.error('share GET error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const { listing_id, reaction, comment } = await request.json()
    if (!listing_id || !reaction) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

    const supabase = supabasePublic
    const { data: rawShare } = await supabase.from('client_shares').select('id').eq('token', token).single()
    if (!rawShare) return NextResponse.json({ error: 'Lien introuvable' }, { status: 404 })

    const { error } = await supabase.from('client_share_responses').upsert(
      { share_id: (rawShare as { id: string }).id, listing_id, reaction, comment: comment || null },
      { onConflict: 'share_id,listing_id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('share POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
