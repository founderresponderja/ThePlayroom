import createMiddleware from 'next-intl/middleware'
import { clerkMiddleware } from '@clerk/nextjs/server'

const supportedLocales = ['pt', 'en', 'es']

const intlMiddleware = createMiddleware({
  locales: supportedLocales,
  defaultLocale: 'pt',
  localePrefix: 'always',
  localeDetection: true,
})

export default clerkMiddleware((auth, req) => {
  void auth
  const response = intlMiddleware(req)

  // Ensure x-next-intl-locale propagates as a request header so that
  // getRequestConfig can read it via headers() when requestLocale fails.
  const localeFromPath = req.nextUrl.pathname.split('/')[1] ?? ''
  const resolvedLocale: string =
    supportedLocales.includes(localeFromPath) ? localeFromPath : 'pt'
  response.headers.set('x-next-intl-locale', resolvedLocale)

  return response
})

export const config = {
  matcher: [
    '/',
    '/(pt|en|es)/:path*',
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
  ],
}
