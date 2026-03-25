import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Texte vide' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `Tu es un assistant qui extrait des informations de contact depuis du texte brut.
Analyse le texte et extrait chaque personne comme un objet JSON.
Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans explication.
Format : [{"name": "string", "phone": "string ou null", "email": "string ou null", "budget": number ou null, "criteria": "string ou null", "notes": "string ou null"}]
Si une information n'est pas présente, mets null.`,
      messages: [{ role: 'user', content: text }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Réponse inattendue' }, { status: 500 })
    }

    let extracted: unknown[]
    try {
      extracted = JSON.parse(content.text)
    } catch {
      const match = content.text.match(/\[[\s\S]*\]/)
      if (!match) {
        return NextResponse.json({ error: 'JSON invalide dans la réponse' }, { status: 500 })
      }
      extracted = JSON.parse(match[0])
    }

    if (!Array.isArray(extracted)) {
      return NextResponse.json({ error: 'Réponse invalide (tableau attendu)' }, { status: 500 })
    }

    return NextResponse.json({ data: extracted })
  } catch (err) {
    console.error('analyze-clients error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
