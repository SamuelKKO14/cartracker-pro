import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VALID_FUEL = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL']
const VALID_GEARBOX = ['Manuelle', 'Automatique']
const VALID_BODY = ['Berline', 'SUV', 'Citadine', 'Break', 'Coupé', 'Cabriolet', 'Utilitaire', 'Monospace']
const VALID_SELLER = ['particulier', 'professionnel']

function safeNumber(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return isNaN(n) ? null : Math.round(n)
}

function safeEnum(v: unknown, allowed: string[]): string | null {
  if (typeof v !== 'string') return null
  const exact = allowed.find(a => a === v)
  if (exact) return exact
  const lower = allowed.find(a => a.toLowerCase() === v.toLowerCase())
  return lower ?? null
}

function safeCountry(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const upper = v.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(upper) ? upper : null
}

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

    // Build multi-image content blocks — send up to 10 to Claude
    type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    const content: Anthropic.MessageParam['content'] = []

    for (const dataUrl of images.slice(0, 10)) {
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
      max_tokens: 2000,
      system: `Tu es un expert en analyse d'annonces automobiles. Je te montre plusieurs photos liées à UNE SEULE annonce de voiture. Certaines photos montrent la voiture (extérieur, intérieur), d'autres montrent les caractéristiques techniques (capture d'écran de site d'annonce, fiche technique, panneau d'affichage chez un concessionnaire, etc.).

TA MISSION : extraire avec un maximum de précision TOUS les champs ci-dessous. Tu dois être DÉDUCTIF : si une info n'est pas écrite explicitement, déduis-la à partir des autres photos (badge sur la carrosserie, plaque, indications visibles, design typique d'une génération, etc.).

CHAMPS À EXTRAIRE (réponds en JSON strict, null si vraiment impossible à déterminer) :
{
  "brand": "Marque exacte (ex: Volvo, BMW, Mercedes-Benz)",
  "model": "Modèle exact (ex: XC60, Série 3, Classe C)",
  "generation": "Génération/code châssis si identifiable (ex: G20, W205, MK2)",
  "year": "Année (number, ex: 2020). Cherche dans : photo de specs, plaque d'immatriculation (format SIV = pas d'année, mais ancien FNI = oui), carte grise visible, design de la voiture (génération typique), badges/écussons spéciaux",
  "km": "Kilométrage (number, sans espaces). Cherche dans : photo du compteur (priorité 1), specs écrites, capture d'annonce. Si tu vois 'X xxx km' ou 'X.xxx km', convertis en number",
  "price": "Prix en € (number, sans espaces). Cherche dans : capture d'annonce, étiquette prix chez concessionnaire, panneau d'affichage. Si plusieurs prix visibles (HT/TTC/financement), prends le prix de vente TTC le plus visible",
  "horsepower": "Puissance en CV/ch (number). Cherche dans : specs, badge sur la voiture (ex: T5, 250, AMG 43), nom du moteur",
  "fuel": "Carburant — DOIT être EXACTEMENT une de ces valeurs : 'Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'. Déduis depuis : badge (TDI/HDI/Blue = Diesel, TSI/T5/T6 = Essence/Hybride sur Volvo, e-tron/EV = Électrique), specs, type de moteur visible",
  "gearbox": "Boîte — DOIT être EXACTEMENT 'Manuelle' ou 'Automatique'. Cherche : levier de vitesse visible dans intérieur (priorité), specs, indication BVM/BVA/DSG/Geartronic = Automatique, EDC = Automatique",
  "body": "Carrosserie — DOIT être EXACTEMENT une de : 'Berline', 'SUV', 'Citadine', 'Break', 'Coupé', 'Cabriolet', 'Utilitaire', 'Monospace'. Déduis visuellement.",
  "color": "Couleur principale en français (ex: 'Noir métallisé', 'Blanc', 'Gris foncé')",
  "country": "Code pays ISO 2 lettres. Déduis depuis : plaque d'immatriculation (FR, DE, BE, ES, IT, NL, PT, PL, RO, AT, CH, SE, NO, LT, LU, DK), drapeau, langue du texte des photos specs, devise (€ = pas concluant, mais £/CHF/SEK = indique). Par défaut FR si annonce en français",
  "seller": "Type de vendeur — DOIT être 'particulier' OU 'professionnel'. Indices PRO : logo concessionnaire visible, panneau d'affichage type concession, photo studio/showroom, mention 'garantie 12 mois', plusieurs voitures alignées en arrière-plan, texte 'professionnel' sur l'annonce. Par défaut 'particulier' si aucun indice pro",
  "first_owner": "Booléen (true/false). Cherche mention '1ère main' / 'premier propriétaire' / 'first owner'. Par défaut false si pas mentionné",
  "notes": "Résumé court (max 200 chars) de toute info pertinente trouvée mais qui n'entre pas dans les champs ci-dessus : options, équipements premium, état décrit, historique entretien, etc.",
  "photo_classification": [
    {"index": 0, "type": "vehicle"},
    {"index": 1, "type": "specs"}
  ]
}

photo_classification : pour CHAQUE image envoyée (index 0 à N-1), dis si elle montre :
- "vehicle" = la voiture en elle-même (extérieur, intérieur, détails carrosserie, compteur)
- "specs" = capture d'écran d'annonce, fiche technique, panneau de prix, etc.

RÈGLES IMPORTANTES :
- Sois AGRESSIVEMENT déductif — il vaut mieux donner une valeur probable que null
- Si tu vois "Volvo XC60 T5" → tu sais que c'est un SUV, essence ou hybride, et tu peux déduire la fourchette d'années par le design
- Pour le PRIX : si tu vois un prix dans une capture d'annonce, c'est lui en priorité, même si pas écrit en énorme
- Pour les KM : un compteur de tableau de bord est la source #1 absolue
- CASSE STRICTE pour fuel, gearbox, body, seller — utilise EXACTEMENT les valeurs listées
- Pour year, km, price, horsepower : retourne des NUMBERS, pas des strings ("2020" devient 2020)

Réponds UNIQUEMENT le JSON, rien d'autre. Pas de markdown, pas d'explications.`,
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

    // ── Validate & normalize AI output ─────────────────────────
    extracted.year = safeNumber(extracted.year)
    extracted.km = safeNumber(extracted.km)
    extracted.price = safeNumber(extracted.price)
    extracted.horsepower = safeNumber(extracted.horsepower)
    extracted.fuel = safeEnum(extracted.fuel, VALID_FUEL)
    extracted.gearbox = safeEnum(extracted.gearbox, VALID_GEARBOX)
    extracted.body = safeEnum(extracted.body, VALID_BODY)
    extracted.seller = safeEnum(extracted.seller, VALID_SELLER)
    extracted.country = safeCountry(extracted.country)
    extracted.first_owner = extracted.first_owner === true

    if (typeof extracted.brand !== 'string' || !extracted.brand.trim()) extracted.brand = null
    if (typeof extracted.model !== 'string' || !extracted.model.trim()) extracted.model = null
    if (typeof extracted.generation !== 'string' || !extracted.generation.trim()) extracted.generation = null
    if (typeof extracted.color !== 'string' || !extracted.color.trim()) extracted.color = null
    if (typeof extracted.notes !== 'string' || !extracted.notes.trim()) extracted.notes = null

    return NextResponse.json({ data: extracted })
  } catch (err) {
    console.error('analyze-photos error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
