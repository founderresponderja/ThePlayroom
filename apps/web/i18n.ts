import { getRequestConfig } from 'next-intl/server'
import type { AbstractIntlMessages } from 'next-intl'
import pt from './messages/pt.json'
import en from './messages/en.json'
import es from './messages/es.json'

const supportedLocales = ['pt', 'en', 'es'] as const
type SupportedLocale = (typeof supportedLocales)[number]

const allMessages: Record<SupportedLocale, AbstractIntlMessages> = { pt, en, es }

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(locale)
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: SupportedLocale = requested && isSupportedLocale(requested) ? requested : 'pt'

  return {
    locale,
    messages: allMessages[locale],
  }
})
