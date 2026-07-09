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
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/',
    '/(pt|en|es)/:path*',
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
  ],
}
