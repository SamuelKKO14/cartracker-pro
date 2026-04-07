import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Lock } from 'lucide-react'

const ADMIN_ID = 'f0c6e539-b1e3-4b33-842f-68a38532745b'

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
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
  return data || []
}

const CATEGORY_COLORS: Record<string, string> = {
  'réglementation': 'bg-blue-500/20 text-blue-300',
  'marché': 'bg-green-500/20 text-green-300',
  'business': 'bg-orange-500/20 text-orange-300',
  'véhicules': 'bg-purple-500/20 text-purple-300',
  'fiscalité': 'bg-red-500/20 text-red-300',
  'import': 'bg-yellow-500/20 text-yellow-300',
  'general': 'bg-gray-500/20 text-gray-300',
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  'réglementation': 'law,regulation,europe',
  'marché': 'car,market,europe',
  'business': 'business,finance',
  'véhicules': 'car,electric,automobile',
  'fiscalité': 'tax,finance,document',
  'import': 'shipping,transport,car',
}

function getCoverUrl(post: { cover_image_url?: string | null; category: string }): string {
  if (post.cover_image_url) return post.cover_image_url
  const keyword = CATEGORY_KEYWORDS[post.category] || 'car,automobile'
  return `https://source.unsplash.com/800x400/?${keyword}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default async function BlogPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== ADMIN_ID) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="flex flex-col items-center text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
            <Lock size={40} className="text-orange-400" />
          </div>
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full tracking-wide">
            Prochainement
          </span>
          <h1 className="text-xl font-bold text-gray-100 mb-3">
            Fonctionnalité en cours de développement
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            Le magazine auto intelligent sera bientôt disponible. Notre équipe travaille activement sur cette fonctionnalité pour vous offrir du contenu exclusif sur le marché automobile.
          </p>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            Retour au Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const posts = await getBlogPosts()
  const featured = posts.find(p => p.featured)
  const rest = posts.filter(p => !p.featured)

  return (
    <div className="h-full overflow-y-auto bg-[#06090f]">
      <div className="bg-[#0d1117] border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-sm font-medium text-orange-500 uppercase tracking-widest mb-2">Veille professionnelle</p>
          <h1 className="text-3xl font-bold text-white">Le Blog des Mandataires</h1>
          <p className="mt-3 text-gray-400 max-w-xl">Réglementation, marchés européens, business, fiscalité — l'info utile pour les pros de l'auto, sans remplissage.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {featured && (
          <div className="mb-12">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">À la une</p>
            <Link href={`/blog/${featured.slug}`}>
              <div className="bg-[#0d1117] rounded-2xl border border-gray-800 overflow-hidden hover:border-orange-500/30 transition-all group">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-72 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                    <img
                      src={getCoverUrl(featured)}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 sm:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[featured.category] || CATEGORY_COLORS.general}`}>
                        {featured.category}
                      </span>
                      <span className="text-xs text-gray-500">{featured.read_time} min de lecture</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="mt-3 text-gray-400">{featured.excerpt}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{formatDate(featured.created_at)}</span>
                      <span className="text-sm font-medium text-orange-400">Lire l'article →</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {rest.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">Tous les articles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <article className="bg-[#0d1117] rounded-xl border border-gray-800 overflow-hidden hover:border-orange-500/30 transition-all hover:-translate-y-0.5 group h-full flex flex-col">
                    <div className="h-40 overflow-hidden flex-shrink-0">
                      <img
                        src={getCoverUrl(post)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general}`}>
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-500">{post.read_time} min</span>
                      </div>
                      <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors text-base leading-snug">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {post.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-500 rounded">#{tag}</span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-gray-600 border-t border-gray-800 pt-3">{formatDate(post.created_at)}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}

        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📰</p>
            <p className="text-gray-500">Aucun article disponible pour l'instant.</p>
            <p className="text-sm text-gray-600 mt-2">Les articles sont publiés automatiquement chaque mois.</p>
          </div>
        )}
      </div>
    </div>
  )
}
