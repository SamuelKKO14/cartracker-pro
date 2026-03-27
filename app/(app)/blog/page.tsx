import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

async function getBlogPosts() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  return data || []
}

const CATEGORY_COLORS: Record<string, string> = {
  'réglementation': 'bg-blue-100 text-blue-700',
  'marché': 'bg-green-100 text-green-700',
  'business': 'bg-orange-100 text-orange-700',
  'véhicules': 'bg-purple-100 text-purple-700',
  'fiscalité': 'bg-red-100 text-red-700',
  'general': 'bg-gray-100 text-gray-700',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default async function BlogPage() {
  const posts = await getBlogPosts()
  const featured = posts.find(p => p.featured)
  const rest = posts.filter(p => !p.featured)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-orange-500 uppercase tracking-widest mb-2">Veille professionnelle</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Le Blog des Mandataires</h1>
              <p className="mt-3 text-gray-500 max-w-xl">Réglementation, marchés européens, business, fiscalité — l'info utile pour les pros de l'auto, sans remplissage.</p>
            </div>
            <Link href="/blog/nouveau" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <span>✨</span> Générer un article IA
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {featured && (
          <div className="mb-12">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">À la une</p>
            <Link href={`/blog/${featured.slug}`}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-72 h-48 sm:h-auto flex items-center justify-center text-7xl bg-orange-50 dark:bg-orange-950/20 flex-shrink-0">
                    {featured.cover_emoji}
                  </div>
                  <div className="p-6 sm:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[featured.category] || CATEGORY_COLORS.general}`}>{featured.category}</span>
                      <span className="text-xs text-gray-400">{featured.read_time} min de lecture</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">{featured.title}</h2>
                    <p className="mt-3 text-gray-500">{featured.excerpt}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{formatDate(featured.created_at)}</span>
                      <span className="text-sm font-medium text-orange-500">Lire l'article →</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {rest.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Tous les articles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group h-full flex flex-col">
                    <div className="h-28 flex items-center justify-center text-5xl bg-gray-50 dark:bg-gray-800">{post.cover_emoji}</div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general}`}>{post.category}</span>
                        <span className="text-xs text-gray-400">{post.read_time} min</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors text-base leading-snug">{post.title}</h3>
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {post.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">#{tag}</span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">{formatDate(post.created_at)}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}

        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📰</p>
            <p className="text-gray-500">Aucun article pour l'instant.</p>
            <Link href="/blog/nouveau" className="mt-4 inline-block text-orange-500 hover:underline text-sm">Générer le premier article →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
