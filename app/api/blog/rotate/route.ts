import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const CATEGORY_KEYWORDS: Record<string, string> = {
  'réglementation': 'law,regulation,europe',
  'marché': 'car,market,europe',
  'business': 'business,finance',
  'véhicules': 'car,electric,automobile',
  'fiscalité': 'tax,finance,document',
  'import': 'shipping,transport,car',
}

const TOPICS: Record<string, string[]> = {
  'réglementation': [
    'Nouvelles règles d\'homologation pour véhicules importés en France',
    'Évolution des normes d\'émissions et impact pour les mandataires auto',
    'Réglementation carte grise pour véhicules d\'occasion européens en 2025',
    'Ce qui change pour l\'import de véhicules après les nouvelles directives UE',
  ],
  'marché': [
    'Tendances des prix de l\'occasion en Europe : analyse par pays',
    'Marchés porteurs pour les mandataires : où acheter en Europe en 2025',
    'Analyse des prix par segment : berlines vs SUV sur le marché européen',
    'Évolution du marché de l\'occasion électrique en Europe',
  ],
  'business': [
    'Comment optimiser ses marges en tant que mandataire auto en 2025',
    'Stratégies de négociation efficaces avec les vendeurs européens',
    'Structurer son activité de mandataire pour réduire les coûts fixes',
    'Outils numériques indispensables pour les mandataires auto modernes',
  ],
  'véhicules': [
    'Véhicules électriques d\'occasion : opportunités et risques pour les mandataires',
    'SUV européens : quels modèles offrent le meilleur rapport import/revente',
    'Hybrides rechargeables d\'occasion : guide pratique pour mandataires',
    'Fiabilité des berlines premium allemandes : ce que disent les données',
  ],
  'fiscalité': [
    'TVA sur véhicules d\'occasion importés : règles et optimisations fiscales',
    'Fiscalité des mandataires auto : comparatif des statuts juridiques',
    'Déclaration des marges sur véhicules d\'occasion : guide complet 2025',
    'Optimiser sa fiscalité en tant que négociant automobile indépendant',
  ],
  'import': [
    'Coûts réels d\'import depuis l\'Allemagne, la Belgique et les Pays-Bas',
    'Transport de véhicules en Europe : comparatif des solutions logistiques',
    'Guide douanier pour l\'import de véhicules depuis des pays hors UE',
    'Délais et procédures d\'immatriculation pour véhicules importés en France',
  ],
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60) + '-' + Date.now().toString(36)
}

function getCoverImageUrl(category: string): string {
  const keyword = CATEGORY_KEYWORDS[category] || 'car,automobile'
  return `https://source.unsplash.com/800x400/?${encodeURIComponent(keyword)}`
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const results: Record<string, unknown> = {}

  // 1. Delete expired articles
  const { count: deletedCount, error: deleteError } = await supabase
    .from('blog_posts')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)

  results.expired_deleted = deleteError ? 0 : (deletedCount ?? 0)

  // 2. Check if publish day (5th of month) or forced
  const today = new Date()
  const isPublishDay = today.getDate() === 5
  const force = request.nextUrl.searchParams.get('force') === 'true'

  if (!isPublishDay && !force) {
    return NextResponse.json({ ...results, message: 'Not publish day, skipping article generation' })
  }

  // Check if articles already published this month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const { count: existingCount } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', firstOfMonth.toISOString())

  if ((existingCount ?? 0) >= 3 && !force) {
    return NextResponse.json({ ...results, message: 'Articles already published this month' })
  }

  // 3. Pick 3 random categories
  const allCategories = Object.keys(TOPICS)
  const selectedCategories = [...allCategories].sort(() => Math.random() - 0.5).slice(0, 3)

  const articles = []

  for (let i = 0; i < selectedCategories.length; i++) {
    const category = selectedCategories[i]
    const topicList = TOPICS[category]
    const topic = topicList[Math.floor(Math.random() * topicList.length)]

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Tu es un expert du marché automobile professionnel français. Rédige un article de blog dense et pratique pour des mandataires automobiles sur le sujet : "${topic}".

Réponds UNIQUEMENT avec ce JSON valide, sans texte autour :
{
  "title": "Titre accrocheur max 80 caractères",
  "excerpt": "Résumé en 2 phrases max 200 caractères",
  "content": "Contenu markdown 500-700 mots. Utilise ## pour les sections, **gras** pour les termes clés. Chiffres concrets, conseils actionnables, exemples pratiques.",
  "tags": ["tag1", "tag2", "tag3"],
  "read_time": 5,
  "sources": [
    {"name": "Nom de la source officielle", "url": "https://..."},
    {"name": "Autre source", "url": "https://..."}
  ]
}`
        }],
      })

      const content = message.content[0]
      if (content.type !== 'text') continue

      let article: any
      try {
        const match = content.text.match(/\{[\s\S]*\}/)
        if (!match) continue
        article = JSON.parse(match[0])
      } catch {
        continue
      }

      if (!article.title || !article.content) continue

      const now = new Date()
      const expiresAt = addMonths(now, 2)

      articles.push({
        slug: slugify(article.title),
        title: article.title,
        excerpt: article.excerpt || '',
        content: article.content,
        category,
        tags: Array.isArray(article.tags) ? article.tags : [],
        read_time: typeof article.read_time === 'number' ? article.read_time : 5,
        published: true,
        featured: i === 0,
        cover_image_url: getCoverImageUrl(category),
        sources: Array.isArray(article.sources) ? article.sources : [],
        expires_at: expiresAt.toISOString(),
        publish_date: now.toISOString().split('T')[0],
      })
    } catch (err) {
      console.error(`Error generating article for category ${category}:`, err)
    }
  }

  if (articles.length > 0) {
    const { error: insertError } = await supabase.from('blog_posts').insert(articles)
    if (insertError) {
      return NextResponse.json({ ...results, error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    ...results,
    success: true,
    articles_created: articles.length,
    titles: articles.map(a => a.title),
  })
}
