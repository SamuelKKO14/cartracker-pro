import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callAnthropicForUser(): Promise<Anthropic.Message> {
  const updatedAt = new Date().toISOString()
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      return await anthropic.messages.create({
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
  "updated_at": "${updatedAt}"
}
top_models : 5 modèles. price_drops : 3 modèles. best_countries : 3 pays. hot_segments : 3 segments.`,
        }],
      })
    } catch (err: unknown) {
      const isOverloaded = err instanceof Error && (
        err.message.includes('529') || err.message.toLowerCase().includes('overloaded')
      )
      if (isOverloaded && attempt === 0) {
        await sleep(5000)
        continue
      }
      throw err
    }
  }
  throw new Error('Unreachable')
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service-role client to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all distinct user_ids from market_trends
  const { data: rows, error } = await supabase
    .from('market_trends')
    .select('user_id')

  if (error) {
    console.error('trends cron: fetch users error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = [...new Set((rows ?? []).map((r: { user_id: string }) => r.user_id))]
  const results: { user_id: string; status: string }[] = []

  for (const userId of userIds) {
    try {
      const message = await callAnthropicForUser()

      let rawText = ''
      for (const block of message.content) {
        if (block.type === 'text') rawText += block.text
      }
      rawText = rawText.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        results.push({ user_id: userId, status: 'error: no JSON in response' })
        await sleep(2000)
        continue
      }

      const trends = JSON.parse(jsonMatch[0])
      await supabase
        .from('market_trends')
        .upsert(
          { user_id: userId, trends_data: trends, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )

      results.push({ user_id: userId, status: 'ok' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      results.push({ user_id: userId, status: `error: ${msg}` })
    }

    // Pause between users to avoid rate limiting
    await sleep(2000)
  }

  return NextResponse.json({ updated: results.length, results })
}
