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
  "price": "Prix de vente en € (number sans espace ni décimale). Cherche AGRESSIVEMENT : 1) Étiquette prix grande taille (chiffres en gros sur les photos d'annonce, panneau concession) 2) Texte 'Prix', '€', 'EUR', 'TTC', 'HT' suivi d'un nombre 3) Mentions 'Notre prix', 'Prix net', 'À vendre' 4) Si plusieurs prix visibles : prends le PLUS GROS et le plus visible (c'est généralement le prix TTC affiché) 5) Ignore les prix barrés (anciens prix promotionnels). Si aucun prix visible nulle part, retourne null. Mais examine attentivement TOUTES les photos avant de conclure.",
  "horsepower": "Puissance en CV/ch (number entier). RECHERCHE PRIORITAIRE — examine ATTENTIVEMENT chaque image pour trouver : 1) Texte 'Puissance DIN', 'Puissance fiscale', 'Puissance moteur', 'kW', 'ch', 'CV', 'HP' dans les photos de specs 2) Badge sur la voiture (ex: T5 sur Volvo = 254ch, T6 = 310ch, D4 = 190ch, D5 = 235ch, 320d BMW = 190ch, 330d = 265ch, M3 = 480ch, AMG 43 = 390ch, AMG 63 = 510ch) 3) Nom complet du moteur visible (ex: TDI 150, TSI 200) 4) Tableau de caractéristiques sur capture d'annonce. Si tu vois '190 ch' ou '190 CH' ou '190 hp' ou '140 kW' (kW à convertir : multiplier par 1.36), retourne le nombre en ch. Ne JAMAIS laisser vide si une valeur numérique de puissance est visible quelque part dans les images.",
  "fuel": "Carburant — DOIT être EXACTEMENT une de ces valeurs : 'Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'. Déduis depuis : badge (TDI/HDI/Blue = Diesel, TSI/T5/T6 = Essence/Hybride sur Volvo, e-tron/EV = Électrique), specs, type de moteur visible",
  "gearbox": "Boîte — DOIT être EXACTEMENT 'Manuelle' ou 'Automatique'. Cherche : levier de vitesse visible dans intérieur (priorité), specs, indication BVM/BVA/DSG/Geartronic = Automatique, EDC = Automatique",
  "body": "Carrosserie — DOIT être EXACTEMENT une de : 'Berline', 'SUV', 'Citadine', 'Break', 'Coupé', 'Cabriolet', 'Utilitaire', 'Monospace'. Déduis visuellement OU par le modèle (voir section DÉDUCTION ci-dessous).",
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

DÉDUCTION MODÈLE → CARROSSERIE (si la marque + modèle correspond, déduis automatiquement sans hésitation) :
SUV : XC40, XC60, XC90, X1, X2, X3, X4, X5, X6, X7, Q2, Q3, Q5, Q7, Q8, GLA, GLB, GLC, GLE, GLS, G-Class, Cayenne, Macan, Tiguan, Touareg, T-Roc, T-Cross, Kuga, Puma, Captur, Kadjar, Koleos, Arkana, 2008, 3008, 5008, C3 Aircross, C5 Aircross, Tucson, Santa Fe, Kona, Sportage, Sorento, Niro, RAV4, C-HR, Highlander, CX-3, CX-5, CX-30, Atlas, Range Rover, Discovery, Defender, Evoque, Velar, Compass, Renegade, Cherokee, Wrangler, Outback, Forester, Karoq, Kodiaq
BERLINE : Série 3, Série 5, Série 7, Classe C, Classe E, Classe S, A3, A4, A5, A6, A7, A8, Passat, Talisman, 508, Insignia, Mondeo, Civic Sedan, Accord, Camry, Model 3, Model S, S60, S90, Stinger, Optima, Sonata
CITADINE : Polo, Up!, 208, 108, Twingo, Clio, Sandero, Fiesta, Ka, Yaris, Aygo, C1, C3, 500, Panda, Ibiza, Corsa, Picanto, Rio, i10, i20, Swift, Jazz
BREAK : Touring, V60, V90, A4 Avant, A6 Avant, Classe C Break, Classe E Break, Passat Variant, Octavia Combi, Superb Combi, 308 SW, 508 SW
COUPÉ : Série 4, Série 8, Classe C Coupé, A5 Coupé, TT, 911, 718, Cayman
CABRIOLET : Z4, Classe C Cabriolet, A5 Cabriolet, TT Roadster, Boxster, 911 Cabriolet, MX-5
UTILITAIRE : Master, Trafic, Kangoo, Berlingo, Partner, Expert, Jumpy, Boxer, Ducato, Transit, Sprinter, Vito, Crafter, Combo
MONOSPACE : Espace, Scenic, Grand Scenic, Touran, Sharan, Galaxy, S-Max
Si le modèle n'est PAS dans cette liste, déduis visuellement. Ne laisse JAMAIS body vide pour un modèle reconnaissable.

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

    // If AI returned horsepower in kW (< 60 is suspicious for a car), convert to ch
    if (typeof extracted.horsepower === 'number' && extracted.horsepower > 0 && extracted.horsepower < 60) {
      extracted.horsepower = Math.round((extracted.horsepower as number) * 1.36)
    }
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
