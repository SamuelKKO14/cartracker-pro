import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  if (!rateLimit(user.id + ':trends', 5, 60_000)) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez dans une minute' }, { status: 429 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: "Tu es un expert du marché automobile européen. Tu analyses les tendances actuelles du marché de l'occasion en Europe pour aider des professionnels mandataires français.",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
      messages: [{
        role: 'user',
        content: `Fais une veille marché du moment sur les voitures d'occasion en Europe. Recherche sur AutoScout24, La Centrale, LeBonCoin, mobile.de les tendances actuelles. Retourne UNIQUEMENT un JSON valide (aucun texte avant ou après) avec cette structure exacte :
{
  "top_models": [{ "rank": 1, "brand": "BMW", "model": "320d", "reason": "Forte demande, prix en baisse en Allemagne", "trend": "up" }],
  "price_drops": [{ "brand": "Audi", "model": "A4", "drop_percent": 8, "country": "DE", "note": "Surstock chez les pros" }],
  "best_countries": [{ "country": "DE", "country_name": "Allemagne", "advantage": "15% moins cher qu'en France en moyenne", "best_segment": "Berlines premium" }],
  "hot_segments": [{ "segment": "SUV hybride", "note": "Demande en hausse +23% ce mois", "trend": "up" }],
  "updated_at": "${new Date().toISOString()}"
}
top_models : 5 modèles. price_drops : 3 modèles. best_countries : 3 pays. hot_segments : 3 segments.`,
      }],
    })

    // Extraire tous les blocs text de la réponse (web search inclus)
    let rawText = ''
    for (const block of message.content) {
      if (block.type === 'text') rawText += block.text
    }

    // Strip éventuels backticks markdown
    rawText = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Réponse inattendue de l\'IA' }, { status: 500 })
    }

    const trends = JSON.parse(jsonMatch[0])

    // Upsert dans market_trends
    await supabase
      .from('market_trends')
      .upsert(
        { user_id: user.id, trends_data: trends, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    return NextResponse.json(trends)
  } catch (err: unknown) {
    console.error('trends error:', err)
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
