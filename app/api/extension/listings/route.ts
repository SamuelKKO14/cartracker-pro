import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { calculateAutoScore } from '@/lib/utils'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      brand, model, generation, year, km, price, fuel, gearbox, body: bodyType,
      country, seller, first_owner, url, source, description, photos, client_id,
    } = body

    if (!brand) {
      return Response.json(
        { error: 'La marque est requise' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const auto_score = calculateAutoScore({ year, km, price, seller, first_owner })

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        brand,
        model: model ?? null,
        generation: generation ?? null,
        year: year ?? null,
        km: km ?? null,
        price: price ?? null,
        fuel: fuel ?? null,
        gearbox: gearbox ?? null,
        body: bodyType ?? null,
        country: country ?? null,
        seller: seller ?? null,
        first_owner: first_owner ?? false,
        url: url ?? null,
        source: source ?? null,
        notes: description ?? null,
        client_id: client_id ?? null,
        auto_score,
        status: 'new',
      })
      .select('id')
      .single()

    if (insertError || !listing) {
      return Response.json(
        { error: "Erreur lors de l'insertion de l'annonce" },
        { status: 500, headers: CORS_HEADERS }
      )
    }

    // Insert photos if provided
    if (Array.isArray(photos) && photos.length > 0) {
      const photoRows = photos.map((photoUrl: string, index: number) => ({
        user_id: user.id,
        listing_id: listing.id,
        url: photoUrl,
        position: index,
      }))
      await supabase.from('listing_photos').insert(photoRows)
    }

    return Response.json(
      { listing_id: listing.id, success: true },
      { status: 201, headers: CORS_HEADERS }
    )
  } catch {
    return Response.json(
      { error: 'Erreur serveur' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
