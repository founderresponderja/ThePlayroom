import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { getValidClerkSession } from '@/lib/auth'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage({
  params,
}: {
  params: { locale: string }
}) {
  const req = new NextRequest('https://www.theplayroom.pt', {
    headers: new Headers(headers()),
  })
  const { userId } = await getValidClerkSession(req)
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const userResult = await (db as any).execute(sql`select * from users where clerk_user_id = ${userId} limit 1`)
  const user = userResult?.[0] as { onboardingComplete?: boolean } | undefined

  if (!user) redirect(`/${params.locale}/sign-in`)
  if (user.onboardingComplete) redirect(`/${params.locale}/dashboard`)

  return <OnboardingWizard />
}
