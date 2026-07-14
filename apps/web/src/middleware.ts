import createMiddleware from 'next-intl/middleware'
import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const supportedLocales = ['pt', 'en', 'es'] as const

const intlMiddleware = createMiddleware({
  locales: supportedLocales as unknown as string[],
  defaultLocale: 'pt',
  localePrefix: 'always',
  localeDetection: true,
})

export default clerkMiddleware(async (auth, req) => {
  // Initialize Clerk auth context for downstream auth() calls in server components/routes.
  await auth()

  const { pathname, search } = req.nextUrl
  const host = (req.headers.get('host') ?? '').toLowerCase()

  // Keep all user traffic on a single canonical host so session cookies stay consistent.
  if (host === 'theplayroom.pt') {
    const url = req.nextUrl.clone()
    url.protocol = 'https'
    url.hostname = 'www.theplayroom.pt'
    return NextResponse.redirect(url, 308)
  }

  if (pathname === '/sso-callback') {
    const url = req.nextUrl.clone()
    url.pathname = '/pt/sso-callback'
    url.search = search
    return NextResponse.redirect(url)
  }

  if (/^\/(pt|en|es)\/sso-callback(\/.*)?$/.test(pathname)) {
    return NextResponse.next()
  }

  const intlResponse = intlMiddleware(req)
  const location = intlResponse.headers.get('location')
  if (location || intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse
  }

  // Return next-intl response as-is so Clerk middleware request context is preserved for auth().
  return intlResponse
})

export const config = {
  matcher: [
    '/',
    '/api/:path*',
    '/sso-callback',
    '/(pt|en|es)/:path*',
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
  ],
}
