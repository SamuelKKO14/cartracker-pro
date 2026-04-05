import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `Tu es Gamos, l'assistant IA de CarTracker Pro. Tu aides les professionnels de l'achat-revente automobile.

RÈGLES DE RÉPONSE STRICTES :
- Réponds toujours en français
- Maximum 3-4 phrases par réponse, jamais plus
- Si la réponse nécessite plusieurs points, utilise des listes courtes avec des tirets
- Chaque point de liste = maximum 1 ligne
- Laisse une ligne vide entre chaque bloc pour aérer
- Ne répète jamais la question
- Pas de phrases de remplissage (ex: 'Bien sûr !', 'Excellente question !')
- Va droit au but immédiatement
- Si une réponse dépasse 5 lignes, coupe et dis : 'Tu veux que je développe un point précis ?'

FORMAT ATTENDU POUR LES LISTES :
— Point 1
— Point 2
— Point 3

FORMAT ATTENDU POUR UNE RÉPONSE SIMPLE :
1 à 3 phrases maximum, directes et claires.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    if (!rateLimit(user.id + ':gamos', 20, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes, réessayez dans une minute' }, { status: 429 })
    }

    const { messages } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages doit être un tableau non vide' }, { status: 400 })
    }
    for (const m of messages) {
      if (!m.role || !m.content) {
        return NextResponse.json({ error: 'Chaque message doit avoir role et content' }, { status: 400 })
      }
    }
    const totalLength = messages.reduce((acc: number, m: { content: string }) => acc + String(m.content).length, 0)
    if (totalLength > 10000) {
      return NextResponse.json({ error: 'Contenu trop long (max 10 000 caractères)' }, { status: 400 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-20),
      }),
    })

    const data = await response.json()
    const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? 'Désolé, je n\'ai pas pu répondre.'
    return NextResponse.json({ reply: text })
  } catch (err) {
    console.error('Gamos error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
