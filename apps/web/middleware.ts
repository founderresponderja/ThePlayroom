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

function hasLocalePrefix(pathname: string) {
  return /^\/(pt|en|es)(\/|$)/.test(pathname)
}

export default clerkMiddleware((auth, req) => {
  void auth

  const { pathname, search } = req.nextUrl

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

  const localeFromPath = hasLocalePrefix(pathname) ? (pathname.split('/')[1] ?? 'pt') : 'pt'
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-next-intl-locale', localeFromPath)

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    '/',
    '/sso-callback',
    '/(pt|en|es)/:path*',
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
  ],
}
