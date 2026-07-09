import { getRequestConfig } from 'next-intl/server'

const supportedLocales = ['pt', 'en', 'es'] as const

function isSupportedLocale(locale: string): locale is (typeof supportedLocales)[number] {
  return (supportedLocales as readonly string[]).includes(locale)
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale
  const resolvedLocale = locale && isSupportedLocale(locale) ? locale : 'pt'

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  }
})
