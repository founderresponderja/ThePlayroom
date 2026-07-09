import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Navbar } from '../../components/Navbar'
import { AgeGate } from '../../components/AgeGate'

const supportedLocales = ['pt', 'en', 'es'] as const
type SupportedLocale = (typeof supportedLocales)[number]

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(locale)
}

export const metadata = {
  title: 'The Playroom',
  description: 'Matchmaking privado para o lifestyle.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

interface LocaleLayoutProps {
  children: ReactNode
  params: {
    locale: string
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  if (!isSupportedLocale(params.locale)) {
    redirect('/pt')
  }

  // Explicitly set locale from URL params so useTranslations in all child
  // server components uses the correct locale regardless of requestLocale
  // propagation issues between clerkMiddleware and intlMiddleware.
  setRequestLocale(params.locale)

  const messages = await getMessages()

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={`/${params.locale}/sign-in`}
      signUpUrl={`/${params.locale}/sign-up`}
    >
      <NextIntlClientProvider locale={params.locale} messages={messages}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              const saved = localStorage.getItem('theme');
              const theme = saved || 'dark';
              document.documentElement.setAttribute('data-theme', theme);
            })()
          `,
          }}
        />
        <Navbar locale={params.locale} />
        <main>{children}</main>
        <AgeGate />
      </NextIntlClientProvider>
    </ClerkProvider>
  )
}
