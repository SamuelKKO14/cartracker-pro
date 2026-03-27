'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const TOPICS = [
  { label: 'Réglementation import/homologation', icon: '📋' },
  { label: 'Marchés européens & prix', icon: '🗺️' },
  { label: 'Fiscalité & TVA mandataires', icon: '📊' },
  { label: 'Calcul de marge & rentabilité', icon: '💰' },
  { label: 'Véhicules électriques occasion', icon: '⚡' },
  { label: 'Nouvelles règles carte grise', icon: '🪪' },
  { label: 'Tendances marché auto 2025', icon: '📈' },
  { label: 'Optimiser sa prospection client', icon: '🎯' },
]

const CATEGORY_EMOJIS: Record<string, string> = {
  'réglementation': '📋', 'marché': '🗺️', 'business': '💰', 'véhicules': '🚗', 'fiscalité': '📊',
}

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60) + '-' + Date.now().toString(36)
}

export default function NouvelArticlePage() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [customTopic, setCustomTopic] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [step, setStep] = useState<'idle' | 'searching' | 'writing' | 'saving' | 'done'>('idle')
  const [preview, setPreview] = useState<any>(null)
  const [error, setError] = useState('')

  const topic = customTopic || selectedTopic

  async function generateArticle() {
    if (!topic) return
    setGenerating(true)
    setError('')
    setPreview(null)
    setStep('searching')

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Tu es un expert du marché automobile professionnel français. Fais une recherche web rapide sur : "${topic}". Ensuite rédige un article de blog dense et pratique pour des mandataires automobiles.

Réponds UNIQUEMENT avec ce JSON, rien d'autre :
{"title":"Titre accrocheur max 80 caractères","excerpt":"Résumé 1-2 phrases max 180 caractères","category":"réglementation ou marché ou business ou véhicules ou fiscalité","tags":["tag1","tag2","tag3"],"content":"Contenu markdown 400-600 mots. ## pour les sections. Chiffres concrets, conseils actionnables, zéro blabla."}`
          }]
        })
      })

      setStep('writing')
      const data = await res.json()
      let rawText = ''
      for (const block of data.content || []) {
        if (block.type === 'text') rawText += block.text
      }
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Réponse inattendue de l\'IA')
      const article = JSON.parse(jsonMatch[0])
      if (!article.title || !article.content) throw new Error('Article incomplet')
      setPreview(article)
      setStep('idle')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération')
      setStep('idle')
    } finally {
      setGenerating(false)
    }
  }

  async function saveArticle() {
    if (!preview) return
    setStep('saving')
    const slug = slugify(preview.title)
    const words = preview.content.trim().split(/\s+/).length
    const readTime = Math.max(2, Math.round(words / 200))
    const { error: err } = await supabase.from('blog_posts').insert({
      slug, title: preview.title, excerpt: preview.excerpt, content: preview.content,
      category: preview.category, tags: preview.tags || [], read_time: readTime,
      published: true, featured: false, cover_emoji: CATEGORY_EMOJIS[preview.category] || '🚗',
    })
    if (err) { setError('Erreur sauvegarde : ' + err.message); setStep('idle'); return }
    setStep('done')
    setTimeout(() => router.push(`/blog/${slug}`), 1200)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
            <a href="/blog" className="hover:text-orange-500">Blog</a>
            <span>/</span>
            <span>Nouvel article IA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">✨ Générer un article avec l'IA</h1>
          <p className="mt-2 text-gray-500 text-sm">L'IA fait la veille et rédige un article dense en moins d'une minute.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {!preview && (
          <>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Choisir un sujet</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {TOPICS.map(t => (
                <button key={t.label} onClick={() => { setSelectedTopic(t.label); setCustomTopic('') }}
                  className={`text-left p-3 rounded-xl border text-sm transition-all ${selectedTopic === t.label ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 hover:border-orange-200'}`}>
                  <span className="text-xl block mb-1">{t.icon}</span>
                  <span className="leading-snug">{t.label}</span>
                </button>
              ))}
            </div>

            <input type="text" value={customTopic} onChange={e => { setCustomTopic(e.target.value); setSelectedTopic('') }}
              placeholder="Ou saisir un sujet libre..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm mb-6" />

            {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

            <button onClick={generateArticle} disabled={!topic || generating}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-3">
              {generating ? <><span className="animate-spin">⟳</span><span>{step === 'searching' ? 'Recherche en cours...' : 'Rédaction...'}</span></> : <><span>✨</span><span>Générer l'article</span></>}
            </button>
          </>
        )}

        {preview && step !== 'saving' && step !== 'done' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-green-600 flex items-center gap-2"><span>✅</span> Article généré !</p>
              <button onClick={() => { setPreview(null); setStep('idle') }} className="text-sm text-gray-500 hover:text-gray-700">← Recommencer</button>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
              <div className="h-24 flex items-center justify-center text-5xl bg-orange-50 dark:bg-orange-950/20">{CATEGORY_EMOJIS[preview.category] || '🚗'}</div>
              <div className="p-6">
                <span className="text-xs font-medium text-orange-500 uppercase tracking-widest">{preview.category}</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-3">{preview.title}</h2>
                <p className="text-gray-500 text-sm mb-4">{preview.excerpt}</p>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-6 whitespace-pre-line">{preview.content.substring(0, 400)}...</div>
              </div>
            </div>
            {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <button onClick={saveArticle} className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
              <span>💾</span> Publier l'article
            </button>
          </div>
        )}

        {step === 'saving' && <div className="text-center py-20"><div className="text-4xl animate-bounce mb-4">💾</div><p className="text-gray-500">Sauvegarde...</p></div>}
        {step === 'done' && <div className="text-center py-20"><div className="text-5xl mb-4">🎉</div><p className="text-xl font-bold text-gray-900 dark:text-white">Article publié !</p></div>}
      </div>
    </div>
  )
}
