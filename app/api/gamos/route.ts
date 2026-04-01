import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { messages } = await request.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
