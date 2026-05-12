import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // Routes API publiques ou avec leur propre auth (extension Chrome)
  if (pathname.startsWith('/api/extension/')) return response

  // Protect API routes (sauf GET /api/share/[token] et /api/blog/*)
  if (pathname.startsWith('/api/')) {
    const isPublicShareGet =
      request.method === 'GET' && /^\/api\/share\/[^/]+$/.test(pathname)
    const isPublicBlog = pathname.startsWith('/api/blog/')
    if (!isPublicShareGet && !isPublicBlog && !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    return response
  }

  // Pages publiques — toujours accessibles
  const isPublicPage =
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/share/') ||
    pathname === '/cgu' ||
    pathname === '/confidentialite' ||
    pathname === '/contact' ||
    pathname === '/mentions-legales' ||
    pathname.startsWith('/blog')

  // Redirect connecté sur pages auth → dashboard
  if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect app routes
  if (!isPublicPage && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-cartracker\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)$).*)',
  ],
}
