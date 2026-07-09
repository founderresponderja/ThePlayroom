import createMiddleware from 'next-intl/middleware'
import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const supportedLocales = ['pt', 'en', 'es']

const intlMiddleware = createMiddleware({
  locales: supportedLocales,
  defaultLocale: 'pt',
  localePrefix: 'always',
  localeDetection: true,
})

export default clerkMiddleware((auth, req) => {
  void auth

  const intlResponse = intlMiddleware(req)

  // If intlMiddleware wants to redirect (e.g. /en/ → /en), let it.
  const location = intlResponse.headers.get('location')
  if (location || intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse
  }

  // Extract locale from URL path and inject it as a REQUEST header.
  // clerkMiddleware does not propagate intlMiddleware's request-header mutations,
  // so we do it explicitly here via NextResponse.next({ request: { headers } }).
  const localeFromPath = req.nextUrl.pathname.split('/')[1] ?? ''
  const locale: string = supportedLocales.includes(localeFromPath) ? localeFromPath : 'pt'

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-next-intl-locale', locale)

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    '/',
    '/(pt|en|es)/:path*',
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
  ],
}
