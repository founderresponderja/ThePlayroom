import type { ReactNode } from 'react'
import { auth } from '@clerk/nextjs/server'
import { ClerkProvider } from '@clerk/nextjs'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
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

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) {
    throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
  }

  // Explicitly set locale from URL params so useTranslations in all child
  // server components uses the correct locale regardless of requestLocale
  // propagation issues between clerkMiddleware and intlMiddleware.
  setRequestLocale(params.locale)

  const { userId } = await auth()
  const userResult = userId
    ? await (db as any).execute(sql`
        select
          account_type as "accountType",
          subscription_tier as "subscriptionTier"
        from users
        where clerk_user_id = ${userId}
        limit 1
      `)
    : null
  const currentUser = userResult?.[0] as { accountType?: string; subscriptionTier?: string | null } | undefined

  const messages = await getMessages()
  const signInUrl = `/${params.locale}/sign-in`
  const signUpUrl = `/${params.locale}/sign-up`
  const postSignInUrl = `/${params.locale}/matches`
  const postSignUpUrl = `/${params.locale}/onboarding`

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      signInForceRedirectUrl={postSignInUrl}
      signInFallbackRedirectUrl={postSignInUrl}
      signUpForceRedirectUrl={postSignUpUrl}
      signUpFallbackRedirectUrl={postSignUpUrl}
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
        <Navbar locale={params.locale} accountType={currentUser?.accountType ?? null} />
        <main>{children}</main>
        <AgeGate />
      </NextIntlClientProvider>
    </ClerkProvider>
  )
}
