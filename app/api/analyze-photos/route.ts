import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    if (!rateLimit(user.id + ':analyze-photos', 10, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes, réessayez dans une minute' }, { status: 429 })
    }

    const { images } = await request.json()
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 })
    }
    if (images.length > 30) {
      return NextResponse.json({ error: 'Maximum 30 images autorisées' }, { status: 400 })
    }

    // Build multi-image content blocks — send only first 5 to Claude to avoid large payloads
    type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    const content: Anthropic.MessageParam['content'] = []

    for (const dataUrl of images.slice(0, 5)) {
      if (typeof dataUrl !== 'string') continue
      const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/)
      if (!match) continue
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: match[1] as ImageMediaType,
          data: match[2],
        },
      })
    }

    if (content.length === 0) {
      return NextResponse.json({ error: 'Aucune image valide fournie' }, { status: 400 })
    }

    content.push({
      type: 'text',
      text: "Analyse ces photos et extrais toutes les caractéristiques du véhicule.",
    })

    const message = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: `Tu es un expert automobile. Analyse ces photos d'annonce automobile et extrais TOUTES les informations visibles. Retourne UNIQUEMENT un objet JSON valide, sans texte autour, avec ces champs exactement :
{
  "brand": string | null,
  "model": string | null,
  "year": number | null,
  "km": number | null,
  "price": number | null,
  "fuel": "Diesel" | "Essence" | "Hybride" | "Électrique" | "GPL" | null,
  "gearbox": "Manuelle" | "Automatique" | null,
  "body": "Berline" | "SUV/4x4" | "Break" | "Coupé" | "Cabriolet" | "Citadine" | "Utilitaire" | "Monospace" | null,
  "country": string | null,
  "seller": "particulier" | "professionnel" | null,
  "horsepower": number | null,
  "color": string | null,
  "notes": string | null
}
Règles :
- country : code ISO 2 lettres (FR, DE, BE, NL, ES, IT, PL, PT, RO, AT, CH, SE, NO, LT, CZ, HU…)
- km, price, horsepower : entiers sans unité ni séparateurs
- Si une information n'est pas visible sur les photos, mets null
- Pour le prix, mets le nombre entier en euros sans symbole ni espace
- notes : équipements, options, état visible, historique mentionné (concis)`,
      messages: [{ role: 'user', content }],
    })

    const textContent = message.content[0]
    if (textContent.type !== 'text') {
      return NextResponse.json({ error: 'Réponse inattendue de l\'IA' }, { status: 500 })
    }

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(textContent.text)
    } catch {
      const match = textContent.text.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: 'Impossible de parser la réponse de l\'IA' }, { status: 500 })
      }
      extracted = JSON.parse(match[0])
    }

    return NextResponse.json({ data: extracted })
  } catch (err) {
    console.error('analyze-photos error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
