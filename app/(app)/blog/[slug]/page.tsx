import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
    .select('id, slug, title, excerpt, category, cover_emoji, read_time')
    .eq('published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .limit(2)
  return data || []
}

const CATEGORY_COLORS: Record<string, string> = {
  'réglementation': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'marché': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'business': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'véhicules': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'fiscalité': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'general': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post.category, post.slug)
  const paragraphs: string[] = (post.content as string).split('\n\n').filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/blog" className="hover:text-orange-500 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-gray-400 truncate">{post.title}</span>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center text-6xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            {post.cover_emoji}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general}`}>
            {post.category}
          </span>
          <span className="text-sm text-gray-400">{post.read_time} min de lecture</span>
          <span className="text-sm text-gray-400">·</span>
          <span className="text-sm text-gray-400">{formatDate(post.created_at)}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center leading-snug mb-4">
          {post.title}
        </h1>
        <p className="text-center text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          <span className="text-orange-400 text-lg">◆</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-10">
          <div className="space-y-4">
            {paragraphs.map((para, i) => {
              if (para.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3 first:mt-0">
                    {para.replace('## ', '')}
                  </h2>
                )
              }
              if (para.startsWith('### ')) {
                return (
                  <h3 key={i} className="text-base font-semibold text-gray-900 dark:text-white mt-6 mb-2">
                    {para.replace('### ', '')}
                  </h3>
                )
              }
              if (para.includes('|')) {
                const rows = para.split('\n').filter(r => r.includes('|') && !r.match(/^[\|\s\-]+$/))
                return (
                  <div key={i} className="overflow-x-auto my-6">
                    <table className="w-full text-sm">
                      {rows.map((row, ri) => {
                        const cells = row.split('|').filter(c => c.trim())
                        return (
                          <tr key={ri} className={`border-b border-gray-100 dark:border-gray-800 ${ri === 0 ? 'bg-gray-50 dark:bg-gray-800 font-semibold' : ''}`}>
                            {cells.map((cell, ci) => (
                              <td key={ci} className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{cell.trim()}</td>
                            ))}
                          </tr>
                        )
                      })}
                    </table>
                  </div>
                )
              }
              return (
                <p key={i} className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {para.split('**').map((part, pi) =>
                    pi % 2 === 1
                      ? <strong key={pi} className="font-semibold text-gray-900 dark:text-white">{part}</strong>
                      : part
                  )}
                </p>
              )
            })}
          </div>

          {post.tags?.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 mb-3 uppercase tracking-widest">Tags</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Dans la même catégorie</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r: any) => (
                <Link key={r.id} href={`/blog/${r.slug}`}>
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group flex gap-4">
                    <span className="text-3xl flex-shrink-0">{r.cover_emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors text-sm leading-snug">
                        {r.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{r.read_time} min</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/blog" className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
            ← Retour au blog
          </Link>
        </div>
      </article>
    </div>
  )
}
