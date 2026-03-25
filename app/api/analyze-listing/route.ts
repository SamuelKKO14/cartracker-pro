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
      max_tokens: 500,
      system: `Tu es un assistant spécialisé dans l'extraction de données d'annonces automobiles européennes.
À partir d'un texte d'annonce brut (copié-collé depuis un site), extrais les informations structurées et retourne UNIQUEMENT un JSON valide, sans texte autour, avec ces champs exactement :
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
  "first_owner": boolean | null,
  "horsepower": number | null,
  "color": string | null,
  "url": string | null,
  "notes": string | null
}
Règles :
- country : code ISO 2 lettres (FR, DE, BE, NL, ES, IT, PL, PT, RO, AT, CH, SE, NO, LT, CZ, HU)
- km et price : entiers sans unité ni séparateurs
- Si une valeur est absente ou incertaine, mets null
- Ne déduis pas ce qui n'est pas explicitement mentionné
- notes : mets-y uniquement des informations pertinentes non couvertes par les autres champs (options, état, historique…)`,
      messages: [
        {
          role: 'user',
          content: text,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Réponse inattendue' }, { status: 500 })
    }

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(content.text)
    } catch {
      // Try to extract JSON from the response if it has surrounding text
      const match = content.text.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: 'JSON invalide dans la réponse' }, { status: 500 })
      }
      extracted = JSON.parse(match[0])
    }

    return NextResponse.json({ data: extracted })
  } catch (err) {
    console.error('analyze-listing error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
