// middleware.ts
// middleware.ts  (at the project root, same folder as package.json)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Optional: only import the helper when config exists to avoid runtime throws
function haveSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Only protect /dashboard routes
  if (!req.nextUrl.pathname.startsWith('/dashboard')) return res

  const adminEmail =
    (process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').toLowerCase()

  // If no admin email is configured, don’t crash—just bounce to /
  if (!adminEmail) {
    console.warn('[middleware] ADMIN_EMAIL not set; redirecting non-guarded users to /')
    return NextResponse.redirect(new URL('/', req.url))
  }

  // If Supabase env is missing, fail safe to /login (but don’t crash)
  if (!haveSupabaseEnv()) {
    console.warn('[middleware] Supabase env missing; redirecting to /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    // Lazy import so build doesn’t evaluate if envs are missing
    const { createMiddlewareClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('[middleware] getSession error:', error)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const email = (session.user?.email || '').toLowerCase()
    if (email !== adminEmail) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  } catch (err) {
    console.error('[middleware] unexpected error:', err)
    // Fail-safe: never crash—just send user to login
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
