import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Playroom',
  description: 'Privacy-first lifestyle matchmaking for the consensual non-monogamy community.',
  icons: {
    icon: [
      { url: '/brand/pineapple-app-icon.png?v=20260709b', type: 'image/png' },
    ],
    apple: [{ url: '/brand/pineapple-app-icon.png?v=20260709b' }],
    shortcut: ['/brand/pineapple-app-icon.png?v=20260709b'],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const locale = headers().get('x-next-intl-locale') ?? cookies().get('NEXT_LOCALE')?.value ?? 'pt'

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
