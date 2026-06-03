import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { NextIntlClientProvider } from 'next-intl'
import { Navbar } from '../../components/Navbar'
import { AgeGate } from '../../components/AgeGate'

export const metadata = {
  title: 'The Playroom',
  description: 'Privacy-first lifestyle matchmaking',
  icons: {
    icon: '/favicon.ico',
  },
}

interface LocaleLayoutProps {
  children: ReactNode
  params: {
    locale: string
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const messages = (await import(`../../../messages/${params.locale}.json`)).default

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
