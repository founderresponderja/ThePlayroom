import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Playroom',
  description: 'Privacy-first lifestyle matchmaking for the consensual non-monogamy community.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt" suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
