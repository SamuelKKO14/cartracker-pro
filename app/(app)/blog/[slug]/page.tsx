import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

async function getPost(slug: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data
}

async function getRelatedPosts(category: string, currentSlug: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, cover_image_url, read_time')
    .eq('published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .limit(2)
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

function getCoverUrl(post: { cover_image_url?: string | null; category: string }, size = '1200x500'): string {
  if (post.cover_image_url) return post.cover_image_url
  const keyword = CATEGORY_KEYWORDS[post.category] || 'car,automobile'
  return `https://source.unsplash.com/${size}/?${keyword}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post.category, post.slug)
  const sources: Array<{ name: string; url: string }> = post.sources || []

  return (
    <div className="h-full overflow-y-auto bg-[#06090f]">
      <div className="bg-[#0d1117] border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/blog" className="hover:text-orange-400 transition-colors">← Retour au blog</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{post.title}</span>
        </div>
      </div>

      <div className="w-full h-56 sm:h-72 overflow-hidden">
        <img
          src={getCoverUrl(post)}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>

      <article className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general}`}>
            {post.category}
          </span>
          <span className="text-sm text-gray-500">{post.read_time} min de lecture</span>
          <span className="text-sm text-gray-700">·</span>
          <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-4">
          {post.title}
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed mb-10">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-orange-400 text-lg">◆</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <div className="bg-[#0d1117] rounded-2xl border border-gray-800 p-6 sm:p-10">
          <div className="prose prose-invert max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:first:mt-0
            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-strong:text-white
            prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
            prose-ul:text-gray-300 prose-li:text-gray-300 prose-li:marker:text-orange-500
            prose-ol:text-gray-300
            prose-blockquote:border-orange-500 prose-blockquote:text-gray-400
            prose-table:text-sm prose-th:text-white prose-th:bg-gray-800 prose-td:text-gray-300
            prose-hr:border-gray-800
            prose-code:text-orange-300 prose-code:bg-gray-800/60 prose-code:rounded prose-code:px-1 prose-code:text-sm">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {post.tags?.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest">Tags</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-3 py-1 bg-gray-800 text-gray-400 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-800">
              <p className="text-sm font-semibold text-gray-300 mb-4">📚 Sources</p>
              <ul className="space-y-2">
                {sources.map((source, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5 flex-shrink-0">→</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-400 hover:underline break-all"
                    >
                      {source.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">Dans la même catégorie</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r: any) => (
                <Link key={r.id} href={`/blog/${r.slug}`}>
                  <div className="bg-[#0d1117] rounded-xl border border-gray-800 overflow-hidden hover:border-orange-500/30 transition-all group flex">
                    {r.cover_image_url && (
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                        <img src={r.cover_image_url} alt={r.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-semibold text-white group-hover:text-orange-400 transition-colors text-sm leading-snug">
                        {r.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{r.read_time} min de lecture</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 text-center pb-8">
          <Link href="/blog" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
            ← Retour au blog
          </Link>
        </div>
      </article>
    </div>
  )
}
