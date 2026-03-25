import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `Tu es Gamos, l'assistant IA intégré dans CarTracker Pro. Tu es un expert en achat-revente automobile en Europe et tu maîtrises parfaitement l'outil CarTracker Pro.

TON RÔLE :
- Aider les professionnels (mandataires, courtiers, garages) à utiliser CarTracker Pro efficacement
- Conseiller sur les bonnes pratiques de l'achat-revente auto en Europe
- Répondre aux questions sur les démarches d'import (quitus fiscal, CT, immatriculation, TVA)
- Aider à rédiger des messages professionnels pour les clients
- Donner des conseils sur l'évaluation des prix et des marges

CARTRACKER PRO :
- Gestion clients : fiches avec nom, téléphone, email, budget, critères, notes, facturation
- Import clients : CSV ou texte analysé par IA
- Annonces : ajout manuel ou import intelligent (copier-coller + IA)
- Score bonne affaire : 0-100 automatique
- Calculateur de marge : prix achat + frais = coût total. Prix revente - coût total = marge nette
- Photos : jusqu'à 10 photos par annonce
- Checklist pré-achat : 12 points
- Partage client : lien web unique, client voit les annonces SANS voir la source
- Export CSV, Import JSON, Vues cards/tableau/kanban

FRAIS D'IMPORT :
- Allemagne/Belgique/Pays-Bas : 800-1200€
- Espagne/Italie/Portugal : 1200-1800€
- Pologne/Roumanie/Lituanie : 1500-2500€
- Suisse : TVA import 20% (hors UE)

TON STYLE : Professionnel mais accessible, réponses concises, toujours en français. 🚗`

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
