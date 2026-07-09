import { getRequestConfig } from 'next-intl/server'
import type { AbstractIntlMessages } from 'next-intl'
import { headers } from 'next/headers'
import pt from './messages/pt.json'
import en from './messages/en.json'
import es from './messages/es.json'

const supportedLocales = ['pt', 'en', 'es'] as const
type SupportedLocale = (typeof supportedLocales)[number]

const allMessages: Record<SupportedLocale, AbstractIntlMessages> = { pt, en, es }

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(locale)
}

function resolveLocale(fromMiddleware: string | undefined): SupportedLocale {
  if (fromMiddleware && isSupportedLocale(fromMiddleware)) return fromMiddleware

  // Fallback: read the x-next-intl-locale header set by createMiddleware.
  // Needed when clerkMiddleware does not propagate requestLocale context.
  try {
    const headerLocale = headers().get('x-next-intl-locale')
    if (headerLocale && isSupportedLocale(headerLocale)) return headerLocale

    // Last resort: extract locale segment from the pathname header.
    const pathname = headers().get('x-pathname') ?? headers().get('x-forwarded-uri') ?? ''
    const segment = pathname.split('/')[1]
    if (segment && isSupportedLocale(segment)) return segment
  } catch {
    // headers() is unavailable in some edge contexts — fall through to default.
  }

  return 'pt'
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveLocale(await requestLocale)

  return {
    locale,
    messages: allMessages[locale],
  }
})
