import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { calculateAutoScore } from '@/lib/utils'

function normalizeListingData(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data }

  // FUEL
  const fuelMap: Record<string, string> = {
    diesel: 'Diesel',
    essence: 'Essence',
    hybride: 'Hybride',
    electrique: 'Électrique',
    électrique: 'Électrique',
    gpl: 'GPL',
    gaz: 'Gaz',
    gnv: 'Gaz',
    hydrogene: 'Hydrogène',
    hydrogène: 'Hydrogène',
  }
  if (typeof result.fuel === 'string') {
    result.fuel = fuelMap[result.fuel.toLowerCase()] ?? result.fuel
  }

  // GEARBOX
  const gearboxAuto = ['automatique', 'auto', 'bva', 'dsg', 'eat', 'edc']
  const gearboxManual = ['manuelle', 'manuel', 'bvm', 'mécanique', 'mecanique']
  if (typeof result.gearbox === 'string') {
    const g = result.gearbox.toLowerCase()
    if (gearboxAuto.some(v => g.startsWith(v))) result.gearbox = 'Automatique'
    else if (gearboxManual.includes(g)) result.gearbox = 'Manuelle'
  }

  // BODY
  const bodyMap: Record<string, string> = {
    berline: 'Berline', sedan: 'Berline',
    suv: 'SUV/4x4', '4x4': 'SUV/4x4', crossover: 'SUV/4x4',
    break: 'Break', estate: 'Break', touring: 'Break',
    coupe: 'Coupé', coupé: 'Coupé',
    cabriolet: 'Cabriolet', cabrio: 'Cabriolet', convertible: 'Cabriolet',
    citadine: 'Citadine', compact: 'Citadine', hatchback: 'Citadine',
    monospace: 'Monospace', mpv: 'Monospace', minivan: 'Monospace',
    utilitaire: 'Utilitaire', van: 'Utilitaire', fourgon: 'Utilitaire',
    pickup: 'Pick-up', 'pick-up': 'Pick-up',
  }
  if (typeof result.body === 'string') {
    result.body = bodyMap[result.body.toLowerCase()] ?? result.body
  }

  // SELLER
  const sellerPro = ['professionnel', 'pro', 'concessionnaire', 'garage', 'mandataire']
  if (typeof result.seller === 'string') {
    const s = result.seller.toLowerCase()
    if (sellerPro.includes(s)) result.seller = 'professionnel'
    else if (s === 'particulier') result.seller = 'particulier'
  }

  // SOURCE
  const sourceMap: Record<string, string> = {
    autoscout24: 'AutoScout24',
    leboncoin: 'LeBonCoin',
    lacentrale: 'La Centrale',
    'mobile.de': 'mobile.de',
    leparking: 'Le Parking',
    autohero: 'AutoHero',
    'occasion.fr': 'Occasion.fr',
    ai: 'Import IA',
    generic: 'Autre',
  }
  if (typeof result.source === 'string') {
    result.source = sourceMap[result.source.toLowerCase()] ?? result.source
  }

  // COUNTRY
  if (typeof result.country === 'string') {
    result.country = result.country.toUpperCase()
  }

  return result
}

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

    const rawBody = await request.json()
    const norm = normalizeListingData(rawBody)
    const brand = norm.brand as string | undefined
    const model = norm.model as string | undefined
    const generation = norm.generation as string | undefined
    const year = norm.year as number | undefined
    const km = norm.km as number | undefined
    const price = norm.price as number | undefined
    const fuel = norm.fuel as string | undefined
    const gearbox = norm.gearbox as string | undefined
    const bodyType = norm.body as string | undefined
    const country = norm.country as string | undefined
    const seller = norm.seller as string | undefined
    const first_owner = norm.first_owner as boolean | undefined
    const url = norm.url as string | undefined
    const source = norm.source as string | undefined
    const description = norm.description as string | undefined
    const photos = norm.photos as string[] | undefined
    const client_id = norm.client_id as string | undefined

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
