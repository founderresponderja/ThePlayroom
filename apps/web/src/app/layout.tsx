import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Playroom',
  description: 'Privacy-first lifestyle matchmaking for the consensual non-monogamy community.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const locale = headers().get('x-next-intl-locale') ?? cookies().get('NEXT_LOCALE')?.value ?? 'pt'

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
