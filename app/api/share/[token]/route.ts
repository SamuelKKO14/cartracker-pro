import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ClientShare } from '@/types/database'

type Params = { params: Promise<{ token: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const supabase = await createClient()

    const { data: rawShare } = await supabase
      .from('client_shares')
      .select('*')
      .eq('token', token)
      .single()

    if (!rawShare) {
      return NextResponse.json({ error: 'Lien introuvable ou expiré' }, { status: 404 })
    }
    const share = rawShare as ClientShare

    // Increment views (fire-and-forget)
    supabase
      .from('client_shares')
      .update({ views: share.views + 1 })
      .eq('id', share.id)
      .then(() => {})

    // Fetch listings (restricted fields only — no url, source, notes, scores, margin)
    const { data: listings } = await supabase
      .from('listings')
      .select('id, brand, model, year, km, price, fuel, gearbox, country, body, listing_photos(*)')
      .in('id', share.listing_ids)

    // Fetch existing responses
    const { data: responses } = await supabase
      .from('client_share_responses')
      .select('listing_id, reaction, comment')
      .eq('share_id', share.id)

    // Order listings to match listing_ids order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listingsArr = (listings as any[]) ?? []
    const ordered = share.listing_ids
      .map((id: string) => listingsArr.find((l: { id: string }) => l.id === id))
      .filter(Boolean)

    return NextResponse.json({
      share: {
        title: share.title,
        message: share.message,
      },
      listings: ordered,
      responses: responses ?? [],
    })
  } catch (err) {
    console.error('share/[token] GET error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const { listing_id, reaction, comment } = await request.json()

    if (!listing_id || !reaction) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: rawShare2 } = await supabase
      .from('client_shares')
      .select('id')
      .eq('token', token)
      .single()

    if (!rawShare2) {
      return NextResponse.json({ error: 'Lien introuvable' }, { status: 404 })
    }
    const shareId = (rawShare2 as { id: string }).id

    const { error } = await supabase
      .from('client_share_responses')
      .upsert(
        { share_id: shareId, listing_id, reaction, comment: comment || null },
        { onConflict: 'share_id,listing_id' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('share/[token] POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
