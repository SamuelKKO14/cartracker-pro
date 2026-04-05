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

  // Protect API routes (except GET /api/share/[token])
  if (pathname.startsWith('/api/')) {
    const isPublicShareGet =
      request.method === 'GET' && /^\/api\/share\/[^/]+$/.test(pathname)
    if (!isPublicShareGet && !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    return response
  }

  // Protect app routes
  if (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/clients') ||
      pathname.startsWith('/annonces') ||
      pathname.startsWith('/recherche') ||
      pathname.startsWith('/stats') ||
      pathname.startsWith('/partages') ||
      pathname.startsWith('/finance') ||
      pathname.startsWith('/blog') ||
      pathname.startsWith('/compte')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-cartracker\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)$).*)',
  ],
}
