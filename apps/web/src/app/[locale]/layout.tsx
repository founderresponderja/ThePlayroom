import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { Navbar } from '../../components/Navbar'
import { AgeGate } from '../../components/AgeGate'

interface LocaleLayoutProps {
  children: ReactNode
  params: {
    locale: string
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const messages = (await import(`../../../messages/${params.locale}.json`)).default

  return (
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
  )
}
